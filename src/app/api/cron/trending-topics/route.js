import { NextResponse } from "next/server";
import { generateExploreTrending } from "../../explore/trending-topics/route";

const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";

async function handleCron(request) {
  try {
    // Verify cron secret
    const secret = request.headers.get("x-cron-secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
