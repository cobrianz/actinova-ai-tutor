import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

// === GET: List & Search Courses ===
async function handleGet(request) {
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
  const search = searchParams.get("search")?.trim() || "";

  // Build MongoDB filter
  const filter = { isPublished: true };

  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;

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

  const sanitizedCourses = courses.map((course) => ({
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
    price: course.price,
    tags: course.tags || [],
    createdAt: course.createdAt,
  }));

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
}

// === POST: Create New Course (Admin/Instructor Only) ===
async function handlePost(request) {
  const user = request.user;
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
}

export const GET = combineMiddleware(withErrorHandling, withAuth({ optional: true }))(handleGet);
export const POST = combineMiddleware(withErrorHandling, withAuth({ roles: ["admin", "instructor"] }))(handlePost);

