import mongoose from "mongoose";

const ClassroomMessageSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    senderRole: {
      type: String,
      enum: ["instructor", "admin", "student"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false, versionKey: false }
);

ClassroomMessageSchema.index({ classroomId: 1, createdAt: -1 });

const ClassroomMessage =
  mongoose.models.ClassroomMessage ||
  mongoose.model("ClassroomMessage", ClassroomMessageSchema);

export default ClassroomMessage;
