import { NextResponse } from "next/server";
import { generateTrendingCourses } from "../../premium-courses/trending/route";

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
