export const dynamic = "force-dynamic";

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

async function handlePost(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { planId, weekIndex, dayIndex, topic, context, difficulty, existingTasks } = body;

    if (!planId || !ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    if (weekIndex == null || dayIndex == null) {
      return NextResponse.json({ error: "weekIndex and dayIndex are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const plan = await db.collection("library").findOne({
      _id: new ObjectId(planId),
      userId: new ObjectId(user._id),
      format: "study_plan",
    });

    if (!plan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const weeks = plan.weeks || [];
    const week = weeks[weekIndex];
    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const days = week.days || [];
    const day = days[dayIndex];
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const dayName = day.day || "this day";
    const weekTitle = week.title || `Week ${weekIndex + 1}`;
    const planTopic = topic || plan.originalTopic || plan.topic;
    const planDifficulty = difficulty || plan.difficulty || "beginner";

    const existingTaskSummary = (existingTasks || day.tasks || [])
      .map((t) => `- ${t.title} (${t.type}, ${t.estimatedMinutes}min)`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert learning designer. Generate 2-4 study tasks for a single day in a study plan.

CONTEXT:
- Plan topic: "${planTopic}"
- Difficulty: ${planDifficulty}
- Week: "${weekTitle}"
- Day: ${dayName}
${context ? `- Additional context: ${context}` : ""}

EXISTING TASKS FOR THIS DAY (generate different tasks):
${existingTaskSummary || "No existing tasks"}

TASK TYPES (pick appropriate mix):
- "lesson": Reading/watching/learning new material
- "practice": Hands-on exercises, coding challenges, or drills
- "review": Reviewing previous material, flashcards, or spaced repetition
- "quiz": Self-assessment, practice quiz, or knowledge check
- "project": Building something practical, applying multiple concepts

TASK TIME RANGES:
- beginner: 20-40 minutes each
- intermediate: 30-50 minutes each
- advanced: 40-60 minutes each

REQUIREMENTS:
1. Generate 2-4 NEW tasks that complement (not duplicate) the existing tasks.
2. Each task must be specific and actionable.
3. Vary the task types.
4. Include a description for each task.
5. The total time for new tasks should be 30-90 minutes.

Return ONLY valid JSON matching this structure:
{
  "tasks": [
    {
      "type": "practice",
      "title": "Specific task title",
      "description": "1-2 sentence description",
      "estimatedMinutes": 30
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Generate 2-4 new tasks for ${dayName} in "${weekTitle}" of my "${planTopic}" study plan. Make sure they don't overlap with the existing tasks listed above.`,
        },
      ],
    });

    let newTasks;
    try {
      const parsed = JSON.parse(completion.choices[0].message.content.trim());
      newTasks = parsed.tasks || [];
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!Array.isArray(newTasks) || newTasks.length === 0) {
      return NextResponse.json({ error: "AI returned no tasks" }, { status: 500 });
    }

    // Normalize new tasks
    newTasks = newTasks.map((task) => ({
      type: task.type || "practice",
      title: task.title || "Untitled Task",
      description: task.description || "",
      estimatedMinutes: task.estimatedMinutes || 30,
      relatedCourseTitle: null,
      courseId: null,
      moduleId: null,
      lessonIndex: null,
      relatedCourseTopic: null,
      completed: false,
    }));

    return NextResponse.json({
      success: true,
      tasks: newTasks,
    });
  } catch (error) {
    console.error("Failed to regenerate day:", error);
    throw error;
  }
}

export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
