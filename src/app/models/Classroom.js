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
      enum: ["highschool", "undergraduate", "graduate", "phd", "professional"],
      default: "undergraduate",
    },
    schedule: {
      days: [{ type: String, enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] }],
      startTime: { type: String, default: "" },
      endTime: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    gradingScheme: {
      type: String,
      enum: ["percentage", "letter", "passfail", "gpa"],
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
    modules: [{
      title: { type: String, required: true },
      description: { type: String, default: "" },
      weekNumber: { type: Number, required: true },
      lessons: [{
        title: { type: String, required: true },
        description: { type: String, default: "" },
        duration: { type: Number, default: 60 },
        type: { type: String, enum: ["lecture", "lab", "reading", "video", "activity"], default: "lecture" },
        objectives: [{ type: String }],
        materials: [{ type: String }],
      }],
    }],
    forkedContent: [{
      contentType: { type: String, enum: ["course", "quiz", "flashcard"], required: true },
      contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
      title: { type: String, required: true },
      description: { type: String, default: "" },
      weekNumber: { type: Number, default: 0 },
      unlocked: { type: Boolean, default: true },
      availableFrom: { type: Date, default: null },
      availableUntil: { type: Date, default: null },
      forkedAt: { type: Date, default: Date.now },
      meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    }],
  },
  { timestamps: true }
);

classroomSchema.index({ instructorId: 1, createdAt: -1 });

export default mongoose.models.Classroom ||
  mongoose.model("Classroom", classroomSchema);
