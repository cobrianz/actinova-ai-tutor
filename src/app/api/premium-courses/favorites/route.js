import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function getFavoritesHandler(req) {
  const { db } = await connectToDatabase();
  const user = req.user;
  if (!user) return NextResponse.json({ favorites: [] });
  const docs = await db.collection('staff_favorites').find({ userId: new ObjectId(user._id) }).toArray();
  return NextResponse.json({ favorites: docs.map(d => d.pickId) });
}

async function toggleFavoriteHandler(req) {
  const { db } = await connectToDatabase();
  const user = req.user;
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { pickId } = await req.json();
  const key = { userId: new ObjectId(user._id), pickId: Number(pickId) };
  const existing = await db.collection('staff_favorites').findOne(key);
  if (existing) {
    await db.collection('staff_favorites').deleteOne(key);
    return NextResponse.json({ favorited: false });
  } else {
    await db.collection('staff_favorites').insertOne({ ...key, createdAt: new Date() });
    return NextResponse.json({ favorited: true });
  }
}

export const GET = withErrorHandling(withAuth(getFavoritesHandler));
export const POST = withErrorHandling(withAuth(toggleFavoriteHandler));


