// src/app/api/ai/tutor/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { checkCourseAccess } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === Shared Auth Helper ===
async function getUserId(request) {
  let token = request.headers.get("authorization")?.split("Bearer ")?.[1];

  if (!token) {
    token = (await cookies()).get("token")?.value;
  }

  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return decoded?.id ? decoded.id : null;
  } catch (err) {
    console.warn("Invalid token in AI route:", err.message);
    return null;
  }
}

// === Shared: Lesson prompt builder ===
function buildLessonPrompt({ courseTopic, moduleTitle, lessonTitle, difficulty }) {
  const wordCount = "2500–3000";

  return `Write an EXTREMELY DETAILED, high-quality academic educational lesson in Markdown.
The lesson MUST be exhaustive, comprehensive, and very long.

Topic: ${courseTopic}
Module: ${moduleTitle || "Core Concepts"}
Lesson: ${lessonTitle}
Difficulty: ${difficulty}
Target length: ${wordCount} words (CRITICAL: Do not be concise. Dive extremely deep into every sub-topic).

- STRUCTURE (REQUIRED): Always include these sections in this order, with headings exactly as shown:
  1) ## Learning Objectives
  2) ## Engaging Introduction
  3) ## Core Concepts and Explanations
  4) ## Industry Best Practices and Common Pitfalls
  5) ## Practice Exercises (with solutions)
  6) ## Key Takeaways
  7) ## Further Reading
  Never stop before "## Key Takeaways" and "## Further Reading".

- CODE (REQUIRED): Any code must be inside fenced code blocks using triple backticks with a language tag (e.g. \`\`\`java).
  Every code fence MUST be closed with \`\`\` on its own line.
- CRITICAL: DO NOT use Mermaid syntax, flowchart diagrams, or process flow diagrams of any kind. DO NOT output \`\`\`flow\`\`\` blocks.
- **Interactive Data Charts**: Use \`\`\`chart\`\`\` blocks ONLY for quantitative data (bar, line, pie, doughnut).
  CRITICAL: The \`\`\`chart\`\`\` block MUST start with \`\`\`chart and end with \`\`\` on its own line.
  Example:
  \`\`\`chart
  {
    "type": "bar",
    "title": "Topic Distribution",
    "data": {
      "labels": ["Concept A", "Concept B", "Concept C"],
      "datasets": [{ "label": "Engagement %", "data": [65, 85, 45], "backgroundColor": "rgba(99, 102, 241, 0.8)" }]
    }
  }
  \`\`\`
- **Quantity constraint**: Include at least 3-5 high-quality charts per lesson.
- **DIAGRAMS — MANDATORY**: You MUST include at least 1-2 diagram references per lesson using {{diagram:diagram-id}} on its own line. This is NOT optional.
  - If the concept matches one of these curated IDs, use it exactly:
    Biology: human-brain-sagittal, human-heart-diagram, human-heart-labeled, animal-cell-structure, animal-cell-simple, animal-cell-detailed, respiratory-system, digestive-system, skeletal-system, nervous-system, muscular-system, plant-cell, cell-mitosis
    Physics: battery-resistor-circuit, em-spectrum, electromagnetic-wave, light-refraction, newtons-cradle, projectile-motion
    Chemistry: periodic-table, atom-bohr-model, ionic-bonding, ph-scale, dna-helix
    Math/Geometry: pythagorean-theorem, inscribed-angle, coordinate-plane, rectangle, square, circle, triangle, right-triangle, parallelogram, trapezoid, cylinder, cone
  - If no curated ID fits but a diagram would still help, invent a short, descriptive, lowercase-hyphenated slug
    (e.g. "mitochondria-structure", "supply-demand-curve") that plainly names the subject. The system will
    attempt to find a matching diagram automatically.
  - ALWAYS include diagrams for: anatomy lessons (skeletal-system, muscular-system, etc.), cell biology (animal-cell-*, plant-cell), organ systems (respiratory-system, digestive-system), and geometry (rectangle, circle, triangle, etc.).
  - Example — the skeletal system lesson SHOULD look like:
    The skeletal system provides structural support for the human body.

    {{diagram:skeletal-system}}

    The axial skeleton forms the central axis...
- CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math.
- MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters.
- NEVER put math equations inside code blocks.
- DO NOT use tables or table formatting. Use lists or structured paragraphs instead.
- Avoid generic chart titles like "Interactive Flow Diagram"; use short, formal descriptions.`;
}

// === Shared: Safer chart-JSON extraction (fixes brace-counting bug) ===
function postProcessContent(content) {
  if (!content) return content;

  let processed = content;
  const startRegex = /(?:^|\n)[ \t]*(?:chart\s*\n+)?([ \t]*\{)/g;
  let match;
  const replacements = [];

  while ((match = startRegex.exec(content)) !== null) {
    const startIndex = match.index + (match[0].length - match[1].length);
    let balance = 0;
    let foundEnd = false;
    let inString = false;
    let escaped = false;
    let i = startIndex;

    for (; i < content.length; i++) {
      const ch = content[i];

      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') inString = true;
      else if (ch === "{") balance++;
      else if (ch === "}") {
        balance--;
        if (balance === 0) {
          foundEnd = true;
          i++;
          break;
        }
      }
    }

    if (foundEnd) {
      const potentialJson = content.substring(startIndex, i).trim();
      if (potentialJson.includes('"type"') && (potentialJson.includes('"data"') || potentialJson.includes('"datasets"'))) {
        try {
          JSON.parse(potentialJson);
          replacements.push({ full: content.substring(match.index, i), json: potentialJson });
          startRegex.lastIndex = i;
        } catch {
          // malformed JSON — leave untouched
        }
      }
    }
  }

  replacements.forEach((r) => {
    processed = processed.replace(r.full, `\n\`\`\`chart\n${r.json}\n\`\`\`\n`);
  });

  return processed;
}

// === SSE Helpers ===
function sseHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function sseWrite(controller, encoder, { event, data }) {
  const safeEvent = String(event || "message");
  const payload = typeof data === "string" ? data : JSON.stringify(data ?? null);
  controller.enqueue(encoder.encode(`event: ${safeEvent}\ndata: ${payload}\n\n`));
}

// === MAIN HANDLER ===
export async function POST(request) {
  try {
    const userId = await getUserId(request);
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { action } = body;

    if (action === "generateLesson") {
      return body?.stream
        ? await handleGenerateLessonStream(body, userId, db, request)
        : await handleGenerateLesson(body, userId, db);
    }
    if (action === "generateQuestions") return await handleGenerateQuestions(body, userId, db);
    if (action === "generateFlashcards") return await handleGenerateFlashcards(body, userId, db);
    return await handleAIQuestion(body, userId, db);
  } catch (error) {
    console.error("AI Tutor API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// === Handle AI Q&A ===
async function handleAIQuestion(body, userId, db) {
  const {
    question,
    messages = [],
    courseContent = "",
    lessonTitle = "the lesson",
    context = "",
    action = "answer",
  } = body;

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const courseTitleMatch = context.match(/Course:\s*([^,]+)/);
  const courseTitle = courseTitleMatch ? courseTitleMatch[1].trim() : lessonTitle;

  const history = messages.map(msg => ({
    role: msg.type === "ai" ? "assistant" : "user",
    content: msg.message
  })).slice(-10);

  if (action === "checkRelevance") {
    const relevancePrompt = `You are evaluating if a student's question is related to their course.
    
Course Title: ${courseTitle}
Course Context: ${context.substring(0, 500)}
Course Content Preview: ${courseContent.substring(0, 2000)}

Question: "${question}"

Respond with ONLY "YES" if the question is related to the course topic, any content in the course, or is a follow-up to the previous conversation about the course.
Respond with ONLY "NO" if the question is completely unrelated to the course.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: relevancePrompt },
        ...history,
        { role: "user", content: question.trim() },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim()?.toUpperCase();

    if (!response) {
      return NextResponse.json({ error: "Could not evaluate relevance" }, { status: 500 });
    }

    return NextResponse.json({ success: true, relevant: response.includes("YES") });
  }

  const systemPrompt = `You are an expert AI tutor helping students learn from their course material.

Provide a direct, concise answer to the student's question based on the course content and conversation history. Use markdown formatting to **bold** key terms and concepts.

RULES:
- Answer ONLY the question asked
- Keep responses under 100 words
- Be direct and to the point
- **Bold** important terms, concepts, and key words using markdown
- Use the course content as reference but don't quote it verbatim
- If the student asks a follow-up, use the previous context to provide a helpful answer
- If the question asks for a definition, give just the definition
- If the question asks for an explanation, give just the explanation needed
- CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math. 
- MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters!
- NEVER put math equations inside code blocks.

Course Title: ${courseTitle}
Course Content Reference: ${courseContent.substring(0, 12000)}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: question.trim() },
    ],
    temperature: 0.7,
    max_tokens: 250,
  });

  const response = completion.choices[0]?.message?.content?.trim();

  if (!response) {
    return NextResponse.json({ error: "No response generated" }, { status: 500 });
  }

  if (userId) {
    db.collection("ai_conversations")
      .insertOne({
        userId,
        question,
        response,
        lessonTitle,
        context: context.substring(0, 500),
        createdAt: new Date(),
      })
      .catch(() => {});
  }

  return NextResponse.json({ success: true, response, timestamp: new Date().toISOString() });
}

// === Handle Lesson Generation (Streaming SSE) ===
async function handleGenerateLessonStream(body, userId, db, request) {
  const {
    courseId,
    moduleId,
    lessonIndex,
    lessonTitle,
    moduleTitle,
    courseTopic,
    difficulty = "intermediate",
    shareId,
  } = body;

  const mId = Number(moduleId);
  const lIdx = Number(lessonIndex);

  if (!lessonTitle || !courseTopic || isNaN(mId) || isNaN(lIdx) || mId < 1 || lIdx < 0) {
    return NextResponse.json(
      { error: "lessonTitle, courseTopic, moduleId (>=1), and lessonIndex (>=0) are required and must be valid" },
      { status: 400 }
    );
  }

  const access = await checkCourseAccess(db, userId, courseId, shareId);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Access denied", message: access.reason }, { status: 403 });
  }

  // === Check Cache First ===
  if (courseId && ObjectId.isValid(courseId)) {
    const course = await db.collection("library").findOne(
      { _id: new ObjectId(courseId) },
      { projection: { [`modules.${mId - 1}.lessons.${lIdx}.content`]: 1 } }
    );

    const cachedContent = course?.modules?.[mId - 1]?.lessons?.[lIdx]?.content;

    if (cachedContent && cachedContent.length > 500 && !cachedContent.includes("coming soon")) {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          sseWrite(controller, encoder, { event: "meta", data: { cached: true, moduleId: mId, lessonIndex: lIdx } });
          sseWrite(controller, encoder, { event: "chunk", data: { text: cachedContent } });
          sseWrite(controller, encoder, { event: "done", data: { cached: true } });
          controller.close();
        },
      });
      return new Response(stream, { headers: sseHeaders() });
    }
  }

  const promptBase = buildLessonPrompt({ courseTopic, moduleTitle, lessonTitle, difficulty });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let full = "";
      let pingTimer = null;

      const safeClose = () => {
        try { controller.close(); } catch (_) {}
        if (pingTimer) clearInterval(pingTimer);
      };

      pingTimer = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch (_) {}
      }, 15000);

      try {
        sseWrite(controller, encoder, {
          event: "meta",
          data: { cached: false, moduleId: mId, lessonIndex: lIdx, lessonTitle },
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an elite academic educator writing exhaustive, high-value lesson content in Markdown. You never skip details." },
            { role: "user", content: promptBase },
          ],
          temperature: 0.75,
          max_tokens: 4000,
          stream: true,
        });

        for await (const part of completion) {
          if (request?.signal?.aborted) {
            sseWrite(controller, encoder, { event: "error", data: { error: "aborted" } });
            safeClose();
            return;
          }

          const delta = part?.choices?.[0]?.delta?.content || "";
          if (!delta) continue;
          full += delta;
          sseWrite(controller, encoder, { event: "chunk", data: { text: delta } });
        }

        let content = postProcessContent(full?.trim() || "");
        if (!content) {
          sseWrite(controller, encoder, { event: "error", data: { error: "empty" } });
          safeClose();
          return;
        }

        if (courseId && ObjectId.isValid(courseId)) {
          const updatePath = `modules.${mId - 1}.lessons.${lIdx}.content`;
          await db.collection("library").updateOne(
            { _id: new ObjectId(courseId) },
            { $set: { [updatePath]: content, lastGenerated: new Date() } }
          );
        }

        sseWrite(controller, encoder, { event: "done", data: {} });
        safeClose();
      } catch (err) {
        sseWrite(controller, encoder, { event: "error", data: { error: err?.message || "stream_failed" } });
        safeClose();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

// === Handle Lesson Generation ===
async function handleGenerateLesson(body, userId, db) {
  const {
    courseId,
    moduleId,
    lessonIndex,
    lessonTitle,
    moduleTitle,
    courseTopic,
    difficulty = "intermediate",
    shareId,
  } = body;

  const mId = Number(moduleId);
  const lIdx = Number(lessonIndex);

  if (!lessonTitle || !courseTopic || isNaN(mId) || isNaN(lIdx) || mId < 1 || lIdx < 0) {
    return NextResponse.json(
      { error: "lessonTitle, courseTopic, moduleId (>=1), and lessonIndex (>=0) are required and must be valid" },
      { status: 400 }
    );
  }

  const access = await checkCourseAccess(db, userId, courseId, shareId);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Access denied", message: access.reason }, { status: 403 });
  }

  // === Check Cache First ===
  if (courseId && ObjectId.isValid(courseId)) {
    const course = await db.collection("library").findOne(
      { _id: new ObjectId(courseId) },
      { projection: { [`modules.${mId - 1}.lessons.${lIdx}.content`]: 1 } }
    );

    const cachedContent = course?.modules?.[mId - 1]?.lessons?.[lIdx]?.content;

    if (cachedContent && cachedContent.length > 500 && !cachedContent.includes("coming soon")) {
      return NextResponse.json({ content: cachedContent, cached: true });
    }
  }

  const promptBase = buildLessonPrompt({ courseTopic, moduleTitle, lessonTitle, difficulty });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an elite academic educator writing exhaustive, high-value lesson content in Markdown. You never skip details." },
      { role: "user", content: promptBase },
    ],
    temperature: 0.75,
    max_tokens: 4000,
  });

  let content = postProcessContent(completion.choices[0]?.message?.content?.trim());
  if (!content) {
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }

  if (courseId && ObjectId.isValid(courseId)) {
    const updatePath = `modules.${mId - 1}.lessons.${lIdx}.content`;
    await db.collection("library").updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { [updatePath]: content, lastGenerated: new Date() } }
    );
  }

  return NextResponse.json({ success: true, content, cached: false });
}

// === Handle Generate Q&A from Lesson Content ===
async function handleGenerateQuestions(body, userId, db) {
  const { lessonContent, lessonTitle, courseTopic } = body;

  if (!lessonContent?.trim()) {
    return NextResponse.json({ error: "Lesson content is required" }, { status: 400 });
  }

  const systemPrompt = `You are an expert educator creating study questions from lesson content.

Generate exactly 5 high-quality question-and-answer pairs from the provided lesson content.
Each question should test understanding of key concepts, not just surface-level recall.

RULES:
- Generate EXACTLY 5 questions
- Mix question types: definitions, explanations, comparisons, applications, and "why" questions
- Answers should be concise but complete (2-4 sentences)
- Questions should progress from foundational to more advanced
- Bold key terms in answers using markdown **like this**
- Format each Q&A pair clearly

Output format (strict JSON):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "answer": "Answer text here.",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  const userPrompt = `Lesson: ${lessonTitle}
${courseTopic ? `Course: ${courseTopic}` : ""}

Lesson Content:
${lessonContent.substring(0, 8000)}

Generate 5 Q&A pairs from this lesson content. Return ONLY valid JSON.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0]?.message?.content?.trim();

  if (!response) {
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
  }

  const questions = parsed?.questions || [];
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "No questions generated" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    questions: questions.map((q, i) => ({
      id: q.id || i + 1,
      question: q.question,
      answer: q.answer,
      difficulty: q.difficulty || "medium",
    })),
    timestamp: new Date().toISOString(),
  });
}

// === Handle Generate Flashcards from Lesson Content ===
async function handleGenerateFlashcards(body, userId, db) {
  const { lessonContent, lessonTitle, courseTopic, difficulty = "intermediate" } = body;

  if (!lessonContent?.trim()) {
    return NextResponse.json({ error: "Lesson content is required" }, { status: 400 });
  }

  const systemPrompt = `You are an expert educator creating flashcards from lesson content.

Generate exactly 10 high-quality flashcards from the provided lesson content.
Each flashcard should test understanding of key concepts.

RULES:
- Generate EXACTLY 10 flashcards
- Mix categories: concept, tip, warning, practice
- Questions should be clear and concise
- Answers should be complete but brief (2-3 sentences)
- Bold key terms in answers using markdown **like this**
- Include key points as bullet lists
- Add a practical example where relevant

Output format (strict JSON):
{
  "cards": [
    {
      "id": 1,
      "question": "Front of card - question or prompt",
      "answer": "Back of card - main answer",
      "explanation": "Why this matters",
      "keyPoints": ["Point 1", "Point 2"],
      "example": "Practical example",
      "category": "concept|tip|warning|practice",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}`;

  const userPrompt = `Lesson: ${lessonTitle}
${courseTopic ? `Course: ${courseTopic}` : ""}
Difficulty: ${difficulty}

Lesson Content:
${lessonContent.substring(0, 8000)}

Generate 10 flashcards from this lesson content. Return ONLY valid JSON.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0]?.message?.content?.trim();

  if (!response) {
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }

  let parsed;
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
  }

  const cards = parsed?.cards || [];
  if (!Array.isArray(cards) || cards.length === 0) {
    return NextResponse.json({ error: "No flashcards generated" }, { status: 500 });
  }

  const cardSet = {
    userId: userId ? new ObjectId(userId) : null,
    title: `${courseTopic || lessonTitle} - ${difficulty}`,
    topic: (courseTopic || lessonTitle).toLowerCase().trim(),
    originalTopic: courseTopic || lessonTitle,
    difficulty,
    totalCards: cards.length,
    cards: cards.map((c, i) => ({
      _id: new ObjectId(),
      id: i + 1,
      question: c.question,
      answer: c.answer,
      explanation: c.explanation || "",
      keyPoints: c.keyPoints || [],
      example: c.example || "",
      category: c.category || "concept",
      difficulty: c.difficulty || difficulty,
      reviews: [],
      srs: {
        interval: 0,
        repetitions: 0,
        ease: 2.5,
        dueDate: new Date().toISOString(),
      },
    })),
    progress: 0,
    completed: false,
    bookmarked: false,
    ankiExportReady: true,
    sourceLesson: lessonTitle,
    createdAt: new Date(),
    lastAccessed: new Date(),
  };

  const result = await db.collection("cardSets").insertOne(cardSet);

  return NextResponse.json({
    success: true,
    cardSetId: result.insertedId.toString(),
    title: cardSet.title,
    totalCards: cards.length,
    cards: cardSet.cards,
    timestamp: new Date().toISOString(),
  });
}
