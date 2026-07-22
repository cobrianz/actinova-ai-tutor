import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Discussion from "@/models/Discussion";
import DiscussionPost from "@/models/DiscussionPost";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { discussionId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit")) || 50);
  const skip = Math.max(0, parseInt(searchParams.get("skip")) || 0);

  const posts = await DiscussionPost.find({ discussionId })
    .populate("authorId", "name email")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return NextResponse.json({ success: true, posts });
}

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id, discussionId } = await params;
  const { content, parentPostId } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }
  if (discussion.isClosed) {
    return NextResponse.json({ error: "Discussion is closed" }, { status: 400 });
  }

  const post = await DiscussionPost.create({
    discussionId,
    classroomId: id,
    authorId: user._id,
    content: content.trim(),
    parentPostId: parentPostId || null,
  });

  await Discussion.findByIdAndUpdate(discussionId, {
    $inc: { postCount: 1 },
    $set: { lastActivityAt: new Date() },
  });

  const populated = await post.populate("authorId", "name email");
  return NextResponse.json({ success: true, post: populated });
}

export const GET = combineMiddleware(withErrorHandling)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
