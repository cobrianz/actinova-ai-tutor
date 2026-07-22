import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { PRODUCTS } from "@/lib/planLimits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handlePost(request) {
  const { db } = await connectToDatabase();
  const user = request.user;

  // Fetch user for fresh credit count
  const freshUser = await db.collection("users").findOne(
    { _id: new mongoose.Types.ObjectId(user._id) }
  );

  if (!freshUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user is premium
  const isPremium =
    freshUser.isPremium ||
    (freshUser.subscription &&
      (freshUser.subscription.plan === "pro" || freshUser.subscription.plan === "enterprise") &&
      freshUser.subscription.status === "active");

  const product = PRODUCTS.find((p) => p.id === "classroom_ai_generation");
  const cost = product?.creditCost || 10;

  if (!isPremium) {
    const currentCredits = freshUser.credits || 0;
    if (currentCredits < cost) {
      return NextResponse.json(
        {
          error: `Insufficient credits for classroom AI generation. This action costs ${cost} credits.`,
          required: cost,
          available: currentCredits,
          code: "INSUFFICIENT_CREDITS"
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(user._id) },
      {
        $inc: { credits: -cost },
        $push: {
          billingHistory: {
            type: "credit_usage",
            itemType: "classroom_ai_generation",
            creditsSpent: cost,
            createdAt: new Date(),
          },
        },
      }
    );
  }

  const { task, name, subject, content, classroomName, assignmentTitle, durationWeeks, academicLevel, existingModules, assignmentType,
    startDate, endDate, midtermDate, instructorName, instructorEmail, officeHours, modules, gradingScheme, schedule, prerequisites } = await request.json();

  let systemPrompt = "";
  let userPrompt = "";

  switch (task) {
    case "note_summary":
      systemPrompt = "You are an academic assistant. Summarize the following content into concise study notes with key points, definitions, and takeaways. Use markdown formatting with headings and bullet points.";
      userPrompt = `Summarize this content for the course "${classroomName}":\n\n${content}`;
      break;

    case "generate_note":
      systemPrompt = "You are an academic assistant. Generate comprehensive study notes on the given topic. Include key concepts, definitions, examples, and important takeaways. Use markdown formatting.";
      userPrompt = `Generate detailed study notes on "${name}" for the course "${classroomName}". ${subject ? `Subject area: ${subject}` : ""}`;
      break;

    case "rubric":
      systemPrompt = `You are an expert academic assessment specialist. Generate a comprehensive grading rubric as a JSON array of objects, each with these fields:
- criterion (string): The evaluation criterion name
- description (string): Detailed description of what this criterion evaluates, including specific expectations for excellent, good, and poor performance
- maxPoints (number): Maximum points for this criterion

Create 5-8 rigorous criteria that thoroughly evaluate the assignment. Include criteria for: content accuracy/completeness, critical thinking/analysis, organization/structure, writing quality/presentation, and relevant to assignment type criteria (e.g., sources for essays, experimental method for labs, code quality for projects).

Each description should be specific enough to guide grading — mention concrete indicators of quality levels.

Return ONLY the JSON array, no other text.`;
      userPrompt = `Create a comprehensive grading rubric for: "${assignmentTitle}" (${name || "assignment"}) in the course "${classroomName}". Max total points: 100. ${content ? `Context: ${content}` : ""}`;
      break;

    case "discussion_prompt":
      systemPrompt = "You are an academic discussion facilitator. Generate a thoughtful discussion prompt that encourages critical thinking and engagement. Include the main question and 2-3 follow-up questions.";
      userPrompt = `Generate a discussion prompt for the topic "${name}" in the course "${classroomName}". ${subject ? `Subject: ${subject}` : ""}`;
      break;

    case "assignment_instructions":
      systemPrompt = "You are an academic content creator. Generate clear, detailed assignment instructions including objectives, requirements, submission guidelines, and grading criteria. Use markdown formatting.";
      userPrompt = `Write assignment instructions for "${assignmentTitle}" in the course "${classroomName}". Type of assignment: ${name || "general"}. ${content ? `Additional context: ${content}` : ""}`;
      break;

    case "syllabus":
      systemPrompt = "You are an academic curriculum designer. Generate a comprehensive course syllabus with weekly topics, learning objectives, and assessment methods. Use markdown formatting with clear sections.";
      userPrompt = `Generate a syllabus for "${name}" course. ${subject ? `Subject: ${subject}` : ""} ${durationWeeks ? `Course duration: ${durationWeeks} weeks.` : ""} ${content ? `Additional details: ${content}` : ""}`;
      break;

    case "syllabus_gen":
      systemPrompt = `You are an expert academic curriculum designer generating a comprehensive, professional course syllabus in markdown format. The syllabus must be detailed, well-structured, and ready for students to read.

RULES:
- Output MUST be valid markdown with clear sections
- Use ## for main sections, ### for subsections
- Use bold, bullet points, and horizontal rules (---) for visual separation
- Include ALL sections below in order
- Calculate midterm date as the midpoint of the course
- Reference the actual module topics in the Week-by-Week Schedule
- Keep total length 800-1500 words
- Do NOT include a title heading (## Course Syllabus) - start directly with Course Information`;

      const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "TBD";
      const scheduleInfo = schedule?.days?.length > 0 ? `${schedule.days.join(", ")}${schedule.startTime && schedule.endTime ? `, ${schedule.startTime} – ${schedule.endTime}` : ""}` : "TBD";
      const prereqList = prerequisites?.length > 0 ? prerequisites.join(", ") : "None";

      userPrompt = `Generate a complete course syllabus for "${name}".

COURSE INFORMATION:
- Course Name: ${name}
- Subject Area: ${subject || "General Studies"}
- Academic Level: ${academicLevel || "Undergraduate"}
- Course Description: ${content || "N/A"}

INSTRUCTOR INFORMATION:
- Instructor Name: ${instructorName || "TBD"}
- Email: ${instructorEmail || "TBD"}
- Office Hours: ${officeHours || "By appointment"}

SCHEDULE:
- Class Meets: ${scheduleInfo}
- Start Date: ${fmtDate(startDate)}
- End Date: ${fmtDate(endDate)}
- Midterm Exam Date: ${fmtDate(midtermDate)}
- Total Duration: ${durationWeeks || "N/A"} weeks
- Grading Scheme: ${gradingScheme || "Percentage"}

PREREQUISITES: ${prereqList}

WEEK-BY-WEEK MODULE TOPICS:
${modules?.length > 0 ? modules.map((m, i) => `Week ${m.weekNumber || i + 1}: ${m.title} — ${m.description || ""}`).join("\n") : "Modules TBD"}

REQUIRED SECTIONS (include all):
1. **Course Information** — Course name, subject, level, credits
2. **Course Description** — Expanded paragraph about what the course covers
3. **Instructor Information** — Name, email, office hours
4. **Course Schedule** — Meeting times, location, start/end/midterm dates
5. **Prerequisites** — Listed prerequisites
6. **Learning Objectives** — 4-6 course-level learning outcomes
7. **Required Materials** — Textbooks, tools, or software
8. **Grading Breakdown** — Percentage breakdown by category
9. **Course Policies** — Attendance, late work, academic integrity, communication
10. **Week-by-Week Schedule** — Map each module to its week with topic and brief description
11. **Important Dates** — Start, midterm, end dates in a clean list
12. **Resources** — Campus or online support resources`;
      break;

    case "course_structure":
      systemPrompt = `You are an expert curriculum designer. Generate a structured course as a JSON array of modules. Each module must have: title (string), description (string, 1-2 sentences), weekNumber (number, starting at 1), and lessons (array). Each lesson must have: title (string), description (string, 1 sentence), duration (number in minutes, typically 60), type (MUST be "lecture" for all lessons), objectives (array of 2-3 strings), materials (array of 1-2 strings). Generate exactly ${durationWeeks || 8} modules. Each module should have exactly 5 lessons (one per weekday: Mon-Fri). ALL lessons must have type "lecture". Return ONLY a valid JSON array, no markdown, no other text.`;
      userPrompt = `Create a course structure for "${name}". ${subject ? `Subject: ${subject}` : ""} ${academicLevel ? `Level: ${academicLevel}` : ""} ${content ? `Description: ${content}` : ""} Generate ${durationWeeks || 8} weekly modules with 5 lessons each (one per weekday). Each module should cover a progressively deeper topic. Include a mix of lectures, labs, readings, videos, and activities.`;
      break;

    case "course_assignments":
      systemPrompt = `You are an expert educator creating detailed, comprehensive assignments for students. Generate assignments as a JSON array. Each assignment must have:
- "title": descriptive assignment title
- "description": 1-2 sentence overview of the assignment
- "instructions": DETAILED markdown instructions (3-5 paragraphs) that include: (1) Clear learning objectives and what the student will demonstrate, (2) Step-by-step breakdown of what to do, (3) Specific requirements and expectations, (4) Evaluation criteria and how they will be assessed, (5) Tips for success or common pitfalls to avoid. Use markdown formatting with **bold** for emphasis and bullet points for lists.
- "type": one of "quiz"|"lab"|"project"|"essay"|"report"|"discussion"|"presentation"|"custom"
- "weekNumber": ${durationWeeks || 1}
- "category": one of "Homework"|"Lab"|"Quiz"|"Project"
- "maxScore": 100
- "passingScore": 60
- "weight": 5-15
- "rubric": array of {criterion, description, maxPoints} with 3-5 grading criteria

Generate exactly 2 assignments. Return ONLY valid JSON array, no markdown.`;
      const typeFilter = assignmentType && assignmentType !== "all" ? ` Preferred type: "${assignmentType}" (at least 1 of 2 should be this type).` : "";
      userPrompt = `Module: "${name}" in ${subject || "General"} subject. Week ${durationWeeks || 1}.${typeFilter} ${content ? `Module content: ${content}` : ""} Create 2 assignments with detailed, comprehensive instructions that clearly explain what students need to do, how they will be evaluated, and what constitutes success.`;
      break;

    case "quiz_questions":
      systemPrompt = `You are an expert assessment designer creating quiz questions. Generate EXACTLY 10 high-quality questions mixing: ~60% multiple-choice, ~20% true/false, ~20% multiple-select. Each question tests understanding of key concepts.

RULES:
- Generate EXACTLY 10 questions
- Each must have: "text", "type", "points" (1-5), "options" (array of strings), "correctAnswer"
- multiple-choice: 4 options, correctAnswer is the correct option string
- true-false: options ["True", "False"], correctAnswer is "True" or "False"  
- multiple-select: 4 options, correctAnswer is array of correct option strings
- Questions should progress from foundational to advanced
- Provide clear, unambiguous questions

Return ONLY valid JSON: { "questions": [{ "text", "type", "points", "options", "correctAnswer" }] }`;
      userPrompt = `Generate 10 quiz questions for: "${name}" (${subject || "General"}). ${content ? `Topic context: ${content}` : ""}`;
      break;

    default:
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: task === "rubric" ? 1000 : task === "course_structure" ? 6000 : task === "course_assignments" ? 4000 : task === "quiz_questions" ? 4000 : task === "syllabus_gen" ? 4000 : 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
  } catch (err) {
    if (err.code === "ETIMEDOUT" || err.message?.includes("timed out")) {
      return NextResponse.json({ error: "AI request timed out. Please try again." }, { status: 504 });
    }
    throw err;
  }

  const result = completion.choices[0]?.message?.content?.trim();

  if (task === "rubric" || task === "course_structure" || task === "course_assignments" || task === "quiz_questions") {
    try {
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ result: parsed });
    } catch {
      if (task === "rubric") {
        return NextResponse.json({ result: [{ criterion: "Content Quality", description: "Accuracy and depth of content", maxPoints: 25 }, { criterion: "Organization", description: "Structure and flow", maxPoints: 20 }, { criterion: "Analysis", description: "Critical thinking and analysis", maxPoints: 25 }, { criterion: "Writing", description: "Grammar, clarity, and style", maxPoints: 15 }, { criterion: "References", description: "Proper citations and sources", maxPoints: 15 }] });
      }
      if (task === "quiz_questions") {
        return NextResponse.json({ result: { questions: [
          { text: "What is the primary purpose of this concept?", type: "multiple-choice", points: 2, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: "Option A" },
          { text: "This concept is essential for understanding the subject.", type: "true-false", points: 1, options: ["True", "False"], correctAnswer: "True" },
          { text: "Which of the following are key components?", type: "multiple-select", points: 3, options: ["Component A", "Component B", "Component C", "Component D"], correctAnswer: ["Component A", "Component B"] },
        ] } });
      }
      if (task === "course_assignments") {
        return NextResponse.json({ result: [
          { title: `${name} - Research Essay`, description: `A comprehensive essay demonstrating mastery of ${name} concepts`, instructions: `**Learning Objectives:**\nThis assignment will help you demonstrate your understanding of key concepts in ${name} and develop your analytical thinking skills.\n\n**What to Do:**\n1. Research the main topics covered in this module\n2. Write a 500-800 word essay addressing the following:\n   - Define and explain the core concepts\n   - Provide real-world examples or applications\n   - Analyze the significance of these concepts in ${subject || "this field"}\n\n**Requirements:**\n- Use clear, academic writing style\n- Include at least 2 references or sources\n- Structure with introduction, body paragraphs, and conclusion\n- Address all parts of the prompt thoroughly\n\n**Evaluation Criteria:**\nYour work will be assessed on: content accuracy and depth (30%), critical analysis (25%), organization and clarity (25%), and writing quality (20%).\n\n**Tips for Success:**\n- Start with an outline to organize your thoughts\n- Use specific examples to support your arguments\n- Proofread before submitting`, type: "essay", category: "Homework", maxScore: 100, passingScore: 60, weight: 10, rubric: [{ criterion: "Content Accuracy", description: "Demonstrates thorough understanding of key concepts", maxPoints: 30 }, { criterion: "Critical Analysis", description: "Provides insightful analysis and connections", maxPoints: 25 }, { criterion: "Organization", description: "Well-structured with clear flow", maxPoints: 25 }, { criterion: "Writing Quality", description: "Clear, academic writing with proper grammar", maxPoints: 20 }] },
          { title: `${name} - Discussion`, description: `Engage with peers on topics from ${name}`, instructions: `**Purpose:**\nThis discussion allows you to explore different perspectives on ${name} concepts and learn from your classmates.\n\n**Discussion Prompt:**\nPost a thoughtful response (150-250 words) addressing one of the following:\n- How do the concepts from this module apply to a real-world scenario?\n- What was the most challenging aspect of this module and why?\n- Compare two different approaches or theories discussed\n\n**Requirements:**\n- Initial post must be substantive and demonstrate understanding\n- Reply to at least 2 classmates with meaningful feedback\n- Use evidence from the module content to support your points\n- Maintain a respectful, academic tone\n\n**Grading:**\nPosts will be evaluated on: content quality and insight (40%), engagement with peers (30%), use of evidence (20%), and writing quality (10%).`, type: "discussion", category: "Homework", maxScore: 100, passingScore: 60, weight: 5, rubric: [{ criterion: "Content Quality", description: "Thoughtful, well-reasoned response", maxPoints: 40 }, { criterion: "Peer Engagement", description: "Meaningful replies to classmates", maxPoints: 30 }, { criterion: "Evidence Usage", description: "Supports points with module content", maxPoints: 20 }, { criterion: "Communication", description: "Clear writing and professional tone", maxPoints: 10 }] }
        ] });
      }
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ result });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
