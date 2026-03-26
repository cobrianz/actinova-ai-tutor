import { NextResponse } from "next/server";
import { generateCareerTrending } from "../../career/trending/route";
import { authorizeCronRequest } from "../_lib";

async function handleCron(request) {
  try {
    const unauthorizedResponse = authorizeCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    console.log("[CRON] Starting global career trending generation...");
    
    // Generate global trending careers and skills
    const result = await generateCareerTrending(null);

    console.log("[CRON] Global career trending generation completed.");

    return NextResponse.json(
      {
        success: true,
        message: "Global career trending generated successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error in global career trending generation:", error);
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
