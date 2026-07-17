export const dynamic = "force-dynamic";

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { checkAPILimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  const body = await request.json();
  const {
    topic,
    difficulty = "medium",
    questionCount = 20,
    timeLimit = 30,
    courseId = null,
  } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Topic is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const validDifficulties = ["easy", "medium", "hard"];
  if (!validDifficulties.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty. Must be easy, medium, or hard.", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const count = Math.min(Math.max(parseInt(questionCount) || 20, 5), 50);
  const timeLimitMins = Math.min(Math.max(parseInt(timeLimit) || 30, 5), 180);

  const { db } = await connectToDatabase();

  // Re-fetch user for fresh credits
  const freshUser = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { credits: 1, purchasedItems: 1 } }
  );
  if (!freshUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Credit check
  const limitCheck = await checkAPILimit(db, freshUser, "exam_generation");
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        message: `You need ${limitCheck.creditCost} credits to generate an exam. You have ${limitCheck.credits} credits.`,
        credits: limitCheck.credits,
        creditCost: limitCheck.creditCost,
      },
      { status: 429 }
    );
  }

  // Build OpenAI prompt
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert exam creator. Generate a comprehensive, timed examination on "${topic}" at ${difficulty} difficulty.

DIFFICULTY GUIDELINES:
${difficulty === "easy" ? "Focus on recall of key terms, basic definitions, and straightforward facts. Questions should be direct with clear correct answers." : ""}
${difficulty === "medium" ? "Mix conceptual understanding with application. Include scenarios where students must apply knowledge to solve problems." : ""}
${difficulty === "hard" ? "Focus on synthesis, evaluation, and edge cases. Questions should require deep understanding and nuanced reasoning. Include tricky distractors." : ""}

QUESTION DISTRIBUTION (EXACTLY ${count} questions total):
- 50% multiple_choice: 4 options (A, B, C, D). correctAnswer is the exact text of the correct option.
- 20% true_false: options must be exactly ["True", "False"]. correctAnswer is "True" or "False".
- 15% fill_blank: question must contain "___". correctAnswer is the missing word/phrase. No options field.
- 15% short_answer: No options field. correctAnswer is the expected answer.

REQUIREMENTS:
- Questions must feel like a real university or professional certification exam
- Each question needs a clear explanation
- Points: easy=1, medium=2, hard=3
- CRITICAL for Math: Use \\( ... \\) for inline math, \\[ ... \\] for block math
- NEVER use math delimiters on plain English text
- Return ONLY valid JSON

JSON structure:
{
  "title": "Exam title here",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "timeLimit": ${timeLimitMins},
  "totalPoints": <sum of all question points>,
  "passingScore": <70% of totalPoints>,
  "instructions": "Read all questions carefully. You have ${timeLimitMins} minutes to complete this exam.",
  "questions": [
    {
      "id": 1,
      "text": "Question text",
      "type": "multiple_choice",
      "points": ${difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3},
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact text of correct option",
      "explanation": "Why this is correct"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Create a ${difficulty} difficulty exam on "${topic}" with exactly ${count} questions and a ${timeLimitMins}-minute time limit.`,
      },
    ],
  });

  let examData;
  try {
    examData = JSON.parse(completion.choices[0].message.content.trim());
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse exam from AI response" }, { status: 500 });
  }

  if (!Array.isArray(examData.questions) || examData.questions.length === 0) {
    return NextResponse.json({ error: "Invalid exam format from AI" }, { status: 500 });
  }

  // Trim/pad to requested count
  examData.questions = examData.questions.slice(0, count);

  // Calculate total points
  const totalPoints = examData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const passingScore = Math.ceil(totalPoints * 0.7);

  // Save to database
  const examDoc = {
    userId: new ObjectId(userId),
    courseId: courseId && ObjectId.isValid(courseId) ? new ObjectId(courseId) : null,
    title: examData.title || `${topic} Exam`,
    topic: topic.trim(),
    difficulty,
    timeLimit: timeLimitMins,
    totalPoints,
    passingScore,
    instructions: examData.instructions || `You have ${timeLimitMins} minutes to complete this exam.`,
    questions: examData.questions,
    attempts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("exams").insertOne(examDoc);

  // Track usage
  await trackAPIUsage(userId, "exam_generation", { itemType: "exam_generation", creditCost: 25 });

  return NextResponse.json({
    success: true,
    examId: result.insertedId.toString(),
    exam: {
      ...examDoc,
      _id: result.insertedId.toString(),
      userId: userId.toString(),
    },
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth
)(handlePost);
