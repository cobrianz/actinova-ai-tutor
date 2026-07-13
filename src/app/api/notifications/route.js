import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth, withErrorHandling, combineMiddleware } from '@/lib/middleware';

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const notifications = await db.collection("notifications")
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  const unreadCount = await db.collection("notifications")
    .countDocuments({ userId: user._id, read: false });

  return NextResponse.json({
    success: true,
    notifications,
    unreadCount
  });
}

async function handlePatch(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  await db.collection("notifications").updateMany(
    { userId: user._id, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({
    success: true
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const PATCH = combineMiddleware(withErrorHandling, withAuth)(handlePatch);
