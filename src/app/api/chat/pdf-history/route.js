import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import PdfChat from "@/models/PdfChat";

/**
 * GET /api/chat/pdf-history
 *
 * ?action=sessions          → list all PDF chat sessions for the user
 * ?documentId=<id>          → get messages for a specific document session
 */
async function handleGet(request) {
  await connectToDatabase();
  const user = request.user;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const documentId = searchParams.get("documentId");

  if (action === "sessions") {
    const sessions = await PdfChat.find({
      userId: user._id,
      isActive: true,
    })
      .select("documentId fileName fileSizeMB lastMessageAt messages")
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        documentId: s.documentId.toString(),
        fileName: s.fileName,
        fileSizeMB: s.fileSizeMB || "0",
        lastMessageAt: s.lastMessageAt,
        messageCount: s.messages?.length || 0,
      })),
    });
  }

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const session = await PdfChat.findOne({
    userId: user._id,
    documentId,
    isActive: true,
  })
    .select("messages fileName documentId")
    .lean();

  return NextResponse.json({
    success: true,
    documentId,
    sessionId: session?._id?.toString() || null,
    messages: session?.messages || [],
  });
}

/**
 * POST /api/chat/pdf-history
 *
 * Upserts the full message array for a PDF chat session.
 * Body: { documentId, fileName, fileSizeMB, messages }
 */
async function handlePost(request) {
  await connectToDatabase();
  const user = request.user;

  const { documentId, fileName, fileSizeMB, messages } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }

  const result = await PdfChat.findOneAndUpdate(
    { userId: user._id, documentId, isActive: true },
    {
      $set: {
        messages,
        fileName: fileName || "document.pdf",
        fileSizeMB: fileSizeMB || "0",
        lastMessageAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({
    success: true,
    sessionId: result._id.toString(),
    messageCount: messages.length,
  });
}

/**
 * DELETE /api/chat/pdf-history?documentId=<id>&action=delete
 *
 * action=delete → permanent delete; default → soft-clear
 */
async function handleDelete(request) {
  await connectToDatabase();
  const user = request.user;

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");
  const action = searchParams.get("action");

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  if (action === "delete") {
    await PdfChat.deleteMany({ userId: user._id, documentId });
    return NextResponse.json({ success: true, message: "Session permanently deleted" });
  }

  await PdfChat.updateOne(
    { userId: user._id, documentId, isActive: true },
    { $set: { isActive: false, messages: [], clearedAt: new Date() } }
  );

  return NextResponse.json({ success: true, message: "Chat history cleared" });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
export const dynamic = "force-dynamic";
