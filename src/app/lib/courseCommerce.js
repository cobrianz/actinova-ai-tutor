import { ObjectId } from "mongodb";

export const MARKETPLACE_PRICE_USD = 6;
export const COURSE_ACCESS_DAYS = 30;

export const MARKETPLACE_SEED_COURSES = [
  {
    slug: "full-stack-web-development-career-path",
    title: "Full-Stack Web Development Career Path",
    description:
      "Go from frontend fundamentals to production-ready full-stack systems with React, Node.js, APIs, and deployment workflows.",
    category: "Web Development",
    difficulty: "intermediate",
    duration: "30 days",
    instructor: "Actirova Academy",
    thumbnail: "/hero.png",
    badge: "Admin Pick",
    featured: true,
    price: MARKETPLACE_PRICE_USD,
    isPremium: true,
    isGlobal: true,
    isPublished: true,
    tierRequired: "premium-course",
    students: 1240,
    rating: 4.9,
    tags: ["React", "Node.js", "MongoDB", "APIs"],
    highlights: [
      "Build complete portfolio projects",
      "Learn full request-to-database workflows",
      "Ship with production deployment patterns",
    ],
  },
  {
    slug: "data-analytics-with-excel-sql-and-power-bi",
    title: "Data Analytics with Excel, SQL and Power BI",
    description:
      "Learn how to clean data, query insights, and build dashboards that answer real business questions.",
    category: "Data Analytics",
    difficulty: "beginner",
    duration: "30 days",
    instructor: "Actirova Academy",
    thumbnail: "/hero.png",
    badge: "Hot Skill",
    featured: false,
    price: MARKETPLACE_PRICE_USD,
    isPremium: true,
    isGlobal: true,
    isPublished: true,
    tierRequired: "premium-course",
    students: 980,
    rating: 4.8,
    tags: ["Excel", "SQL", "Power BI", "Dashboards"],
    highlights: [
      "Clean and model raw business data",
      "Write practical SQL for reporting",
      "Present insights through dashboards",
    ],
  },
  {
    slug: "ai-productivity-and-prompt-engineering",
    title: "AI Productivity and Prompt Engineering",
    description:
      "Use modern AI tools effectively for research, writing, automation, and structured problem-solving at work.",
    category: "Artificial Intelligence",
    difficulty: "beginner",
    duration: "30 days",
    instructor: "Actirova Academy",
    thumbnail: "/hero.png",
    badge: "Trending",
    featured: false,
    price: MARKETPLACE_PRICE_USD,
    isPremium: true,
    isGlobal: true,
    isPublished: true,
    tierRequired: "premium-course",
    students: 1560,
    rating: 4.95,
    tags: ["AI", "Prompting", "Automation", "Workflows"],
    highlights: [
      "Create reliable prompts for common tasks",
      "Design repeatable AI workflows",
      "Use AI safely in professional settings",
    ],
  },
];

export function normalizeTopicKey(topic = "") {
  return topic.trim().toLowerCase().replace(/\s+/g, " ");
}

export function slugifyCourseTitle(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getCourseAccessExpiry(baseDate = new Date()) {
  const expiryDate = new Date(baseDate);
  expiryDate.setDate(expiryDate.getDate() + COURSE_ACCESS_DAYS);
  return expiryDate;
}

export async function ensureMarketplaceSeedCourses(db) {
  const coursesCol = db.collection("courses");
  const now = new Date();
  const seedTitles = MARKETPLACE_SEED_COURSES.map((course) => course.title);

  await Promise.all(
    MARKETPLACE_SEED_COURSES.map((course) =>
      coursesCol.updateOne(
        {
          isGlobal: true,
          isPremium: true,
          $or: [{ slug: course.slug }, { title: course.title }],
        },
        {
          $set: {
            ...course,
            updatedAt: now,
            createdBy: null,
          },
          $unset: {
            modules: "",
            totalModules: "",
            totalLessons: "",
            lessonsCount: "",
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      )
    )
  );

  await coursesCol.deleteMany({
    isGlobal: true,
    isPremium: true,
    createdBy: null,
    title: { $nin: seedTitles },
  });
}

export async function getMarketplaceEnrollment(db, userId, courseId) {
  if (!userId || !courseId) return null;

  return db.collection("enrollments").findOne({
    userId: new ObjectId(userId),
    courseId: new ObjectId(courseId),
    type: "marketplace-course",
  });
}

export function buildAccessSummary(enrollment) {
  if (!enrollment) {
    return {
      hasAccess: false,
      isExpired: false,
      daysLeft: 0,
      actionLabel: `Unlock for $${MARKETPLACE_PRICE_USD}`,
    };
  }

  const expiryDate = enrollment.expiryDate ? new Date(enrollment.expiryDate) : null;
  const now = new Date();
  const isExpired = !expiryDate || expiryDate <= now;
  const msLeft = expiryDate ? expiryDate.getTime() - now.getTime() : 0;
  const daysLeft = isExpired ? 0 : Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return {
    hasAccess: !isExpired,
    isExpired,
    daysLeft,
    expiryDate,
    actionLabel: isExpired ? `Renew Access for $${MARKETPLACE_PRICE_USD}` : "Start Learning",
  };
}

export async function grantMarketplaceCourseAccess({
  db,
  userId,
  courseId,
  reference,
  amount,
  currency,
  expiryDate: explicitExpiryDate,
}) {
  const now = new Date();
  const expiryDate = explicitExpiryDate ? new Date(explicitExpiryDate) : getCourseAccessExpiry(now);

  await db.collection("enrollments").updateOne(
    {
      userId: new ObjectId(userId),
      courseId: new ObjectId(courseId),
      type: "marketplace-course",
    },
    {
      $set: {
        userId: new ObjectId(userId),
        courseId: new ObjectId(courseId),
        type: "marketplace-course",
        status: "active",
        amount: amount ?? MARKETPLACE_PRICE_USD,
        currency: currency || "USD",
        reference,
        startedAt: now,
        expiryDate,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { expiryDate };
}

function buildMarketplaceDescriptionFromCourse(course) {
  const topic = course.originalTopic || course.title || course.topic || "this course";
  const firstModules = Array.isArray(course.modules)
    ? course.modules
        .slice(0, 3)
        .map((module) => module?.title)
        .filter(Boolean)
    : [];

  if (!firstModules.length) {
    return `Learn ${topic} through a complete guided curriculum with interactive lessons and practical structure.`;
  }

  return `Learn ${topic} through ${firstModules.join(", ")}, and a full guided curriculum built inside Actirova.`;
}

function buildMarketplaceHighlightsFromCourse(course) {
  const lessonTitles = Array.isArray(course.modules)
    ? course.modules
        .flatMap((module) => module?.lessons || [])
        .map((lesson) => (typeof lesson === "string" ? lesson : lesson?.title))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  if (lessonTitles.length) {
    return lessonTitles;
  }

  return [
    "Structured premium course outline",
    "Interactive lesson-by-lesson learning",
    "Reusable in the global marketplace",
  ];
}

export async function publishPaidLibraryCourseToMarketplace({
  db,
  userId,
  libraryCourse,
}) {
  if (!db || !userId || !libraryCourse?._id) {
    return null;
  }

  const ownerId = new ObjectId(userId);
  const slug = slugifyCourseTitle(libraryCourse.title || libraryCourse.originalTopic || libraryCourse.topic || "");

  if (!slug) {
    return null;
  }

  const coursesCol = db.collection("courses");
  const now = new Date();
  const existingMarketplaceCourse = await coursesCol.findOne({
    isGlobal: true,
    isPremium: true,
    $or: [
      { sourceLibraryCourseId: libraryCourse._id },
      { slug },
      {
        title: libraryCourse.title || libraryCourse.originalTopic || libraryCourse.topic,
        difficulty: String(libraryCourse.difficulty || libraryCourse.level || "beginner").toLowerCase(),
      },
    ],
  });

  const marketplaceDoc = {
    title: libraryCourse.title || libraryCourse.originalTopic || libraryCourse.topic || "Untitled Course",
    slug,
    description:
      libraryCourse.description || buildMarketplaceDescriptionFromCourse(libraryCourse),
    category: libraryCourse.category || "Community Premium",
    difficulty: String(libraryCourse.difficulty || libraryCourse.level || "beginner").toLowerCase(),
    duration: libraryCourse.duration || "30 days",
    instructor: libraryCourse.instructor || "Actirova Community",
    thumbnail: libraryCourse.thumbnail || "/hero.png",
    badge: libraryCourse.badge || "Community Pick",
    featured: false,
    price: MARKETPLACE_PRICE_USD,
    isPremium: true,
    isGlobal: true,
    isPublished: true,
    tierRequired: "premium-course",
    students: existingMarketplaceCourse?.students || 0,
    rating: existingMarketplaceCourse?.rating || 4.7,
    tags: Array.isArray(libraryCourse.tags) ? libraryCourse.tags : [],
    highlights:
      Array.isArray(libraryCourse.highlights) && libraryCourse.highlights.length
        ? libraryCourse.highlights
        : buildMarketplaceHighlightsFromCourse(libraryCourse),
    totalModules: libraryCourse.totalModules || libraryCourse.modules?.length || 20,
    totalLessons: libraryCourse.totalLessons || 100,
    lessonsCount: libraryCourse.totalLessons || 100,
    modules: Array.isArray(libraryCourse.modules) ? libraryCourse.modules : [],
    sourceLibraryCourseId: libraryCourse._id,
    sourceOwnerId: ownerId,
    sourceType: "user-paid-course",
    createdBy: ownerId,
    updatedAt: now,
  };

  let marketplaceCourseId = existingMarketplaceCourse?._id || null;

  if (existingMarketplaceCourse) {
    await coursesCol.updateOne(
      { _id: existingMarketplaceCourse._id },
      {
        $set: marketplaceDoc,
      }
    );
    marketplaceCourseId = existingMarketplaceCourse._id;
  } else {
    const insertResult = await coursesCol.insertOne({
      ...marketplaceDoc,
      createdAt: now,
    });
    marketplaceCourseId = insertResult.insertedId;
  }

  await db.collection("library").updateOne(
    { _id: libraryCourse._id },
    {
      $set: {
        sourceMarketplaceCourseId: marketplaceCourseId,
        updatedAt: now,
      },
    }
  );

  await grantMarketplaceCourseAccess({
    db,
    userId,
    courseId: marketplaceCourseId.toString(),
    reference: libraryCourse.premiumPaymentReference || `premium-generation:${libraryCourse._id}`,
    amount: MARKETPLACE_PRICE_USD,
    currency: "USD",
    expiryDate: libraryCourse.premiumAccessExpiresAt || getCourseAccessExpiry(now),
  });

  return marketplaceCourseId;
}

export async function syncUserPaidCoursesToMarketplace({
  db,
  userId,
}) {
  if (!db || !userId) {
    return 0;
  }

  const paidCourses = await db.collection("library").find({
    userId: new ObjectId(userId),
    format: "course",
    premiumAccessExpiresAt: { $ne: null },
    $or: [
      { sourceMarketplaceCourseId: { $exists: false } },
      { sourceMarketplaceCourseId: null },
    ],
  }).toArray();

  let syncedCount = 0;
  for (const course of paidCourses) {
    const marketplaceId = await publishPaidLibraryCourseToMarketplace({
      db,
      userId,
      libraryCourse: course,
    });

    if (marketplaceId) {
      syncedCount += 1;
    }
  }

  return syncedCount;
}

export async function savePremiumGenerationIntent({
  db,
  userId,
  topic,
  difficulty,
  reference,
  amount,
  currency,
}) {
  const now = new Date();
  const accessExpiresAt = getCourseAccessExpiry(now);
  const topicKey = normalizeTopicKey(topic);

  await db.collection("premium_generation_intents").updateOne(
    {
      userId: new ObjectId(userId),
      topicKey,
      difficulty,
    },
    {
      $set: {
        userId: new ObjectId(userId),
        topic,
        topicKey,
        difficulty,
        status: "paid",
        reference,
        amount: amount ?? MARKETPLACE_PRICE_USD,
        currency: currency || "USD",
        accessExpiresAt,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { accessExpiresAt };
}

export async function getPaidPremiumGenerationIntent({
  db,
  userId,
  topic,
  difficulty,
}) {
  return db.collection("premium_generation_intents").findOne({
    userId: new ObjectId(userId),
    topicKey: normalizeTopicKey(topic),
    difficulty,
    status: "paid",
  });
}

export async function consumePremiumGenerationIntent({
  db,
  intentId,
  generatedCourseId,
}) {
  await db.collection("premium_generation_intents").updateOne(
    { _id: new ObjectId(intentId) },
    {
      $set: {
        status: "consumed",
        generatedCourseId: new ObjectId(generatedCourseId),
        consumedAt: new Date(),
      },
    }
  );
}

export async function cloneMarketplaceCourseToLibrary({
  db,
  userId,
  course,
  accessExpiryDate,
}) {
  const libraryCol = db.collection("library");
  const existing = await libraryCol.findOne({
    userId: new ObjectId(userId),
    sourceCourseId: course._id,
    sourceType: "marketplace-course",
  });

  if (existing) {
    await libraryCol.updateOne(
      { _id: existing._id },
      {
        $set: {
          premiumAccessExpiresAt: accessExpiryDate,
          lastAccessed: new Date(),
        },
      }
    );
    return existing._id;
  }

  const now = new Date();
  const doc = {
    userId: new ObjectId(userId),
    sourceCourseId: course._id,
    sourceType: "marketplace-course",
    title: course.title,
    topic: course.slug || normalizeTopicKey(course.title),
    originalTopic: course.title,
    difficulty: String(course.difficulty || "beginner").toLowerCase(),
    format: "course",
    level: String(course.difficulty || "beginner").toLowerCase(),
    totalModules: course.totalModules || course.modules?.length || 0,
    totalLessons: course.totalLessons || course.lessonsCount || 0,
    modules: course.modules || [],
    isPremium: true,
    premiumAccessExpiresAt: accessExpiryDate,
    progress: 0,
    completed: false,
    pinned: false,
    createdAt: now,
    lastAccessed: now,
  };

  const result = await libraryCol.insertOne(doc);
  return result.insertedId;
}

export async function syncExpiredPremiumLibraryAccess(db, user) {
  if (!user?._id) return 0;

  const plan = String(user?.subscription?.plan || "").toLowerCase();
  const tier = String(user?.subscription?.tier || "").toLowerCase();
  const hasActivePaidPlan =
    user?.subscription?.status === "active" &&
    ["pro", "premium", "enterprise"].includes(plan || tier);

  if (hasActivePaidPlan) {
    return 0;
  }

  const result = await db.collection("library").updateMany(
    {
      userId: new ObjectId(user._id),
      format: "course",
      isPremium: true,
      premiumAccessExpiresAt: { $lt: new Date() },
    },
    {
      $set: {
        isPremium: false,
        premiumAccessExpiredAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount || 0;
}
