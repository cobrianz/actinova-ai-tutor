import mongoose from "mongoose";

const discussionPostSchema = new mongoose.Schema(
  {
    discussionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true,
    },
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
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    parentPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionPost",
      default: null,
    },
    isEdited: { type: Boolean, default: false },
    reactions: [{
      emoji: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    score: { type: Number, default: null },
    maxScore: { type: Number, default: 100 },
    feedback: { type: String, default: "", maxlength: 2000 },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

discussionPostSchema.index({ discussionId: 1, createdAt: 1 });

export default mongoose.models.DiscussionPost ||
  mongoose.model("DiscussionPost", discussionPostSchema);
