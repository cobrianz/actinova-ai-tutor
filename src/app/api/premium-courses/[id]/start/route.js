import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import {
  getMarketplaceEnrollment,
  buildAccessSummary,
  normalizeTopicKey,
  slugifyCourseTitle,
} from "@/lib/courseCommerce";
import { getTrackedUsageSummary } from "@/lib/usageSummary";

function getPaidTierStatus(user) {
  const plan = String(user?.subscription?.plan || "").toLowerCase();
  const tier = String(user?.subscription?.tier || "").toLowerCase();
  const status = user?.subscription?.status;
  const isEnterprise = (tier === "enterprise" || plan === "enterprise") && status === "active";
  const isPremium =
    (tier === "pro" ||
      plan === "pro" ||
      plan === "premium" ||
      tier === "enterprise" ||
      plan === "enterprise") &&
    status === "active";

  return { isPremium, isEnterprise };
}

async function cloneGeneratedMarketplaceCourseToUser({
  db,
  userId,
  sourceCourse,
  marketplaceCourse,
  accessExpiryDate,
}) {
  const now = new Date();
  const sourceModules = Array.isArray(sourceCourse.modules) ? sourceCourse.modules : [];
  const clonedDoc = {
    userId: new ObjectId(userId),
    title: sourceCourse.title || marketplaceCourse.title,
    topic: sourceCourse.topic || normalizeTopicKey(marketplaceCourse.title),
    originalTopic: sourceCourse.originalTopic || marketplaceCourse.title,
    difficulty: String(
      sourceCourse.difficulty || sourceCourse.level || marketplaceCourse.difficulty || "beginner"
    ).toLowerCase(),
    format: "course",
    level: String(
      sourceCourse.level || sourceCourse.difficulty || marketplaceCourse.difficulty || "beginner"
    ).toLowerCase(),
    totalModules: sourceCourse.totalModules || sourceModules.length || 20,
    totalLessons:
      sourceCourse.totalLessons ||
      sourceCourse.lessonsCount ||
      sourceModules.reduce((count, module) => count + (module.lessons?.length || 0), 0) ||
      100,
    modules: sourceModules,
    isPremium: true,
    sourceMarketplaceCourseId: marketplaceCourse._id,
    premiumAccessExpiresAt: accessExpiryDate || sourceCourse.premiumAccessExpiresAt || null,
    premiumPaymentReference: sourceCourse.premiumPaymentReference || null,
    progress: 0,
    completed: false,
    pinned: false,
    createdAt: now,
    lastAccessed: now,
  };

  const result = await db.collection("library").insertOne(clonedDoc);
  return result.insertedId.toString();
}

async function handlePost(request, { params }) {
  const user = request.user;
  const resolvedParams = await params;
  const courseId = resolvedParams?.id;

  if (!ObjectId.isValid(courseId)) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const course = await db.collection("courses").findOne({
    _id: new ObjectId(courseId),
    isGlobal: true,
    isPublished: true,
    isPremium: true,
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { isPremium, isEnterprise } = getPaidTierStatus(user);
  let access;
  if (isPremium) {
    const usage = await getTrackedUsageSummary(db, user);
    const courseUsage = usage?.details?.courses || null;
    const limitReached =
      !isEnterprise && Boolean(courseUsage?.limit !== null && courseUsage?.used >= courseUsage?.limit);

    access = {
      hasAccess: !limitReached,
      isExpired: false,
      daysLeft: 30,
      actionLabel: limitReached ? "Monthly limit reached" : "Start Learning",
      source: "subscription",
      limitReached,
      usage: courseUsage,
    };
  } else {
    const enrollment = await getMarketplaceEnrollment(db, user._id.toString(), courseId);
    access = buildAccessSummary(enrollment);
  }

  if (!access.hasAccess) {
    return NextResponse.json(
      {
        error: access.limitReached
          ? "Monthly premium course limit reached"
          : access.isExpired
            ? "Course access expired"
            : "Course is locked",
        access,
      },
      { status: 403 }
    );
  }

  const existingLibraryCourse = await db.collection("library").findOne({
    userId: new ObjectId(user._id.toString()),
    format: "course",
    $or: [
      { sourceMarketplaceCourseId: course._id },
      { originalTopic: course.title },
      { title: course.title },
      { topic: normalizeTopicKey(course.title) },
    ],
  });

  let shouldForceRegenerate = !existingLibraryCourse;

  if (existingLibraryCourse) {
    const nextCourseAccess = {
      isPremium: true,
      lastAccessed: new Date(),
    };

    if (access.expiryDate) {
      nextCourseAccess.premiumAccessExpiresAt = access.expiryDate;
    }

    await db.collection("library").updateOne(
      { _id: existingLibraryCourse._id },
      { $set: nextCourseAccess }
    );
  }

  if (!existingLibraryCourse) {
    const reusableGeneratedCourse = await db.collection("library").findOne({
      userId: { $ne: new ObjectId(user._id.toString()) },
      format: "course",
      modules: { $exists: true, $ne: [] },
      $or: [
        { sourceMarketplaceCourseId: course._id },
        { originalTopic: course.title },
        { title: course.title },
        { topic: normalizeTopicKey(course.title) },
      ],
    });

    if (reusableGeneratedCourse) {
      await cloneGeneratedMarketplaceCourseToUser({
        db,
        userId: user._id.toString(),
        sourceCourse: reusableGeneratedCourse,
        marketplaceCourse: course,
        accessExpiryDate: access.expiryDate || null,
      });
      shouldForceRegenerate = false;
    }
  }

  return NextResponse.json({
    success: true,
    topic: course.slug || slugifyCourseTitle(course.title),
    originalTopic: course.title,
    difficulty: String(course.difficulty || "beginner").toLowerCase(),
    marketplaceCourseId: course._id.toString(),
    premiumRequested: true,
    forceRegenerate: shouldForceRegenerate,
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withAuth
)(handlePost);
