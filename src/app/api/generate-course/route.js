// src/app/api/generate-course/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserPlanLimits } from "@/lib/planLimits";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withAPIRateLimit } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1"
});

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  try {
    const body = await request.json();
    let {
      topic,
      difficulty = "beginner",
      format = "course",
      questions,
    } = body;

    if (!topic?.trim())
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    difficulty = (difficulty || "beginner").toLowerCase();
    if (!["beginner", "intermediate", "advanced"].includes(difficulty))
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 }
      );

    const { db } = await connectToDatabase();
    const planLimits = getUserPlanLimits(user);
    const isPremium = user?.subscription?.tier !== "free" && user?.subscription?.status === "active";

    if (format === "quiz") {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthlyUsage = user?.monthlyUsage || 0;
      return generateQuiz(topic, difficulty, questions, userId, db, monthlyUsage, resetDate, isPremium, planLimits);
    }

    const normalizedTopic = topic.trim().toLowerCase();

    // Check for existing course
    const existingCourse = await db.collection("library").findOne({
      userId: new ObjectId(userId),
      topic: normalizedTopic,
      format: "course",
      difficulty,
    });

    if (existingCourse) {
      // Scenario 1: Course exists, user is premium, but course is NOT premium. Upgrade it.
      if (isPremium && !existingCourse.isPremium) {
        const { modules, lessonsPerModule, totalLessons } = planLimits;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 8000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Generate a complete course outline in JSON format for "${topic}" at ${difficulty} level.
              ... (rest of the prompt remains the same) ...`,
            },
            {
              role: "user",
              content: `Create a ${difficulty} level course on "${topic}" with ${modules} modules and ${totalLessons} lessons total.`,
            },
          ],
        });

        let course;
        try {
          course = JSON.parse(completion.choices[0].message.content.trim());
        } catch (e) {
          course = fallbackCourse(topic, difficulty, modules, lessonsPerModule);
        }

        const updatedCourseDoc = {
          title: course.title,
          totalModules: course.totalModules,
          totalLessons: course.totalLessons,
          modules: course.modules.map((m, i) => ({
            ...m,
            id: i + 1,
            lessons: m.lessons.map((l, j) => ({
              ...l,
              id: `${i + 1}-${j + 1}`,
              content: "",
              completed: false,
              srs: {
                interval: 1,
                repetitions: 0,
                ease: 2.5,
                dueDate: new Date().toISOString(),
              },
            })),
          })),
          isPremium: true,
          lastAccessed: new Date(),
        };

        await db
          .collection("library")
          .updateOne({ _id: existingCourse._id }, { $set: updatedCourseDoc });

        return NextResponse.json({
          success: true,
          courseId: existingCourse._id.toString(),
          content: {
            title: course.title,
            level: difficulty,
            totalModules: updatedCourseDoc.totalModules,
            totalLessons: updatedCourseDoc.totalLessons,
            modules: updatedCourseDoc.modules,
          },
          isExisting: true,
          wasUpgraded: true,
          message: "Course upgraded to premium version!",
        });
      }

      return NextResponse.json({
        success: true,
        courseId: existingCourse._id.toString(),
        content: {
          title: existingCourse.title,
          level: difficulty,
          totalModules: existingCourse.totalModules,
          totalLessons: existingCourse.totalLessons,
          modules: existingCourse.modules,
        },
        isExisting: true,
        wasUpgraded: false,
        message: "Course already exists. Loaded from library.",
      });
    }

    // ─── GENERATE NEW COURSE ───
    const { modules, lessonsPerModule, totalLessons } = planLimits;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a complete course outline in JSON format for "${topic}" at ${difficulty} level.
          ... (rest of prompt) ...`,
        },
        {
          role: "user",
          content: `Create a ${difficulty} level course on "${topic}" with ${modules} modules and ${totalLessons} lessons total.`,
        },
      ],
    });

    let course;
    try {
      course = JSON.parse(completion.choices[0].message.content.trim());
    } catch (e) {
      course = fallbackCourse(topic, difficulty, modules, lessonsPerModule);
    }

    const courseId = new ObjectId();
    const courseDoc = {
      _id: courseId,
      userId: new ObjectId(userId),
      title: course.title,
      topic: normalizedTopic,
      originalTopic: topic,
      difficulty,
      format: "course",
      level: difficulty,
      totalModules: course.totalModules,
      totalLessons: course.totalLessons,
      modules: course.modules.map((m, i) => ({
        ...m,
        id: i + 1,
        lessons: m.lessons.map((l, j) => ({
          ...l,
          id: `${i + 1}-${j + 1}`,
          content: "",
          completed: false,
          srs: {
            interval: 1,
            repetitions: 0,
            ease: 2.5,
            dueDate: new Date().toISOString(),
          },
        })),
      })),
      isPremium,
      progress: 0,
      completed: false,
      pinned: false,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    await db.collection("library").insertOne(courseDoc);

    return NextResponse.json({
      success: true,
      courseId: courseId.toString(),
      content: {
        title: course.title,
        topic: topic,
        level: difficulty,
        totalModules: course.totalModules,
        totalLessons: course.totalLessons,
        modules: courseDoc.modules,
      },
      difficulty,
      isPremium,
    });
  } catch (error) {
    console.error("Course generation failed! Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
      cause: error.cause
    });
    throw error; // Handled by withErrorHandling
  }
}

// Wrap with middleware
export const POST = withErrorHandling(
  combineMiddleware(
    withAuth,
    (handler) => withAPIRateLimit(handler, "generate-course"),
    handlePost
  )
);


async function generateQuiz(topic, difficulty, questions, userId, db, monthlyUsage, resetDate, isPremium, planLimits) {
  const questionsCount = questions || 10;
  try {
    // If db wasn't passed, connect now (fallback)
    if (!db) {
      const conn = await connectToDatabase();
      db = conn.db;
    }

    // Check for existing test with same topic and difficulty
    const normalizedTopic = topic.trim().toLowerCase();
    const existingTest = await db.collection("tests").findOne({
      $or: [
        { createdBy: userId ? new ObjectId(userId) : null },
        { userId: userId ? new ObjectId(userId) : null }
      ],
      course: { $regex: new RegExp(`^${normalizedTopic}$`, "i") },
      difficulty: difficulty,
    });

    if (existingTest) {
      // Return existing test instead of generating new one
      return NextResponse.json({
        success: true,
        quizId: existingTest._id.toString(),
        content: {
          title: existingTest.title,
          course: existingTest.course,
          questions: existingTest.questions,
        },
        exists: true,
        message: "Test already exists for this topic and difficulty level.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a professional examination-style quiz with ${questionsCount} multiple-choice questions about "${topic}" at ${difficulty} level.

DIFFICULTY GUIDELINES:
- Beginner: Basic concepts, definitions, fundamental principles, straightforward application
- Intermediate: Analysis, comparison, problem-solving, integration of concepts, practical application
- Advanced: Complex analysis, evaluation, synthesis, critical thinking, advanced problem-solving, real-world scenarios

QUESTION REQUIREMENTS:
- ALL questions must be MULTIPLE CHOICE with exactly 4 options (A, B, C, D)
- Questions must sound like real examination questions from professional certifications or university exams
- Avoid basic "what is" or definition questions
- Focus on analysis, application, evaluation, and problem-solving
- Each question must be clear, unambiguous, and professionally worded
- Questions should test deep understanding, not just memorization

ANSWER REQUIREMENTS:
- Exactly one correct answer per question
- All options must be plausible and professionally written
- Incorrect options should be common misconceptions or partial understandings
- Options should be similar in length and complexity

Return ONLY valid JSON with this exact structure:
{
  "title": "Professional Quiz Title",
  "course": "${topic}",
  "questions": [
    {
      "text": "Clear, professional examination-style question that tests understanding",
      "type": "multiple-choice",
      "points": ${difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3},
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Exact text of the correct option"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Create a ${difficulty} level professional examination quiz on "${topic}" with ${questionsCount} multiple-choice questions that test deep understanding and analytical skills.`,
        },
      ],
    });

    let quiz;
    try {
      quiz = JSON.parse(completion.choices[0].message.content.trim());
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse quiz from AI response" },
        { status: 500 }
      );
    }

    // Check user limits for quiz generation (Total Cap)
    let quizCount = 0;
    if (userId) {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Count existing tests for this user created this month
      quizCount = await db.collection("tests").countDocuments({
        createdBy: new ObjectId(userId),
        createdAt: { $gte: startOfMonth }
      });

      const limit = planLimits.quizzes;
      if (limit !== -1 && quizCount >= limit) {
        return NextResponse.json(
          {
            error: `Monthly test limit reached (${limit}). ${!isPremium ? "Upgrade to premium for up to 20 tests/mo." : ""}`,
            limit,
            current: quizCount,
            isPremium: isPremium,
          },
          { status: 429 }
        );
      }
    }

    const testDoc = {
      ...quiz,
      createdBy: userId ? new ObjectId(userId) : null, // Mongoose Schema compatible
      userId: userId ? new ObjectId(userId) : null,    // Backward compatibility
      difficulty,
      createdAt: new Date(),
    };

    const result = await db.collection("tests").insertOne(testDoc);

    // Increment API Usage for User
    if (userId) {
      try {
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { monthlyUsage: 1 } }
          );
      } catch (e) {
        console.error("Failed to increment monthly usage for quiz", e);
      }
    }

    return NextResponse.json({
      success: true,
      quizId: result.insertedId.toString(),
      content: quiz,
      monthly: {
        used: (monthlyUsage || 0) + 1,
        limit: planLimits.quizzes,
        resetsOn: resetDate ? resetDate.toLocaleDateString() : new Date().toLocaleDateString(),
      },
    });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Fallback if AI fails
function fallbackCourse(topic, difficulty, modules, lessonsPerModule) {
  return {
    title: `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Course`,
    level: difficulty,
    totalModules: modules,
    totalLessons: modules * lessonsPerModule,
    modules: Array.from({ length: modules }, (_, i) => ({
      id: i + 1,
      title: `Module ${i + 1}: ${i === 0 ? "Getting Started" : i === 1 ? "Core Concepts" : `Advanced Topics`}`,
      lessons: Array.from({ length: lessonsPerModule }, (_, j) => ({
        title: `Lesson ${i * lessonsPerModule + j + 1}: Key Concept ${j + 1}`,
        content: "",
      })),
    })),
  };
}
