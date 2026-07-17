import mongoose from "mongoose";

const courseNoteSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      maxlength: 50000,
      default: "",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isPinned: { type: Boolean, default: false },
    isAiGenerated: { type: Boolean, default: false },
    aiPrompt: { type: String, default: "" },
    weekNumber: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

courseNoteSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.models.CourseNote ||
  mongoose.model("CourseNote", courseNoteSchema);
