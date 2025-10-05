import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
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

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const type = searchParams.get('type') || 'courses'; // courses, guides, etc.

    const bookmarksCol = db.collection('bookmarks');
    const skip = (page - 1) * limit;

    const [bookmarks, totalCount] = await Promise.all([
      bookmarksCol.find({ 
        userId: decoded.id, 
        type 
      }).skip(skip).limit(limit).toArray(),
      bookmarksCol.countDocuments({ 
        userId: decoded.id, 
        type 
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      bookmarks,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookmarks: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
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

    const { itemId, type, itemData } = await request.json();
    const { db } = await connectToDatabase();
    const bookmarksCol = db.collection('bookmarks');

    // Check if already bookmarked
    const existingBookmark = await bookmarksCol.findOne({
      userId: decoded.id,
      itemId,
      type
    });

    if (existingBookmark) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 400 });
    }

    const bookmark = {
      userId: decoded.id,
      itemId,
      type,
      itemData,
      createdAt: new Date()
    };

    await bookmarksCol.insertOne(bookmark);

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const type = searchParams.get('type');

    if (!itemId || !type) {
      return NextResponse.json({ error: 'Missing itemId or type' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const bookmarksCol = db.collection('bookmarks');

    const result = await bookmarksCol.deleteOne({
      userId: decoded.id,
      itemId,
      type
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
