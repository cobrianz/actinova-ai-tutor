import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    createdBy: {
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
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    isPinned: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    postCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    weekNumber: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

discussionSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.models.Discussion ||
  mongoose.model("Discussion", discussionSchema);
