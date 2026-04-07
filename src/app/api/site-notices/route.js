import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getActiveSiteNotice } from "@/lib/siteNotices";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const notice = await getActiveSiteNotice(db);

    return NextResponse.json({
      notice: notice
        ? {
            id: notice._id?.toString?.() || notice.key,
            key: notice.key,
            title: notice.title,
            message: notice.message,
            variant: notice.variant,
            icon: notice.icon,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch site notice:", error);
    return NextResponse.json({ notice: null }, { status: 200 });
  }
}
