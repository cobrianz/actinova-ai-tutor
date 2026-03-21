import { NextResponse } from "next/server";
import { generateBlogPost } from "../../blog/generate/route";

const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";

async function handleCron(request) {
  try {
    // Verify cron secret (Support both standard Authorization header and custom x-cron-secret)
    const authHeader = request.headers.get("authorization");
    const customSecret = request.headers.get("x-cron-secret");
    const secret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : customSecret;

    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Starting weekly blog generation...");
    
    // Generate weekly blog post
    const result = await generateBlogPost("weekly");

    console.log("[CRON] Weekly blog generation completed:", result.skipped ? "Skipped (already exists)" : "Success");

    return NextResponse.json(
      {
        success: true,
        message: result.skipped ? "Already generated for this week" : "Weekly blog generated successfully",
        post: result.post || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error in weekly blog generation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handleCron(request);
}

export async function POST(request) {
  return handleCron(request);
}
