import mongoose from "mongoose";

const careerHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        type: {
            type: String,
            required: [true, "History type is required"],
            enum: ["resume", "interview", "skill-gap", "network"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, "Data is required"],
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Optional inputs or context
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better performance
careerHistorySchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.CareerHistory ||
    mongoose.model("CareerHistory", careerHistorySchema);
