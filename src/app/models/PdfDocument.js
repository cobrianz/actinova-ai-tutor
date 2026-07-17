import mongoose from "mongoose";

/**
 * Stores per-page extracted text for a PDF uploaded by a user.
 * Each page is stored separately so the API route can build a
 * page-labelled prompt and the AI can cite specific page numbers.
 */
const pdfPageSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true },
    text: { type: String, default: "" },
  },
  { _id: false }
);

const pdfDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSizeMB: {
      type: String,
      default: "0",
    },
    /** SHA-256 hex of the full extracted text — used for deduplication */
    contentHash: {
      type: String,
      index: true,
    },
    pages: [pdfPageSchema],
    totalPages: {
      type: Number,
      default: 0,
    },
    /** Full text joined for quick full-text access (capped at 10 MB) */
    fullText: {
      type: String,
      default: "",
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pdfDocumentSchema.index({ userId: 1, createdAt: -1 });
pdfDocumentSchema.index({ userId: 1, contentHash: 1 });

export default mongoose.models.PdfDocument ||
  mongoose.model("PdfDocument", pdfDocumentSchema);
