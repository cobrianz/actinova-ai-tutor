import { NextResponse } from "next/server";
import { generateBlogPost } from "../../blog/generate/route";
import { authorizeCronRequest } from "../_lib";

async function handleCron(request) {
  try {
    const unauthorizedResponse = authorizeCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
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
