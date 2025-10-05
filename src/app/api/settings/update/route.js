import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

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
    const usersCol = db.collection('users');
    
    const user = await usersCol.findOne({ _id: decoded.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.settings || {
        notifications: {
          email: true,
          push: false,
          marketing: true,
          courseUpdates: true,
        },
        privacy: {
          profileVisible: true,
          progressVisible: false,
          achievementsVisible: true,
        },
        preferences: {
          theme: 'light',
          language: 'en',
          difficulty: 'beginner',
          learningStyle: 'visual',
          dailyGoal: 30,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
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

    const { notifications, privacy, preferences } = await request.json();

    const { db } = await connectToDatabase();
    const usersCol = db.collection('users');
    
    const result = await usersCol.updateOne(
      { _id: decoded.id },
      { 
        $set: { 
          settings: {
            notifications,
            privacy,
            preferences,
            updatedAt: new Date()
          }
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: { notifications, privacy, preferences }
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}