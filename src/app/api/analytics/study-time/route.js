import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const sessions = await db
    .collection("sessions")
    .find({ userId: user._id })
    .project({ startTime: 1, duration: 1 })
    .toArray();

  // Daily study time (last 30 days)
  const daily = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    daily[key] = 0;
  }

  for (const session of sessions) {
    if (session.startTime && session.duration) {
      const date = new Date(session.startTime).toISOString().split("T")[0];
      if (daily[date] !== undefined) {
        daily[date] += Math.round(session.duration / 60000);
      }
    }
  }

  const dailyArray = Object.entries(daily).map(([date, minutes]) => ({
    date,
    minutes,
  }));

  // Weekly aggregation
  const weekly = {};
  for (const entry of dailyArray) {
    const d = new Date(entry.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    if (!weekly[weekKey]) weekly[weekKey] = 0;
    weekly[weekKey] += entry.minutes;
  }

  const weeklyArray = Object.entries(weekly)
    .map(([week, minutes]) => ({ week, minutes: Math.round(minutes / 60 * 10) / 10 }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Day of week averages
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const entry of dailyArray) {
    const d = new Date(entry.date);
    const day = d.getDay();
    dayTotals[day] += entry.minutes;
    dayCounts[day] += 1;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDayOfWeek = dayNames.map((name, i) => ({
    day: name,
    avgMinutes: dayCounts[i] > 0 ? Math.round(dayTotals[i] / dayCounts[i]) : 0,
  }));

  const totalMinutes = dailyArray.reduce((sum, d) => sum + d.minutes, 0);

  return NextResponse.json({
    success: true,
    daily: dailyArray,
    weekly: weeklyArray,
    byDayOfWeek,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
