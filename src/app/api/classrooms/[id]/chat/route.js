import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import Enrollment from "@/models/Enrollment";
import { trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const body = await request.json();
  const { message, conversationHistory = [], activeTab = "course" } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Fetch Classroom from Database
  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();
  const isEnrolled = isInstructor
    ? true
    : !!(await Enrollment.findOne({ classroomId: id, studentId: user._id, status: "active" }).lean());

  if (!isEnrolled) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fetch Assignments from Database
  const assignments = await Assignment.find({ classroomId: id, isActive: true })
    .select("title type dueDate maxScore category weekNumber description")
    .sort({ dueDate: 1 })
    .lean();

  const formattedAssignments = assignments.map((a) => {
    const dueStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No due date";
    return `- ${a.title} (${a.type}, ${a.maxScore} pts, Due: ${dueStr}, Week: ${a.weekNumber || "General"})`;
  }).join("\n");

  const formattedAnnouncements = (classroom.announcements || []).slice(-5).reverse().map((a) => {
    return `- ${a.title}: ${a.content} (${new Date(a.createdAt).toLocaleDateString()})`;
  }).join("\n");

  const scheduleInfo = classroom.schedule?.days?.length
    ? `${classroom.schedule.days.join(", ")} ${classroom.schedule.startTime || ""} - ${classroom.schedule.endTime || ""}`
    : "No fixed schedule";

  // Build Rich System Prompt with real MongoDB context
  const systemPrompt = `You are the dedicated AI Teaching Assistant for the classroom "${classroom.name}" (Subject: ${classroom.subject || "General"}).

REAL DATABASE CONTEXT FOR THIS CLASSROOM:
- Classroom Name: ${classroom.name}
- Subject: ${classroom.subject || "General Studies"}
- Academic Level: ${classroom.academicLevel || "Undergraduate"}
- Instructor Office Hours: ${classroom.officeHours || "Not specified"}
- Class Schedule: ${scheduleInfo}
- Current User Role: ${isInstructor ? "Instructor" : "Student"} (${user.name})
- Currently Viewing Tab: ${activeTab}

SYLLABUS SUMMARY:
${classroom.syllabus ? classroom.syllabus.slice(0, 1500) : "Syllabus not uploaded yet."}

ACTIVE ASSIGNMENTS IN DATABASE (${assignments.length} total):
${formattedAssignments || "No active assignments currently in the database."}

RECENT ANNOUNCEMENTS:
${formattedAnnouncements || "No announcements posted yet."}

INSTRUCTIONS:
1. Use the REAL DATABASE CONTEXT above to provide accurate, factual answers about this classroom, assignments, schedule, and syllabus.
2. If the student or instructor asks about due dates, assignments, or policies, reference the exact database data provided above.
3. Be encouraging, clear, and concise. Use markdown formatting (**bold**, *italics*, bullet points, code blocks).
4. Do not invent assignments or dates that contradict the database context.`;

  const recentHistory = (Array.isArray(conversationHistory) ? conversationHistory : []).slice(-8);

  const messages = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: message.trim() },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.5,
    max_tokens: 600,
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();

  if (!aiResponse) {
    throw new Error("Empty response from AI model");
  }

  // Track API usage
  await trackAPIUsage(user._id, "ai-tutor-chat");

  return NextResponse.json({
    success: true,
    response: aiResponse,
    timestamp: new Date().toISOString(),
  });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const dynamic = "force-dynamic";
