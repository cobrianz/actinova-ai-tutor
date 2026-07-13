export const dynamic = "force-dynamic";

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage, checkAPILimit } from "@/lib/planMiddleware";


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
      count,
      quizDifficulty,
      premiumRequested = false,
      forceRegenerate = false,
      marketplaceCourseId = null,
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

    // Re-fetch user from DB for fresh credits/purchasedItems data
    const freshUser = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { credits: 1, purchasedItems: 1 } }
    );
    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (format === "quiz") {
      const apiFeatureName = "exam_generation";
      const limitCheck = await checkAPILimit(db, freshUser, apiFeatureName);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            message: `You need ${limitCheck.creditCost} credits to generate this. You have ${limitCheck.credits} credits.`,
            credits: limitCheck.credits,
            creditCost: limitCheck.creditCost,
          },
          { status: 429 }
        );
      }
      return generateQuiz(topic, difficulty, questions, userId, db, count, quizDifficulty);
    }

    // ─── STEP 1: CANONICALIZE TOPIC & CHECK FOR EXISTING (SMART) ───
    // Get list of existing course topics for this user to help AI detect duplicates
    const userCourses = await db.collection("library")
      .find({ userId: new ObjectId(userId), format: "course", difficulty })
      .project({ topic: 1, title: 1 })
      .limit(50)
      .toArray();

    const topicList = userCourses.length > 0
      ? userCourses.map(c => `"${c.topic}" (Title: ${c.title})`).join(", ")
      : "None";

    const canonicalization = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an academic course classifier. 
          Given a user's requested topic and a list of their existing courses, determine:
          1. A professional, standardized "standardTitle".
          2. A "searchableTopic" (short, lowercase, e.g. "javascript").
          3. If this request is semantically the same as an existing course in: [${topicList}].
          
          Guidelines:
          - "Web Dev" and "Fullstack Web Development" are SAME.
          - "JS basics" and "Javascript Zero to Hero" are SAME.
          - If SAME, set "isDuplicate": true and "matchedTopic": "the_existing_topic_string".
          
          Return JSON: { "standardTitle": "...", "searchableTopic": "...", "isDuplicate": boolean, "matchedTopic": string|null }`
        },
        { role: "user", content: `User Topic: "${topic}"` }
      ]
    });

    const canon = JSON.parse(canonicalization.choices[0].message.content);
    const normalizedTopic = canon.isDuplicate ? canon.matchedTopic : canon.searchableTopic.trim().toLowerCase();

    // Check for existing course (exact match on normalized/matched topic)
    const existingCourseQuery = {
      userId: new ObjectId(userId),
      format: "course",
      difficulty,
    };

    if (marketplaceCourseId && ObjectId.isValid(marketplaceCourseId)) {
      existingCourseQuery.$or = [
        { sourceMarketplaceCourseId: new ObjectId(marketplaceCourseId) },
        { topic: normalizedTopic },
      ];
    } else {
      existingCourseQuery.topic = normalizedTopic;
    }

    const existingCourse = await db.collection("library").findOne(existingCourseQuery);

    if (existingCourse && !forceRegenerate) {
      let publishedMarketplaceCourseId = existingCourse.sourceMarketplaceCourseId || null;

      return NextResponse.json({
        success: true,
        courseId: existingCourse._id.toString(),
        content: {
          title: existingCourse.title,
          level: difficulty,
          totalModules: existingCourse.totalModules,
          totalLessons: existingCourse.totalLessons,
          modules: existingCourse.modules,
          sourceMarketplaceCourseId:
            publishedMarketplaceCourseId || existingCourse.sourceMarketplaceCourseId || null,
        },
        isExisting: true,
        message: "Course already exists. Loaded from library.",
      });
    }

    // ─── CHECK CREDITS BEFORE GENERATING ───
    const limitCheck = await checkAPILimit(db, freshUser, "course_generation");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `You need ${limitCheck.creditCost} credits to generate this. You have ${limitCheck.credits} credits.`,
          credits: limitCheck.credits,
          creditCost: limitCheck.creditCost,
        },
        { status: 429 }
      );
    }

    // ─── GENERATE NEW COURSE ───
    const finalTitle = canon.standardTitle;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a complete course outline in JSON format for "${finalTitle}" at ${difficulty} level.
        
        The JSON must strictly follow this structure:
        {
          "title": "${finalTitle}",
          "totalModules": 20,
          "totalLessons": 100,
          "modules": [
            {
              "title": "Module Title",
              "lessons": [
                { "title": "Detailed Lesson Title" },
                { "title": "Detailed Lesson Title" },
                { "title": "Detailed Lesson Title" },
                { "title": "Detailed Lesson Title" },
                { "title": "Detailed Lesson Title" }
              ]
            }
          ]
        }
        
        CRITICAL REQUIREMENTS:
        1. You MUST return EXACTLY 20 modules. Not 19, not 21 — exactly 20.
        2. Each module MUST contain EXACTLY 5 lessons. Not 4, not 6 — exactly 5.
        3. Total lessons = 20 × 5 = 100.
        4. Be academically rigorous and logically structured.
        5. Ensure lesson titles are specific and descriptive.
        6. Do not include lesson content; focus only on titles and structure.
        7. CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math.
        8. MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters! If you wrap text in math delimiters, it ruins the formatting by removing all spaces (e.g. 5.00islikely). Only use them for actual standalone mathematical formulas.
        - DO NOT use Mermaid syntax or flowchart diagrams of any kind.
        - DO NOT use Python for data visualizations and charts.
        - Use only the following visual block types:
          - \`\`\`chart for data visualizations (bar, line, pie, doughnut)
          - \`\`\`table for markdown tables
        - High-level data visualizations (graphs) are encouraged; flow-based diagrams are forbidden.
        - Plan for at least 3-5 charts per lesson to ensure maximum visual engagement.
        9. NEVER put math equations inside code blocks. NEVER use Markdown code backticks for math.
        10. Return ONLY the JSON object.`,
        },
        {
          role: "user",
          content: `Create a ${difficulty} level course on "${topic}" with EXACTLY 20 modules and EXACTLY 5 lessons per module (100 lessons total).`,
        },
      ],
    });

    let course;
    try {
      course = JSON.parse(completion.choices[0].message.content.trim());
    } catch (e) {
      course = fallbackCourse(topic, difficulty, 20, 5);
    }

    const normalizedModules = normalizeModules(course.modules || [], topic, 5);
    const courseId = existingCourse?._id || new ObjectId();
    const courseDoc = {
      _id: courseId,
      userId: new ObjectId(userId),
      title: course.title || canon.standardTitle,
      topic: normalizedTopic,
      originalTopic: topic,
      difficulty,
      format: "course",
      level: difficulty,
      totalModules: 20,
      totalLessons: 100,
      modules: normalizedModules.map((m, i) => ({
        ...m,
        id: i + 1,
        lessons: m.lessons.map((l, j) => ({
          title: typeof l === "string" ? l : l.title || `Lesson ${j + 1}`,
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
      progress: 0,
      completed: false,
      pinned: false,
      sourceMarketplaceCourseId:
        marketplaceCourseId && ObjectId.isValid(marketplaceCourseId)
          ? new ObjectId(marketplaceCourseId)
          : existingCourse?.sourceMarketplaceCourseId || null,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    if (existingCourse) {
      const { _id, ...updatableCourseDoc } = courseDoc;
      await db.collection("library").updateOne(
        { _id: existingCourse._id },
        {
          $set: {
            ...updatableCourseDoc,
            createdAt: existingCourse.createdAt || courseDoc.createdAt,
          },
        }
      );
    } else {
      await db.collection("library").insertOne(courseDoc);
    }

    // Increment usage after successful generation
    await trackAPIUsage(userId, "generate-course", { itemType: "course_generation", creditCost: 40 });

    return NextResponse.json({
      success: true,
      courseId: courseId.toString(),
      content: {
        title: course.title,
        topic: topic,
        level: difficulty,
        totalModules: 20,
        totalLessons: 100,
        modules: courseDoc.modules,
        sourceMarketplaceCourseId: courseDoc.sourceMarketplaceCourseId || null,
      },
      difficulty,
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
export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth
)(handlePost);


async function generateQuiz(topic, difficulty, questions, userId, db, count, quizDifficulty) {
  const questionsCount = count || 10;
  const quizDiff = (quizDifficulty || "medium").toLowerCase();
  if (!["easy", "medium", "hard"].includes(quizDiff)) {
    return NextResponse.json({ error: "Invalid quiz difficulty" }, { status: 400 });
  }
  const apiName = "quiz"; // Match planLimits feature name

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
      max_tokens: 6000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a professional examination-style quiz with EXACTLY ${questionsCount} questions about "${topic}".

DIFFICULTY: ${quizDiff.toUpperCase()}
${quizDiff === "easy" ? "Focus on basic recall and straightforward definitions. Questions should test whether the learner remembers key terms, facts, and simple concepts. Use clear, unambiguous wording with obvious correct answers and simple distractors." : ""}
${quizDiff === "medium" ? "Focus on application and analysis. Questions should require the learner to apply concepts to practical scenarios, compare approaches, or interpret information. Distractors should be plausible but clearly incorrect upon careful reading." : ""}
${quizDiff === "hard" ? "Focus on synthesis, edge cases, and tricky distractors. Questions should require deep understanding, evaluation of competing approaches, or reasoning across multiple concepts. Include subtle distinctions between options where two may seem correct but one is more precise. Distractors should be very plausible." : ""}

QUESTION TYPES & DISTRIBUTION (you MUST follow these percentages exactly):
- 60% MULTIPLE CHOICE (type: "multiple_choice"): 4 options (A, B, C, D). correctAnswer is the exact text of the correct option.
- 20% TRUE/FALSE (type: "true_false"): options must be ["True", "False"]. correctAnswer is exactly "True" or "False".
- 10% FILL IN THE BLANK (type: "fill_blank"): The question text MUST contain "___" where the answer goes. correctAnswer is the missing word or phrase. Do NOT include an "options" field.
- 10% SHORT ANSWER (type: "short_answer"): No options field. correctAnswer is the expected answer text (accept reasonable variations). Do NOT include an "options" field.

For a ${questionsCount}-question quiz: ~${Math.round(questionsCount * 0.6)} multiple choice, ~${Math.round(questionsCount * 0.2)} true/false, ~${Math.max(1, Math.round(questionsCount * 0.1))} fill in the blank, ~${Math.max(1, Math.round(questionsCount * 0.1))} short answer. Round to whole numbers that add up to exactly ${questionsCount}.

QUESTION REQUIREMENTS:
- Questions must sound like real examination questions from professional certifications or university exams
- Avoid basic "what is" or definition questions${quizDiff === "easy" ? " (these are acceptable for easy difficulty)" : ""}
- Each question must be clear, unambiguous, and professionally worded
- Questions should test ${quizDiff === "easy" ? "memorization and basic understanding" : quizDiff === "medium" ? "application, analysis, and problem-solving" : "synthesis, evaluation, and critical thinking"}
- CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math.
- MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters! If you wrap text in math delimiters, it ruins the formatting by removing all spaces (e.g. 5.00islikely). Only use them for actual standalone mathematical formulas.
- NEVER put math equations inside code blocks. NEVER use Markdown code backticks for math.
- Return ONLY valid JSON with this exact structure:
{
  "title": "Professional Quiz Title",
  "course": "${topic}",
  "questions": [
    {
      "text": "Clear, professional examination-style question that tests understanding",
      "type": "multiple_choice",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Exact text of the correct option",
      "explanation": "A 1-2 sentence explanation of why this answer is correct and why the other options are wrong"
    },
    {
      "text": "A statement followed by: True or False?",
      "type": "true_false",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "A 1-2 sentence explanation of why this answer is correct"
    },
    {
      "text": "The ___ protocol is used for secure web communication.",
      "type": "fill_blank",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "correctAnswer": "HTTPS",
      "explanation": "A 1-2 sentence explanation"
    },
    {
      "text": "Explain the difference between TCP and UDP.",
      "type": "short_answer",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "correctAnswer": "Expected answer text that describes the key differences",
      "explanation": "A 1-2 sentence explanation"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Create a ${quizDiff} difficulty professional examination quiz on "${topic}" with EXACTLY ${questionsCount} questions using a mix of types: ~60% multiple_choice, ~20% true_false, ~10% fill_blank, ~10% short_answer. Do NOT generate fewer or more than ${questionsCount} questions.`,
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

    // Ensure correct number of questions
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      return NextResponse.json(
        { error: "Invalid quiz format from AI" },
        { status: 500 }
      );
    }

    if (quiz.questions.length !== questionsCount) {
      // Trim to target count
      quiz.questions = quiz.questions.slice(0, questionsCount);
      
      // If AI returned fewer than 50, retry once
      if (quiz.questions.length < questionsCount) {
        console.warn(`AI returned ${quiz.questions.length} questions, retrying for ${questionsCount}...`);
        const retry = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 6000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Generate EXACTLY ${questionsCount} questions about "${topic}" at ${quizDiff} difficulty with a MIX of question types. You MUST return exactly ${questionsCount} questions, no more, no less.

MIX DISTRIBUTION: ~60% multiple_choice, ~20% true_false, ~10% fill_blank, ~10% short_answer. Round to whole numbers that sum to ${questionsCount}.

Return ONLY valid JSON:
{
  "title": "Quiz Title",
  "course": "${topic}",
  "questions": [
    {
      "text": "Question text",
      "type": "multiple_choice",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Correct option text",
      "explanation": "A 1-2 sentence explanation"
    },
    {
      "text": "Statement text here. True or False?",
      "type": "true_false",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "A 1-2 sentence explanation"
    },
    {
      "text": "The ___ is used for X.",
      "type": "fill_blank",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "correctAnswer": "answer",
      "explanation": "A 1-2 sentence explanation"
    },
    {
      "text": "Short answer question text",
      "type": "short_answer",
      "points": ${quizDiff === "easy" ? 1 : quizDiff === "medium" ? 2 : 3},
      "correctAnswer": "Expected answer",
      "explanation": "A 1-2 sentence explanation"
    }
  ]
}`,
            },
            {
              role: "user",
              content: `Generate EXACTLY ${questionsCount} mixed-type questions on "${topic}" at ${quizDiff} difficulty: ~60% multiple_choice, ~20% true_false, ~10% fill_blank, ~10% short_answer.`,
            },
          ],
        });

        try {
          const retryQuiz = JSON.parse(retry.choices[0].message.content.trim());
          if (retryQuiz.questions && retryQuiz.questions.length === questionsCount) {
            quiz = retryQuiz;
          } else {
            // Use what we have, pad with duplicates if needed
            while (quiz.questions.length < questionsCount && retryQuiz.questions?.length > 0) {
              quiz.questions.push(retryQuiz.questions[quiz.questions.length % retryQuiz.questions.length]);
            }
            quiz.questions = quiz.questions.slice(0, questionsCount);
          }
        } catch (retryErr) {
          console.error("Retry also failed:", retryErr);
          // Proceed with whatever we have, trimmed to count
          quiz.questions = quiz.questions.slice(0, questionsCount);
        }
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

    // Increment API Usage for User using unified system
    if (userId) {
      await trackAPIUsage(userId, apiName);
    }

    return NextResponse.json({
      success: true,
      quizId: result.insertedId.toString(),
      content: quiz,
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

// Normalize modules: enforce exactly 20 modules with exactly 5 lessons each
function normalizeModules(modules, topic, lessonsPerModule = 5) {
  const TARGET_MODULES = 20;
  const TARGET_LESSONS = 5;

  // Pad or trim modules to exactly 20
  let result = Array.from({ length: TARGET_MODULES }, (_, i) => {
    const existing = modules[i];
    const moduleNum = i + 1;
    const moduleTitle = existing?.title || `Module ${moduleNum}: ${getDefaultModuleTitle(i, topic)}`;
    const existingLessons = existing?.lessons || [];

    // Pad or trim lessons to exactly 5
    const lessons = Array.from({ length: TARGET_LESSONS }, (_, j) => {
      const existingLesson = existingLessons[j];
      if (existingLesson) {
        return typeof existingLesson === "string"
          ? { title: existingLesson }
          : { title: existingLesson.title || `Lesson ${j + 1}` };
      }
      return { title: `Lesson ${j + 1}: Core Topic ${j + 1}` };
    });

    return { title: moduleTitle, lessons };
  });

  return result;
}

function getDefaultModuleTitle(index, topic) {
  const phases = [
    "Introduction & Foundations",
    "Core Concepts",
    "Fundamentals in Depth",
    "Practical Application",
    "Intermediate Techniques",
    "Advanced Methods",
    "Real-World Projects",
    "Problem Solving",
    "Best Practices",
    "Optimization Strategies",
    "Expert Patterns",
    "System Design",
    "Testing & Quality",
    "Security & Performance",
    "Deployment & Scaling",
    "Ecosystem & Tooling",
    "Case Studies",
    "Industry Insights",
    "Capstone Project",
    "Mastery & Next Steps",
  ];
  return phases[index] || `Advanced Topic ${index + 1}`;
}

// Fallback if AI fails
function fallbackCourse(topic, difficulty, modules = 20, lessonsPerModule = 5) {
  return {
    title: `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Course`,
    level: difficulty,
    totalModules: 20,
    totalLessons: 100,
    modules: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Module ${i + 1}: ${getDefaultModuleTitle(i, topic)}`,
      lessons: Array.from({ length: 5 }, (_, j) => ({
        title: `Lesson ${i * 5 + j + 1}: Key Concept ${j + 1}`,
        content: "",
      })),
    })),
  };
}
