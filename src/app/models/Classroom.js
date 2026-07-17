import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    inviteCode: {
      type: String,
      unique: true,
      index: true,
    },
    maxStudents: {
      type: Number,
      default: 50,
      min: 2,
      max: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    semester: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    academicLevel: {
      type: String,
      enum: ["high_school", "college", "graduate", "bootcamp", "corporate", "other"],
      default: "college",
    },
    schedule: {
      days: [{ type: String, enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] }],
      startTime: { type: String, default: "" },
      endTime: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    gradingScheme: {
      type: String,
      enum: ["percentage", "letter", "pass_fail", "points", "none"],
      default: "percentage",
    },
    prerequisites: [{
      type: String,
      trim: true,
    }],
    syllabus: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    announcements: [{
      title: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    settings: {
      allowStudentPosts: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      showGradesToStudents: { type: Boolean, default: true },
      allowLateSubmissions: { type: Boolean, default: true },
      latePenaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
      maxFileSizeMB: { type: Number, default: 50 },
      defaultAssignmentScore: { type: Number, default: 100 },
      enableDiscussions: { type: Boolean, default: true },
      enableNotes: { type: Boolean, default: true },
      enableMaterials: { type: Boolean, default: true },
    },
    startDate: { type: Date, default: null },
    durationWeeks: { type: Number, default: 0, min: 0, max: 52 },
  },
  { timestamps: true }
);

classroomSchema.index({ instructorId: 1, createdAt: -1 });

export default mongoose.models.Classroom ||
  mongoose.model("Classroom", classroomSchema);
