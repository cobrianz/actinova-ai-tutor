import { NextResponse } from "next/server";
import { generateExploreTrending } from "../../explore/trending-topics/route";
import { authorizeCronRequest } from "../_lib";

async function handleCron(request) {
  try {
    const unauthorizedResponse = authorizeCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    console.log("[CRON] Starting global explore trending topics generation...");
    
    // Generate global (anonymous) trending topics
    const result = await generateExploreTrending(null);

    console.log("[CRON] Global explore trending topics generation completed.");

    return NextResponse.json(
      {
        success: true,
        message: "Global trending topics generated successfully",
        topics: result.topics || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error in global trending topics generation:", error);
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
