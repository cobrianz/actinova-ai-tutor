import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import {
  ensureMarketplaceSeedCourses,
  getMarketplaceEnrollment,
  buildAccessSummary,
  MARKETPLACE_PRICE_USD,
  normalizeTopicKey,
  slugifyCourseTitle,
  syncUserPaidCoursesToMarketplace,
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

  return {
    isPremium,
    isEnterprise,
  };
}

async function handleGet(request) {
  const { db } = await connectToDatabase();
  await ensureMarketplaceSeedCourses(db);
  if (request.user?._id) {
    await syncUserPaidCoursesToMarketplace({
      db,
      userId: request.user._id.toString(),
    });
  }

  const coursesCol = db.collection("courses");
  const courses = await coursesCol
    .find({ isGlobal: true, isPublished: true, isPremium: true })
    .sort({ featured: -1, createdAt: -1, rating: -1 })
    .toArray();
  const courseIds = courses.map((course) => course._id);

  const [marketplaceEnrollments, marketplaceLibraryCopies] = courseIds.length
    ? await Promise.all([
        db
          .collection("enrollments")
          .find(
            {
              type: "marketplace-course",
              courseId: { $in: courseIds },
            },
            { projection: { courseId: 1, userId: 1 } }
          )
          .toArray(),
        db
          .collection("library")
          .find(
            {
              format: "course",
              sourceMarketplaceCourseId: { $in: courseIds },
            },
            { projection: { sourceMarketplaceCourseId: 1, userId: 1 } }
          )
          .toArray(),
      ])
    : [[], []];

  const studentCounts = new Map();
  marketplaceEnrollments.forEach((entry) => {
    const courseId = entry.courseId?.toString();
    const userId = entry.userId?.toString();
    if (!courseId || !userId) return;

    if (!studentCounts.has(courseId)) {
      studentCounts.set(courseId, new Set());
    }
    studentCounts.get(courseId).add(userId);
  });

  marketplaceLibraryCopies.forEach((entry) => {
    const courseId = entry.sourceMarketplaceCourseId?.toString();
    const userId = entry.userId?.toString();
    if (!courseId || !userId) return;

    if (!studentCounts.has(courseId)) {
      studentCounts.set(courseId, new Set());
    }
    studentCounts.get(courseId).add(userId);
  });

  const user = request.user;
  const userId = user?._id?.toString();
  const { isPremium, isEnterprise } = getPaidTierStatus(user);
  const usage = user ? await getTrackedUsageSummary(db, user) : null;
  const courseUsage = usage?.details?.courses || null;
  const existingLibraryCourses = userId
    ? await db
        .collection("library")
        .find(
          {
            userId: new ObjectId(userId),
            format: "course",
          },
          {
            projection: {
              sourceMarketplaceCourseId: 1,
              title: 1,
              topic: 1,
              originalTopic: 1,
            },
          }
        )
        .toArray()
    : [];
  const limitReached =
    Boolean(isPremium) && !isEnterprise && Boolean(courseUsage?.limit !== null && courseUsage?.used >= courseUsage?.limit);

  const enriched = await Promise.all(
    courses.map(async (course) => {
      let access;

      if (isPremium) {
        access = {
          hasAccess: !limitReached,
          isExpired: false,
          daysLeft: 30,
          actionLabel: limitReached ? "Monthly limit reached" : "Start Learning",
          source: "subscription",
          usage: courseUsage || null,
          limitReached,
        };
      } else {
        const enrollment = userId
          ? await getMarketplaceEnrollment(db, userId, course._id.toString())
          : null;
        access = {
          ...buildAccessSummary(enrollment),
          source: "purchase",
          usage: null,
          limitReached: false,
        };
      }

      const hasGenerated = existingLibraryCourses.some((entry) => {
        const sourceId = entry.sourceMarketplaceCourseId?.toString();
        return (
          sourceId === course._id.toString() ||
          String(entry.originalTopic || "").toLowerCase() === String(course.title || "").toLowerCase() ||
          String(entry.title || "").toLowerCase() === String(course.title || "").toLowerCase() ||
          normalizeTopicKey(entry.topic || "") === normalizeTopicKey(course.title || "")
        );
      });

      return {
        id: course._id.toString(),
        slug: course.slug || slugifyCourseTitle(course.title),
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        instructor: course.instructor || "Actirova Academy",
        thumbnail: course.thumbnail || "/hero.png",
        badge: course.badge || "Premium",
        featured: Boolean(course.featured),
        isPremium: true,
        isGlobal: true,
        price: course.price || MARKETPLACE_PRICE_USD,
        rating: course.rating || 0,
        students: studentCounts.get(course._id.toString())?.size || 0,
        totalModules: course.totalModules || course.modules?.length || 20,
        totalLessons: course.totalLessons || course.lessonsCount || 100,
        highlights: course.highlights || [],
        hasGenerated,
        access,
      };
    })
  );

  return NextResponse.json({
    success: true,
    courses: enriched,
  });
}

async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  const { db } = await connectToDatabase();

  const required = ["title", "description", "category", "difficulty"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const doc = {
    title: body.title,
    description: body.description,
    category: body.category,
    difficulty: String(body.difficulty).toLowerCase(),
    duration: body.duration || "30 days",
    instructor: body.instructor || "Actirova Academy",
    thumbnail: body.thumbnail || "/hero.png",
    badge: body.badge || "Admin Pick",
    featured: Boolean(body.featured),
    slug: body.slug || slugifyCourseTitle(body.title),
    isPremium: true,
    isGlobal: true,
    isPublished: body.isPublished !== false,
    price: Number(body.price || MARKETPLACE_PRICE_USD),
    tierRequired: "premium-course",
    students: Number(body.students || 0),
    rating: Number(body.rating || 0),
    highlights: Array.isArray(body.highlights) ? body.highlights : [],
    totalModules: Number(body.totalModules || body.modules?.length || 0),
    totalLessons: Number(body.totalLessons || body.lessonsCount || 0),
    lessonsCount: Number(body.totalLessons || body.lessonsCount || 0),
    tags: Array.isArray(body.tags) ? body.tags : [],
    modules: Array.isArray(body.modules) ? body.modules : [],
    createdBy: new ObjectId(user._id),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("courses").insertOne(doc);

  return NextResponse.json(
    {
      success: true,
      course: {
        ...doc,
        id: result.insertedId.toString(),
      },
    },
    { status: 201 }
  );
}

export const GET = combineMiddleware(
  withErrorHandling,
  (handler) => withAuth(handler, { optional: true })
)(handleGet);

export const POST = combineMiddleware(
  withErrorHandling,
  (handler) => withAuth(handler, { roles: ["admin"] })
)(handlePost);
