import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handlePost(request, { params }) {
  const user = request.user;
  const { id } = await params;
  const { moduleIdx, lessonIdx } = await request.json();

  if (moduleIdx == null || lessonIdx == null) {
    return NextResponse.json({ error: "moduleIdx and lessonIdx are required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const mod = classroom.modules?.[moduleIdx];
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const lesson = mod.lessons?.[lessonIdx];
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const prompt = `Write an EXTREMELY DETAILED, high-quality academic educational lesson in Markdown.
The lesson MUST be exhaustive, comprehensive, and very long (target 1500-2500 words).

Topic: ${classroom.subject || classroom.name}
Module: ${mod.title}
Lesson: ${lesson.title}
Difficulty: ${classroom.academicLevel || "intermediate"}
Target length: 1500-2500 words (CRITICAL: Do not be concise. Dive extremely deep into every sub-topic).

- Engaging and thorough introduction
- Clear, specific learning objectives
- In-depth step-by-step explanations with multiple examples
- Industry best practices and common pitfalls
- Detailed code examples (if relevant) with line-by-line explanations
- CRITICAL: DO NOT use Mermaid syntax, flowchart diagrams, or process flow diagrams of any kind.
- **Interactive Data Charts**: Use \`\`\`chart\`\`\` blocks ONLY for quantitative data (bar, line, pie, doughnut).
  CRITICAL: The \`\`\`chart\`\`\` block MUST start with \`\`\`chart and end with \`\`\` on its own line.
- 3-5 Practice exercises with solutions. Provide clear explanations for each solution.
- Comprehensive Key takeaways
- A specific "Further Reading" section with suggested topics
- CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math.
- MEGA IMPORTANT: NEVER wrap normal English sentences in math delimiters!
- NEVER put math equations inside code blocks.
- Use only the following visual block types:
  - \`\`\`chart\`\`\` for data visualizations (bar, line, pie, doughnut)
  - \`\`\`table\`\`\` for markdown tables
- **Quantity constraint**: Include at least 3-5 high-quality charts using the \`\`\`chart\`\`\` block per lesson.
Use proper Markdown: ##, ###, **bold**, *italics*, \`\`\`code\`\`\`, > quotes, lists.
CRITICAL: DO NOT use tables or table formatting. Use lists or structured paragraphs instead.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an elite academic educator writing exhaustive, high-value lesson content in Markdown. You never skip details." },
      { role: "user", content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 4000,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });

  classroom.modules[moduleIdx].lessons[lessonIdx].content = content;
  await classroom.save();

  return NextResponse.json({ success: true, content });
}

async function handlePut(request, { params }) {
  const user = request.user;
  const { id } = await params;
  const { moduleIdx, lessonIdx, content } = await request.json();

  if (moduleIdx == null || lessonIdx == null) {
    return NextResponse.json({ error: "moduleIdx and lessonIdx are required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!classroom.modules?.[moduleIdx]?.lessons?.[lessonIdx]) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  classroom.modules[moduleIdx].lessons[lessonIdx].content = content || "";
  await classroom.save();

  return NextResponse.json({ success: true, content });
}

export const POST = handler(handlePost);
export const PUT = handler(handlePut);
