import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
        },
        status: {
            type: String,
            enum: ["subscribed", "unsubscribed"],
            default: "subscribed",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema);
