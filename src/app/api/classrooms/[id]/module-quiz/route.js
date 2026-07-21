import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Test from "@/models/Quiz";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handlePost(request, { params }) {
  const user = request.user;
  const { id } = await params;
  const { moduleIdx } = await request.json();

  if (moduleIdx == null) {
    return NextResponse.json({ error: "moduleIdx is required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const mod = classroom.modules?.[moduleIdx];
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const lessonSummaries = (mod.lessons || []).map((l, i) => {
    const contentPreview = l.content ? l.content.substring(0, 500) : "No content generated yet";
    return `Lesson ${i + 1}: ${l.title}\nType: ${l.type}\nDescription: ${l.description}\nContent preview: ${contentPreview}`;
  }).join("\n\n");

  const prompt = `You are an expert assessment designer creating a quiz for a course module.

Course: ${classroom.subject || classroom.name}
Module: ${mod.title} (Week ${mod.weekNumber})
Module Description: ${mod.description}

Lessons in this module:
${lessonSummaries}

Generate exactly 10 high-quality quiz questions covering the key concepts from this module.
Mix question types: multiple-choice, true/false, multiple-select.
Questions should progress from foundational to more advanced.

RULES:
- Generate EXACTLY 10 questions
- Each question must have a "text" field, "type" field, "points" field (1-5), "options" array (for MC/MS), and "correctAnswer" field
- For multiple-choice: type "multiple-choice", options array with 4 options, correctAnswer is the correct option string
- For true/false: type "true-false", options ["True", "False"], correctAnswer is "True" or "False"
- For multiple-select: type "multiple-select", options array with 4 options, correctAnswer is array of correct option strings
- Each question should test understanding of key concepts from the module lessons
- Provide clear, unambiguous questions

Output format (strict JSON):
{
  "questions": [
    {
      "text": "Question text here?",
      "type": "multiple-choice",
      "points": 2,
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert educator creating high-quality quiz assessments. Return ONLY valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0]?.message?.content?.trim();
  if (!response) return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });

  let parsed;
  try { parsed = JSON.parse(response); } catch { return NextResponse.json({ error: "Invalid AI response" }, { status: 500 }); }

  const questions = parsed?.questions || [];
  if (!questions.length) return NextResponse.json({ error: "No questions generated" }, { status: 500 });

  const quizTitle = `${mod.title} - Module Quiz`;
  const quiz = await Test.create({
    title: quizTitle,
    course: classroom.subject || classroom.name,
    createdBy: user._id,
    questions: questions.map((q) => ({
      text: q.text,
      type: q.type === "true_false" ? "true-false" : q.type === "multiple_choice" ? "multiple-choice" : q.type,
      points: q.points || 2,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
    })),
  });

  const hasExistingQuiz = classroom.forkedContent?.some(
    (fc) => fc.contentType === "quiz" && fc.title === quizTitle
  );
  if (hasExistingQuiz) {
    return NextResponse.json({ error: "A quiz already exists for this module" }, { status: 409 });
  }

  classroom.forkedContent.push({
    contentType: "quiz",
    contentId: quiz._id,
    title: quizTitle,
    description: `Auto-generated quiz for ${mod.title}`,
    weekNumber: mod.weekNumber || 0,
    unlocked: true,
    meta: { course: classroom.subject || classroom.name, questionCount: questions.length },
  });
  await classroom.save();

  return NextResponse.json({
    success: true,
    quiz: { _id: quiz._id, title: quizTitle, questionCount: questions.length },
  });
}

export const POST = handler(handlePost);
