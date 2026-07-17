import mongoose from "mongoose";

const courseMaterialSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    uploadedBy: {
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
    type: {
      type: String,
      enum: ["document", "video", "link", "slides", "code", "other"],
      default: "document",
    },
    url: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    weekNumber: { type: Number, default: 0 },
    category: { type: String, default: "" },
    isRequired: { type: Boolean, default: false },
    aiSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

courseMaterialSchema.index({ classroomId: 1, weekNumber: 1 });

export default mongoose.models.CourseMaterial ||
  mongoose.model("CourseMaterial", courseMaterialSchema);
