import mongoose from "mongoose";

const personalizedDiscoverySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["explore_trending", "premium_courses"],
            required: true,
        },
        content: mongoose.Schema.Types.Mixed,
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index
        },
    },
    { timestamps: true }
);

// Compound index to ensure we can quickly find a specific type of discovery for a user
personalizedDiscoverySchema.index({ userId: 1, type: 1 }, { unique: true });

export default mongoose.models.PersonalizedDiscovery ||
    mongoose.model("PersonalizedDiscovery", personalizedDiscoverySchema);
