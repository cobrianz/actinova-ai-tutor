import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    // Check authentication (optional for now)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    const { db } = await connectToDatabase();
    const notesCol = db.collection('user_notes');

    let query = { userId };
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;

    const notes = await notesCol.find(query).sort({ updatedAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      notes
    });

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication (optional for now)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { courseId, lessonId, content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const notesCol = db.collection('user_notes');

    const noteData = {
      userId,
      courseId: courseId || null,
      lessonId: lessonId || null,
      title: title || 'Untitled Note',
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if note already exists for this lesson
    const existingNote = await notesCol.findOne({
      userId,
      courseId: courseId || null,
      lessonId: lessonId || null
    });

    let result;
    if (existingNote) {
      // Update existing note
      result = await notesCol.updateOne(
        { _id: existingNote._id },
        { 
          $set: { 
            content, 
            title: title || existingNote.title,
            updatedAt: new Date() 
          } 
        }
      );
    } else {
      // Create new note
      result = await notesCol.insertOne(noteData);
    }

    return NextResponse.json({
      success: true,
      message: existingNote ? 'Note updated successfully' : 'Note saved successfully',
      noteId: existingNote ? existingNote._id : result.insertedId
    });

  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Check authentication (optional for now)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const notesCol = db.collection('user_notes');

    const result = await notesCol.deleteOne({
      _id: noteId,
      userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Note not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
