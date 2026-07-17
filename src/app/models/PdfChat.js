import mongoose from "mongoose";

/**
 * Stores chat history for a PDF document session.
 * Mirrors the Chat model but links to a PdfDocument via documentId.
 */
const pdfChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    /** Page citations extracted from AI response, e.g. [1, 4, 7] */
    citedPages: [{ type: Number }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const pdfChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PdfDocument",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSizeMB: {
      type: String,
      default: "0",
    },
    messages: [pdfChatMessageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

pdfChatSchema.index({ userId: 1, documentId: 1 });
pdfChatSchema.index({ userId: 1, lastMessageAt: -1 });

export default mongoose.models.PdfChat ||
  mongoose.model("PdfChat", pdfChatSchema);
