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
  },
  { timestamps: true }
);

discussionPostSchema.index({ discussionId: 1, createdAt: 1 });

export default mongoose.models.DiscussionPost ||
  mongoose.model("DiscussionPost", discussionPostSchema);
