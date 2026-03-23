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

// === Helper: Get Premium Status ===
async function getPremiumStatus(db, userId) {
  if (!userId) return false;
  try {
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          isPremium: 1,
          "subscription.plan": 1,
          "subscription.status": 1,
        },
      }
    );
    return (
      user?.isPremium ||
      (user?.subscription?.plan === "pro" &&
        user?.subscription?.status === "active")
    );
  } catch {
    return false;
  }
}

// Helper to post-process AI generated content for robustness
function postProcessContent(content) {
  if (!content) return content;
  
  let processed = content;
  const startRegex = /(?:^|\n)[ \t]*(?:chart\s*\n+)?([ \t]*\{)/g;
  let match;
  
  // We'll iterate backwards or use a replacement strategy to avoid index shifting
  // A simple strategy is to find all matches and then replace them
  const replacements = [];
  
  while ((match = startRegex.exec(content)) !== null) {
    const startIndex = match.index + (match[0].length - match[1].length);
    let balance = 0;
    let foundEnd = false;
    let i = startIndex;
    
    for (; i < content.length; i++) {
        if (content[i] === '{') balance++;
        else if (content[i] === '}') {
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
            replacements.push({
                full: content.substring(match.index, i),
                json: potentialJson
            });
            startRegex.lastIndex = i;
        }
    }
  }

  replacements.forEach(r => {
    processed = processed.replace(r.full, `\n\`\`\`chart\n${r.json}\n\`\`\`\n`);
  });

  return processed;
}

// === MAIN HANDLER ===
export async function POST(request) {
  const userId = await getUserId(request);
  const { db } = await connectToDatabase();

  try {
    const body = await request.json();
    const { action } = body;

    // === 1. Generate Lesson Content ===
    if (action === "generateLesson") {
      return await handleGenerateLesson(body, userId, db);
    }

    // === 2. AI Q&A (Default) ===
    return await handleAIQuestion(body, userId, db);
  } catch (error) {
    console.error("AI Tutor API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// === Handle AI Q&A ===
async function handleAIQuestion(body, userId, db) {
  const {
    question,
    messages = [], // Chat history
    courseContent = "",
    lessonTitle = "the lesson",
    context = "",
    action = "answer", // "checkRelevance" or "answer"
  } = body;

  if (!question?.trim()) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

  // Extract course title from context (format: "Course: [title], Level: ...")
  const courseTitleMatch = context.match(/Course:\s*([^,]+)/);
  const courseTitle = courseTitleMatch
    ? courseTitleMatch[1].trim()
    : lessonTitle;

  // Prepare messages for OpenAI
  const history = messages.map(msg => ({
    role: msg.type === "ai" ? "assistant" : "user",
    content: msg.message
  })).slice(-10); // Keep last 10 messages for context

  if (action === "checkRelevance") {
    // Only check if question is related to course
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
      temperature: 0.1, // Low temperature for consistent yes/no
      max_tokens: 10, // Very short response
    });

    const response = completion.choices[0]?.message?.content
      ?.trim()
      ?.toUpperCase();

    if (!response) {
      return NextResponse.json(
        { error: "Could not evaluate relevance" },
        { status: 500 }
      );
    }

    const isRelevant = response.includes("YES");

    return NextResponse.json({
      success: true,
      relevant: isRelevant,
    });
  }

  // Action: "answer" - provide the actual answer
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
- MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters! If you wrap text in math delimiters, it ruins the formatting by removing all spaces (e.g. 5.00islikely). Only use them for actual standalone mathematical formulas.
- NEVER put math equations inside code blocks. NEVER use Markdown code backticks for math.

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
    return NextResponse.json(
      { error: "No response generated" },
      { status: 500 }
    );
  }

  // Save conversation (fire-and-forget)
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
      .catch(() => { });
  }

  return NextResponse.json({
    success: true,
    response,
    timestamp: new Date().toISOString(),
  });
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
  } = body;

  const mId = Number(moduleId);
  const lIdx = Number(lessonIndex);

  if (!lessonTitle || !courseTopic || isNaN(mId) || isNaN(lIdx)) {
    return NextResponse.json(
      { error: "lessonTitle, courseTopic, moduleId, and lessonIndex are required and must be valid" },
      { status: 400 }
    );
  }

  // === 3. Access Validation ===
  const { shareId } = body;
  const access = await checkCourseAccess(userId, courseId, shareId);
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Access denied", message: access.reason },
      { status: 403 }
    );
  }

  // === Determine Premium Status ===
  let isPremium = false;
  
  // 1. Check Shared/Enrolled Access First
  if (access.isShared || access.isEnrolled) {
    isPremium = access.fullAccess || (access.sharerTier && access.sharerTier !== "free");
    console.log(`[AI Tutor] Shared/Enrolled access: isPremium=${isPremium} (via ${access.isShared ? 'shareId' : 'enrollment'})`);
  } 
  // 2. Check Course Document
  else if (courseId && ObjectId.isValid(courseId)) {
    const courseDoc = await db.collection("library").findOne({ _id: new ObjectId(courseId) }) || 
                     await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
    
    if (courseDoc?.isPremium) {
      isPremium = true;
    }
  }

  // 3. Fallback to User Status (if not already determined by share)
  if (!isPremium && !access.isShared && userId) {
    isPremium = await getPremiumStatus(db, userId);
  }
  const wordCount = isPremium ? "2500–3000" : "1500–2000";

  // === Check Cache First ===
  if (courseId && ObjectId.isValid(courseId)) {
    const course = await db.collection("library").findOne(
      { _id: new ObjectId(courseId) },
      {
        projection: {
          [`modules.${mId - 1}.lessons.${lIdx}.content`]: 1,
        },
      }
    );

    const cachedContent =
      course?.modules?.[mId - 1]?.lessons?.[lIdx]?.content;

    if (
      cachedContent &&
      cachedContent.length > 500 &&
      !cachedContent.includes("coming soon")
    ) {
      console.log("Cache hit for lesson:", lessonTitle);
      return NextResponse.json({ content: cachedContent, cached: true });
    }
  }

  // === Generate New Content ===
  const promptBase = `Write an EXTREMELY DETAILED, high-quality academic educational lesson in Markdown. 
The lesson MUST be exhaustive, comprehensive, and very long (target 1500-2500 words).

Topic: ${courseTopic}
Module: ${moduleTitle || "Core Concepts"}
Lesson: ${lessonTitle}
Difficulty: ${difficulty}
Target length: ${wordCount} words (CRITICAL: Do not be concise. Dive extremely deep into every sub-topic).
Access tier: ${isPremium ? "Premium" : "Free"}

- Engaging and thorough introduction
- Clear, specific learning objectives
- In-depth step-by-step explanations with multiple examples
- Industry best practices and common pitfalls
- Detailed code examples (if relevant) with line-by-line explanations
- CRITICAL: DO NOT use Mermaid syntax, flowchart diagrams, or process flow diagrams of any kind. DO NOT output \`\`\`flow\`\`\` blocks.
- **Interactive Data Charts**: Use \`\`\`chart\`\`\` blocks ONLY for quantitative data (bar, line, pie, doughnut).
  CRITICAL: The \`\`\`chart\`\`\` block MUST start with \`\`\`chart and end with \`\`\` on its own line.
  CRITICAL: NEVER include the word "chart" outside the triple backticks if it's meant to be a visualization block.
  Example structure:
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
- 3-5 Practice exercises with solutions. Provide clear explanations for each solution.
- Comprehensive Key takeaways
- A specific "Further Reading" section with suggested topics
- CRITICAL for Math Equations: Use \\( ... \\) for INLINE math and \\[ ... \\] for BLOCK math. 
- MEGA IMPORTANT: NEVER wrap normal English sentences, standard text, or currencies (like $5.00) in math delimiters! If you wrap text in math delimiters, it ruins the formatting by removing all spaces (e.g. 5.00islikely). Only use them for actual standalone mathematical formulas.
- NEVER put math equations inside code blocks. NEVER use Markdown code backticks for math.
- CRITICAL: DO NOT use Mermaid syntax or flowchart diagrams of any kind.
- Use only the following visual block types:
  - \`\`\`chart\`\`\` for data visualizations (bar, line, pie, doughnut)
  - \`\`\`table\`\`\` for markdown tables
- High-level data visualizations (graphs) are encouraged; flow-based diagrams are forbidden.
- **Python Code**: If the lesson requires Python code for explanations (e.g., a data science lesson), you can provide code, but DO NOT use Python code to generate visualizations. Use the \`\`\`chart\`\`\` block instead.
- **Quantity constraint**: Include at least 3-5 high-quality charts using the \`\`\`chart\`\`\` block per lesson. Generous use of charts for visualizing any quantitative data, trends, or comparisons is strongly encouraged to make the course visually rich.
Use proper Markdown: ##, ###, **bold**, *italics*, \`\`\`code\`\`\`, > quotes, lists.
CRITICAL: DO NOT use tables or table formatting. Use lists or structured paragraphs instead.
IMPORTANT: Avoid being concise. Dive deep into every sub-topic.
SITUATIONAL VISUALS: Use \`\`\`chart\`\`\` blocks ONLY when strictly necessary for clarifying highly complex processes, comparing specific data points, or illustrating deep hierarchies. DO NOT use them for simple text or general concepts. Avoid generic titles like "Interactive Flow Diagram"; use short, formal descriptions (e.g., "Data Authentication Pipeline").`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an elite academic educator writing exhaustive, high-value lesson content in Markdown. You never skip details.",
      },
      { role: "user", content: promptBase },
    ],
    temperature: 0.75,
    max_tokens: isPremium ? 4000 : 3000,
  });

  let content = completion.choices[0]?.message?.content?.trim();
  content = postProcessContent(content);

  if (!content) {
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }

  // === Save to DB (if valid courseId) ===
  if (courseId && ObjectId.isValid(courseId)) {
    const updatePath = `modules.${mId - 1}.lessons.${lIdx}.content`;
    await db.collection("library").updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          [updatePath]: content,
          lastGenerated: new Date(),
        },
      }
    );
  }

  return NextResponse.json({
    success: true,
    content,
    cached: false,
    isPremium,
  });
}
