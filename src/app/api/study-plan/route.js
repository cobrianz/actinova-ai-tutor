export const dynamic = "force-dynamic";

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { checkAPILimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  try {
    const body = await request.json();
    const { topic, goal, weeks = 4, difficulty, selectedCourseIds = [] } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const durationWeeks = Math.min(Math.max(parseInt(weeks) || 4, 1), 12);
    const planDifficulty = (difficulty || "beginner").toLowerCase();

    if (!["beginner", "intermediate", "advanced"].includes(planDifficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Re-fetch user for fresh credits and onboarding data
    const freshUser = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          credits: 1,
          purchasedItems: 1,
          interests: 1,
          skillLevel: 1,
          goals: 1,
          timeCommitment: 1,
          educationLevel: 1,
        },
      }
    );

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Credit check
    const limitCheck = await checkAPILimit(db, freshUser, "study_plan_generation");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `You need ${limitCheck.creditCost} credits to generate a study plan. You have ${limitCheck.credits} credits.`,
          credits: limitCheck.credits,
          creditCost: limitCheck.creditCost,
        },
        { status: 429 }
      );
    }

    // Fetch selected courses with full details if IDs provided
    let selectedCourses = [];
    if (selectedCourseIds.length > 0) {
      const validIds = selectedCourseIds.filter((id) => ObjectId.isValid(id));
      if (validIds.length > 0) {
        selectedCourses = await db
          .collection("library")
          .find({
            _id: { $in: validIds.map((id) => new ObjectId(id)) },
            userId: new ObjectId(userId),
            format: "course",
          })
          .project({ title: 1, topic: 1, difficulty: 1, modules: 1, totalModules: 1, totalLessons: 1 })
          .toArray();
      }
    }

    // Flatten all course lessons for sequential mapping
    const allCourseLessons = [];
    if (selectedCourses.length > 0) {
      for (const course of selectedCourses) {
        for (let mi = 0; mi < (course.modules || []).length; mi++) {
          const mod = course.modules[mi];
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const lesson = mod.lessons[li];
            const lessonTitle = typeof lesson === "string" ? lesson : lesson.title || `Lesson ${li + 1}`;
            allCourseLessons.push({
              courseId: String(course._id),
              courseTitle: course.title,
              courseTopic: course.topic,
              moduleId: mi + 1,
              moduleTitle: mod.title || `Module ${mi + 1}`,
              lessonIndex: li,
              lessonTitle,
            });
          }
        }
      }
    }

    // Calculate days and lessons per day
    const daysPerWeek = 5;
    const totalDays = durationWeeks * daysPerWeek;
    const totalCourseLessons = allCourseLessons.length;

    // Build detailed course context for the AI (send ALL module/lesson data)
    let courseContext = "";
    if (selectedCourses.length > 0) {
      courseContext = "\n\nSELECTED COURSES (COMPLETE STRUCTURE):\n";
      for (const course of selectedCourses) {
        courseContext += `\n- "${course.title}" (Topic: ${course.topic}, Level: ${course.difficulty})\n`;
        for (let mi = 0; mi < (course.modules || []).length; mi++) {
          const mod = course.modules[mi];
          const lessonTitles = (mod.lessons || []).map((l, li) => `    ${li + 1}. ${typeof l === "string" ? l : l.title || `Lesson ${li + 1}`}`).join("\n");
          courseContext += `  Module ${mi + 1}: ${mod.title || `Module ${mi + 1}`}${mod.lessons?.length ? ` (${mod.lessons.length} lessons)` : ""}\n${lessonTitles ? lessonTitles + "\n" : ""}`;
        }
      }
      courseContext += `\nTOTAL COURSE LESSONS: ${totalCourseLessons} lessons across ${selectedCourses.length} course(s).`;
      courseContext += `\nLESSONS WILL BE DISTRIBUTED: ${Math.ceil(totalCourseLessons / totalDays)} lessons/day across ${totalDays} study days (Mon-Fri).`;
      courseContext += `\n\nIMPORTANT: Do NOT create "lesson" type tasks. Lessons are scheduled automatically from the course structure. You should create practice, review, quiz, and project tasks only.`;
    } else {
      // Fallback: fetch all user courses for reference
      const allCourses = await db
        .collection("library")
        .find({ userId: new ObjectId(userId), format: "course" })
        .project({ title: 1, topic: 1, difficulty: 1 })
        .limit(20)
        .toArray();

      courseContext = allCourses.length > 0
        ? "\n\nEXISTING COURSES IN USER'S LIBRARY (use as supplementary references):\n" +
          allCourses.map((c) => `- "${c.title}" (Topic: ${c.topic}, Level: ${c.difficulty})`).join("\n")
        : "\n\nNo existing courses in user's library.";
    }

    // Build user context for personalization
    const userContext = [
      freshUser.skillLevel ? `Skill Level: ${freshUser.skillLevel}` : "",
      freshUser.goals?.length ? `Goals: ${freshUser.goals.join(", ")}` : "",
      freshUser.timeCommitment ? `Weekly Time: ${freshUser.timeCommitment} hours` : "",
      freshUser.educationLevel ? `Education: ${freshUser.educationLevel}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert learning designer and study planner. Create a structured, personalized study plan in JSON format.

USER PROFILE:
${userContext || "No profile data available"}
${courseContext}

GOAL: "${goal || "general learning"}"

${selectedCourses.length > 0 ? `COURSE-BASED PLAN:
The lessons from the courses are scheduled automatically. You must create SUPPLEMENTARY tasks only (practice, review, quiz, project types). Do NOT create "lesson" type tasks.

Each day should have 3-5 supplementary tasks:
- Practice tasks: exercises related to the day's lessons
- Review tasks: review earlier material or flashcards
- Quiz tasks: self-assessment questions
- Project tasks: apply multiple concepts

The lessons will be automatically interleaved between your supplementary tasks. Focus on making the supplementary tasks relevant to what the learner is studying that week.` : `STANDARD PLAN:`}

REQUIREMENTS:
1. Create a ${durationWeeks}-week study plan for "${topic}" at ${planDifficulty} level.
2. Balance the workload across the ${durationWeeks} weeks based on the user's available time.
3. Include a mix of learning activities.
4. ${selectedCourses.length > 0 ? "Do NOT include lesson-type tasks. Only practice, review, quiz, and project tasks." : "Include lessons, practice exercises, review sessions, quizzes, and projects."}
5. Each week should have a clear focus and build progressively on the previous week.
6. Include daily tasks (5-7 days per week) with estimated time for each task.
7. Tasks should be specific and actionable, not vague.
8. Include milestones at the end of each week.
9. Each week MUST start with a brief "Week Overview" task (type: "review", 10-15 min).
10. Each week MUST end with a "Weekly Review & Reflection" task (type: "review", 20-30 min).
11. Include spaced repetition: schedule review tasks 2-3 days after new material.
12. For ${planDifficulty} level:
    - beginner: tasks 20-40 minutes
    - intermediate: tasks 30-50 minutes
    - advanced: tasks 40-60 minutes

TASK DISTRIBUTION PER DAY (Monday-Friday):
- ${selectedCourses.length > 0 ? "0% lesson tasks (lessons are scheduled automatically)" : "60% lesson/practice tasks (core learning)"}
- ${selectedCourses.length > 0 ? "40% practice tasks" : ""}
- 20% review/quiz tasks (reinforcement)
- 20% project/application tasks (synthesis)
Each day should have 3-5 supplementary tasks, with varied types.

PROGRESSIVE STRUCTURE:
- Week 1: Foundations & Core Concepts (easiest)
- Week 2: Building on Foundations (moderate)
- Week 3: Application & Practice (challenging)
- Week ${durationWeeks}: Synthesis & Mastery (most challenging)
Adjust this pattern if durationWeeks < 4.

CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "title": "Descriptive plan title (e.g., 'Master Python Programming: From Zero to Hero')",
  "topic": "${topic}",
  "goal": "${goal || "general learning"}",
  "difficulty": "${planDifficulty}",
  "durationWeeks": ${durationWeeks},
  "totalEstimatedHours": number,
  "overview": "2-3 sentence summary of the plan and what the learner will achieve",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week focus area (e.g., 'Python Fundamentals: Variables & Control Flow')",
      "goals": ["Specific learning objective 1", "Specific learning objective 2"],
      "days": [
        {
          "day": "Monday",
          "tasks": [
            {
              "type": "lesson",
              "title": "Specific, actionable task title (e.g., 'Learn Python Variables and Data Types')",
              "description": "1-2 sentence description of exactly what to do and what to focus on",
              "estimatedMinutes": 45,
              "relatedCourseTitle": "Course Title if this task uses a selected course, otherwise null"
            }
          ]
        }
      ],
      "milestone": "What the learner should be able to do by end of this week"
    }
  ],
  "resources": ["Optional external resource suggestions (URLs, books, tools)"]
}

TASK TYPES (use one of):
- "lesson": Reading/watching/learning new material (core content)
- "practice": Hands-on exercises, coding challenges, or drills
- "review": Reviewing previous material, flashcards, or spaced repetition
- "quiz": Self-assessment, practice quiz, or knowledge check
- "project": Building something practical, applying multiple concepts

DAYS: Include Monday through Friday minimum. Saturday/Sunday optional (rest or light review).

QUALITY GUIDELINES:
- Titles should be specific: "Learn CSS Flexbox Layout" not "Study CSS"
- Descriptions should include what resources to use and what to focus on
- Estimated minutes should be realistic for ${planDifficulty} level learners
- Each day should have a logical flow: learn → practice → review/apply
- Include variety: don't repeat the same activity type consecutively

Return ONLY the JSON object.`,
        },
        {
          role: "user",
          content: `Create a ${durationWeeks}-week study plan for "${topic}" focused on ${goal || "general learning"} at ${planDifficulty} level. My available time is approximately ${freshUser.timeCommitment || "4-7"} hours per week.${selectedCourses.length > 0 ? ` I want this plan built around my ${selectedCourses.length} selected course(s): ${selectedCourses.map((c) => `"${c.title}"`).join(", ")}. Use the specific module and lesson structure from these courses.` : ""}

Please ensure:
- Tasks are specific and actionable (not vague like "study chapter 1")
- Each day has a logical progression of activities
- Include review sessions after learning new material
- Balance difficulty within each week
- Estimated times are realistic for my schedule`,
        },
      ],
    });

    let plan;
    try {
      plan = JSON.parse(completion.choices[0].message.content.trim());
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse study plan from AI response" },
        { status: 500 }
      );
    }

    // Validate structure
    if (!plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
      return NextResponse.json(
        { error: "Invalid study plan format from AI" },
        { status: 500 }
      );
    }

    // Normalize and save to library collection
    const planId = new ObjectId();
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let normalizedWeeks;

    if (selectedCourses.length > 0 && totalCourseLessons > 0) {
      // === COURSE-BASED PLAN: Build structure from course lessons ===
      // Distribute lessons evenly across all weeks/days
      const lessonsPerDay = Math.ceil(totalCourseLessons / totalDays);
      let lessonPointer = 0;

      normalizedWeeks = [];

      for (let wi = 0; wi < durationWeeks; wi++) {
        const aiWeek = plan.weeks[wi] || plan.weeks[plan.weeks.length - 1] || {};
        const days = [];

        for (let di = 0; di < daysPerWeek; di++) {
          const dayName = DAYS[di];
          const tasks = [];

          // 1. Add lessons for this day from course structure
          for (let l = 0; l < lessonsPerDay && lessonPointer < totalCourseLessons; l++) {
            const mapping = allCourseLessons[lessonPointer];
            tasks.push({
              type: "lesson",
              title: mapping.lessonTitle,
              description: `${mapping.courseTitle} > Module ${mapping.moduleId}: ${mapping.moduleTitle} > ${mapping.lessonTitle}`,
              estimatedMinutes: planDifficulty === "advanced" ? 50 : planDifficulty === "intermediate" ? 40 : 30,
              relatedCourseTitle: mapping.courseTitle,
              courseId: mapping.courseId,
              moduleId: mapping.moduleId,
              lessonIndex: mapping.lessonIndex,
              relatedCourseTopic: mapping.courseTopic,
              completed: false,
            });
            lessonPointer++;
          }

          // 2. Add AI-generated supplementary tasks for this day
          const aiDay = aiWeek.days?.[di] || aiWeek.days?.[di % (aiWeek.days?.length || 1)];
          if (aiDay?.tasks) {
            for (const task of aiDay.tasks) {
              tasks.push({
                type: task.type || "practice",
                title: task.title || "",
                description: task.description || "",
                estimatedMinutes: task.estimatedMinutes || 30,
                relatedCourseTitle: task.relatedCourseTitle || null,
                courseId: null,
                moduleId: null,
                lessonIndex: null,
                relatedCourseTopic: null,
                completed: false,
              });
            }
          } else {
            // Fallback supplementary tasks if AI didn't provide enough
            if (tasks.length > 0) {
              tasks.push({
                type: "practice",
                title: `Practice exercises for today's lessons`,
                description: `Apply what you learned from today's ${tasks.length} lesson(s) with hands-on exercises.`,
                estimatedMinutes: 30,
                relatedCourseTitle: null,
                courseId: null,
                moduleId: null,
                lessonIndex: null,
                relatedCourseTopic: null,
                completed: false,
              });
            }
          }

          days.push({ day: dayName, tasks });
        }

        normalizedWeeks.push({
          weekNumber: wi + 1,
          title: aiWeek.title || `Week ${wi + 1}`,
          goals: aiWeek.goals || [],
          days,
          milestone: aiWeek.milestone || "",
        });
      }

      // Distribute any remaining lessons (overflow from last week)
      if (lessonPointer < totalCourseLessons) {
        const lastWeek = normalizedWeeks[normalizedWeeks.length - 1];
        const lastDay = lastWeek.days[lastWeek.days.length - 1];
        while (lessonPointer < totalCourseLessons) {
          const mapping = allCourseLessons[lessonPointer];
          lastDay.tasks.push({
            type: "lesson",
            title: mapping.lessonTitle,
            description: `${mapping.courseTitle} > Module ${mapping.moduleId}: ${mapping.moduleTitle} > ${mapping.lessonTitle}`,
            estimatedMinutes: planDifficulty === "advanced" ? 50 : planDifficulty === "intermediate" ? 40 : 30,
            relatedCourseTitle: mapping.courseTitle,
            courseId: mapping.courseId,
            moduleId: mapping.moduleId,
            lessonIndex: mapping.lessonIndex,
            relatedCourseTopic: mapping.courseTopic,
            completed: false,
          });
          lessonPointer++;
        }
      }
    } else {
      // === STANDARD PLAN (no courses): Use AI-generated structure ===
      normalizedWeeks = plan.weeks.map((week, wi) => ({
        weekNumber: wi + 1,
        title: week.title || `Week ${wi + 1}`,
        goals: week.goals || [],
        days: (week.days || []).map((day) => ({
          day: day.day || "",
          tasks: (day.tasks || []).map((task) => ({
            type: task.type || "lesson",
            title: task.title || "",
            description: task.description || "",
            estimatedMinutes: task.estimatedMinutes || 30,
            relatedCourseTitle: task.relatedCourseTitle || null,
            courseId: null,
            moduleId: null,
            lessonIndex: null,
            relatedCourseTopic: null,
            completed: false,
          })),
        })),
        milestone: week.milestone || "",
      }));
    }

    const normalizedPlan = {
      _id: planId,
      userId: new ObjectId(userId),
      title: plan.title || `${topic} Study Plan`,
      topic: topic.trim().toLowerCase(),
      originalTopic: topic,
      difficulty: planDifficulty,
      format: "study_plan",
      goal: goal || "general learning",
      durationWeeks: durationWeeks,
      totalEstimatedHours: plan.totalEstimatedHours || 0,
      overview: plan.overview || "",
      selectedCourseIds: selectedCourses.map((c) => c._id),
      selectedCourseNames: selectedCourses.map((c) => c.title),
      weeks: normalizedWeeks,
      resources: plan.resources || [],
      progress: 0,
      completedTasks: 0,
      totalTasks: 0,
      completed: false,
      pinned: false,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    // Recalculate totalTasks
    normalizedPlan.totalTasks = normalizedPlan.weeks.reduce(
      (sum, week) =>
        sum +
        (week.days || []).reduce(
          (dSum, day) => dSum + (day.tasks || []).length,
          0
        ),
      0
    );

    await db.collection("library").insertOne(normalizedPlan);

    // Track usage
    await trackAPIUsage(userId, "generate-study-plan", {
      itemType: "study_plan_generation",
      creditCost: 25,
    });

    return NextResponse.json({
      success: true,
      studyPlanId: planId.toString(),
      plan: {
        title: normalizedPlan.title,
        topic: normalizedPlan.originalTopic,
        difficulty: normalizedPlan.difficulty,
        durationWeeks: normalizedPlan.durationWeeks,
        totalEstimatedHours: normalizedPlan.totalEstimatedHours,
        overview: normalizedPlan.overview,
        weeks: normalizedPlan.weeks,
        resources: normalizedPlan.resources,
        totalTasks: normalizedPlan.totalTasks,
        completedTasks: 0,
        progress: 0,
        selectedCourseNames: normalizedPlan.selectedCourseNames,
      },
    });
  } catch (error) {
    console.error("Study plan generation failed:", error);
    throw error;
  }
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
