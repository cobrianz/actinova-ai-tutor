import { NextResponse } from "next/server";
import { generateTrendingCourses } from "../../premium-courses/trending/route";
import { authorizeCronRequest } from "../_lib";

async function handleCron(request) {
  try {
    const unauthorizedResponse = authorizeCronRequest(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    console.log("[CRON] Starting global premium trending courses generation...");
    
    // Generate global trending premium courses
    const result = await generateTrendingCourses(null);

    console.log("[CRON] Global premium trending courses generation completed.");

    return NextResponse.json(
      {
        success: true,
        message: "Global premium trending courses generated successfully",
        courses: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error in global premium trending courses generation:", error);
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
