import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
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
      maxlength: 5000,
      default: "",
    },
    instructions: {
      type: String,
      maxlength: 10000,
      default: "",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    type: {
      type: String,
      enum: ["course", "flashcards", "quiz", "report", "essay", "project", "discussion", "lab", "presentation", "custom"],
      default: "course",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    availableFrom: {
      type: Date,
      default: null,
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    passingScore: {
      type: Number,
      default: 60,
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
    },
    rubric: [{
      criterion: { type: String, required: true },
      description: { type: String, default: "" },
      maxPoints: { type: Number, required: true },
    }],
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, default: "file" },
    }],
    allowLateSubmissions: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 0 },
    isGroupAssignment: { type: Boolean, default: false },
    groupId: { type: String, default: "" },
    isActive: {
      type: Boolean,
      default: true,
    },
    aiGenerated: { type: Boolean, default: false },
    weekNumber: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

assignmentSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.models.Assignment ||
  mongoose.model("Assignment", assignmentSchema);
