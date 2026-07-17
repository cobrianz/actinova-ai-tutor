import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import PdfDocument from "@/models/PdfDocument";

/**
 * POST /api/pdf-documents
 *
 * Saves extracted PDF text (per page) to the database.
 * Returns the documentId for subsequent chat calls.
 *
 * Body: { fileName, fileSizeMB, pages: [{page, text}], fullText, contentHash }
 */
async function handlePost(request) {
  await connectToDatabase();
  const user = request.user;

  const body = await request.json();
  const { fileName, fileSizeMB, pages, fullText, contentHash } = body;

  if (!fileName?.trim()) {
    return NextResponse.json({ error: "fileName is required" }, { status: 400 });
  }
  if (!Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json({ error: "pages array is required" }, { status: 400 });
  }
  if (!fullText?.trim()) {
    return NextResponse.json({ error: "fullText is required" }, { status: 400 });
  }

  // Deduplication: if same user uploads the same document again, reuse it
  if (contentHash) {
    const existing = await PdfDocument.findOne({
      userId: user._id,
      contentHash,
    }).lean();

    if (existing) {
      // Update lastAccessedAt and return the existing doc
      await PdfDocument.updateOne(
        { _id: existing._id },
        { $set: { lastAccessedAt: new Date() } }
      );
      return NextResponse.json({
        success: true,
        documentId: existing._id.toString(),
        reused: true,
        totalPages: existing.totalPages,
      });
    }
  }

  const doc = await PdfDocument.create({
    userId: user._id,
    fileName: fileName.trim(),
    fileSizeMB: fileSizeMB || "0",
    contentHash: contentHash || null,
    pages,
    totalPages: pages.length,
    fullText: fullText.slice(0, 10_000_000), // 10 MB cap
    lastAccessedAt: new Date(),
  });

  return NextResponse.json({
    success: true,
    documentId: doc._id.toString(),
    reused: false,
    totalPages: doc.totalPages,
  });
}

/**
 * GET /api/pdf-documents
 *
 * Returns the list of saved PDF documents for the authenticated user.
 */
async function handleGet(request) {
  await connectToDatabase();
  const user = request.user;

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("id");

  // Fetch a single document's pages (for the chat API)
  if (documentId) {
    const doc = await PdfDocument.findOne({
      _id: documentId,
      userId: user._id,
    })
      .select("fileName fileSizeMB pages totalPages fullText")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Update lastAccessedAt
    await PdfDocument.updateOne(
      { _id: doc._id },
      { $set: { lastAccessedAt: new Date() } }
    );

    return NextResponse.json({ success: true, document: doc });
  }

  // List all documents
  const docs = await PdfDocument.find({ userId: user._id })
    .select("fileName fileSizeMB totalPages createdAt lastAccessedAt")
    .sort({ lastAccessedAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    success: true,
    documents: docs.map((d) => ({
      id: d._id.toString(),
      fileName: d.fileName,
      fileSizeMB: d.fileSizeMB,
      totalPages: d.totalPages,
      createdAt: d.createdAt,
      lastAccessedAt: d.lastAccessedAt,
    })),
  });
}

/**
 * DELETE /api/pdf-documents?id=<documentId>
 */
async function handleDelete(request) {
  await connectToDatabase();
  const user = request.user;

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("id");

  if (!documentId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = await PdfDocument.deleteOne({
    _id: documentId,
    userId: user._id,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
export const dynamic = "force-dynamic";
