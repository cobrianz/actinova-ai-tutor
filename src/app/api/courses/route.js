// src/app/api/courses/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { checkCourseAccess } from "@/lib/planMiddleware";

// === GET: List & Search Courses ===
async function handleGet(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit")) || 12)
    );
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get("category")?.trim() || null;
    const difficulty = searchParams.get("difficulty")?.trim() || null;
    const isPremium = searchParams.get("isPremium");
    const search = searchParams.get("search")?.trim() || "";

    // Build MongoDB filter
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (isPremium !== null) filter.isPremium = isPremium === "true";

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { title: regex },
        { description: regex },
        { instructor: regex },
        { tags: regex },
      ];
    }

    const coursesCol = db.collection("courses");

    const [courses, totalCount] = await Promise.all([
      coursesCol
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),

      coursesCol.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Check access if user is authenticated (using optional auth)
    const user = request.user;

    const sanitizedCourses = await Promise.all(
      courses.map(async (course) => {
        let hasAccess = true;
        let accessError = null;

        if (course.isPremium) {
          if (user) {
            const access = await checkCourseAccess(user._id.toString(), course._id.toString());
            hasAccess = access.hasAccess;
            accessError = access.reason;
          } else {
            hasAccess = false;
            accessError = "Authentication required for premium courses";
          }
        }

        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          thumbnail: course.thumbnail,
          category: course.category,
          difficulty: course.difficulty,
          duration: course.duration,
          lessonsCount: course.lessonsCount,
          rating: course.rating || 0,
          students: course.students || 0,
          isPremium: course.isPremium || false,
          tierRequired: course.tierRequired || "free",
          price: course.price,
          tags: course.tags || [],
          createdAt: course.createdAt,
          hasAccess,
          accessError,
        };
      })
    );

    return NextResponse.json({
      success: true,
      courses: sanitizedCourses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    throw error;
  }
}

// === POST: Create New Course (Admin/Instructor Only) ===
async function handlePost(request) {
  const user = request.user;

  try {
    const { db } = await connectToDatabase();
    const coursesCol = db.collection("courses");

    const body = await request.json();

    // Basic validation
    const required = ["title", "description", "category", "difficulty"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}`, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
    }

    const newCourse = {
      ...body,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      students: 0,
      rating: 0,
      reviews: [],
      isPublished: body.isPublished || false,
      lessonsCount: body.lessonsCount || 0,
      tags: body.tags || [],
      isPremium: body.isPremium || false,
      tierRequired: body.tierRequired || "pro",
    };

    const result = await coursesCol.insertOne(newCourse);

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        course: {
          id: result.insertedId.toString(),
          ...newCourse,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/courses error:", error);
    throw error;
  }
}

// Apply middleware
// GET uses optional auth, so we don't strictly require it but we handle it if present
export const GET = withErrorHandling(async (req, ctx) => {
  // Try to inject user but don't fail if not present
  try {
    const handler = withAuth(handleGet);
    const resp = await handler(req, ctx);
    if (resp.status === 401) {
      // If 401 from withAuth, call handleGet without user
      return handleGet(req, ctx);
    }
    return resp;
  } catch (e) {
    return handleGet(req, ctx);
  }
});

export const POST = withErrorHandling(
  withAuth(handlePost, { roles: ["admin", "instructor"] })
);

