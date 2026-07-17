import mongoose from "mongoose";

const studentProgressSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    score: {
      type: Number,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 2000,
      default: "",
    },
  },
  { timestamps: true }
);

studentProgressSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
studentProgressSchema.index({ classroomId: 1, studentId: 1 });

export default mongoose.models.StudentProgress ||
  mongoose.model("StudentProgress", studentProgressSchema);
