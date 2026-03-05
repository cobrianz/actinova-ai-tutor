import mongoose from "mongoose";

const trendingCareerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        trendingCareers: [
            {
                title: String,
                growth: String,
                description: String,
                averageSalary: String,
                skills: [String],
                industry: String,
            },
        ],
        trendingSkills: [
            {
                skill: String,
                demand: String,
                description: String,
                relatedCareers: [String],
                learningResources: String,
            },
        ],
        marketInsights: String,
        emergingFields: [String],
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            index: { expires: 0 }, // TTL index
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.TrendingCareer || mongoose.model("TrendingCareer", trendingCareerSchema);
