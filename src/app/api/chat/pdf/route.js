import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage, checkAPILimit } from "@/lib/planMiddleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Builds the system prompt for the PDF-grounded AI tutor.
 * Truncates extractedText to 12 000 chars server-side and appends a
 * truncation notice when the original exceeded that limit.
 *
 * @param {string} extractedText
 * @returns {string}
 */
function buildSystemPrompt(extractedText) {
  const truncated = extractedText.length >= 12000;
  const safeText  = truncated ? extractedText.slice(0, 12000) : extractedText;

  return `You are an expert AI tutor helping a student understand a PDF document they have uploaded.

Your ONLY knowledge source for answering questions is the document content provided below.

Rules:
- Answer questions using ONLY the information in the document.
- If the answer cannot be found in the document, respond exactly: "I couldn't find that in the document."
- Use markdown: **bold**, *italics*, \`code\`, and bullet lists.
- Keep answers concise but complete.
- Do not reference outside knowledge or make up information.${truncated ? "\n\nNote: [Document truncated for context] — only the first portion of the document is available." : ""}

--- DOCUMENT CONTENT START ---
${safeText}
--- DOCUMENT CONTENT END ---`;
}

/**
 * POST /api/chat/pdf
 *
 * Validates the incoming request and calls OpenAI (requirements 5.1, 5.2, 6.1).
 */
async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  const { message, conversationHistory, extractedText } = body;

  // === Input Validation ===

  // message: required, non-empty after trim (req 5.1)
  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // conversationHistory: must be an array (req 5.1)
  if (!Array.isArray(conversationHistory)) {
    return NextResponse.json(
      { error: "Invalid conversation history", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // extractedText: required, non-empty string (req 5.1, 6.1)
  if (!extractedText || typeof extractedText !== "string" || !extractedText.trim()) {
    return NextResponse.json(
      { error: "Extracted text is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // === Server-side safety re-truncation (req 6.1) ===
  // Guard against client-side bypass — always cap at 12 000 chars server-side.
  const safeTruncatedText = (extractedText || "").slice(0, 12000);

  // === Cap conversation history at last 6 turns (req 5.1) ===
  const recentHistory = (conversationHistory || []).slice(-6);

  // === Credit check ===
  const { db } = await connectToDatabase();
  const userId = user._id;
  const userDoc = await db.collection("users").findOne({ _id: typeof userId === "string" ? new ObjectId(userId) : userId });
  const creditCheck = await checkAPILimit(db, userDoc, "course_generation");
  if (!creditCheck.allowed) {
    return NextResponse.json({ error: "Insufficient credits", credits: creditCheck.credits, creditCost: creditCheck.creditCost }, { status: 429 });
  }

  // === Call OpenAI (req 5.2) ===
  const completion = await openai.chat.completions.create({
    model:             "gpt-4o-mini",
    temperature:       0.7,
    max_tokens:        600,
    presence_penalty:  0.2,
    frequency_penalty: 0.2,
    messages: [
      { role: "system",  content: buildSystemPrompt(safeTruncatedText) },
      ...recentHistory,
      { role: "user",    content: message.trim() }
    ]
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();
  if (!aiResponse) {
    throw new Error("Empty response from OpenAI");
  }

  // === Track usage (req 6.1) ===
  await trackAPIUsage(user._id, "pdf-chat");

  return NextResponse.json({
    success:   true,
    response:  aiResponse,
    timestamp: new Date().toISOString(),
    usage: {
      prompt_tokens:     completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      total_tokens:      completion.usage?.total_tokens,
    }
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (handler) => withAPIRateLimit(handler, "pdf-chat")
)(handlePost);
