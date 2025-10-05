import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const isPremium = searchParams.get('isPremium') || '';

    const coursesCol = db.collection('courses');
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (isPremium !== '') filter.isPremium = isPremium === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    const [courses, totalCount] = await Promise.all([
      coursesCol.find(filter).skip(skip).limit(limit).toArray(),
      coursesCol.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseData = await request.json();
    const { db } = await connectToDatabase();
    const coursesCol = db.collection('courses');

    // Add metadata
    const newCourse = {
      ...courseData,
      createdBy: decoded.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      students: 0,
      rating: 0,
      reviews: []
    };

    const result = await coursesCol.insertOne(newCourse);
    
    return NextResponse.json({
      success: true,
      course: { ...newCourse, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
