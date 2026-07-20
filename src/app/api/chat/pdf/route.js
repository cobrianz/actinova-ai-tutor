import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage, checkAPILimit } from "@/lib/planMiddleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import PdfDocument from "@/models/PdfDocument";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Builds the system prompt using per-page text so the AI can cite page numbers.
 *
 * Each page is labelled [Page N] in the prompt. The AI is instructed to always
 * include the source page reference in its answer.
 *
 * @param {Array<{page: number, text: string}>} pages
 * @param {boolean} truncated  - true if pages were capped before being passed in
 */
function buildSystemPrompt(pages, truncated) {
  const pageBlocks = pages
    .filter((p) => p.text?.trim())
    .map((p) => `[Page ${p.page}]\n${p.text.trim()}`)
    .join("\n\n");

  return `You are an expert AI tutor. A student has uploaded a PDF document and is asking you questions about it.

## Your Role
- You are a knowledgeable, patient, and encouraging tutor.
- Your goal is to help the student understand the document deeply — not just surface-level answers.
- Break down complex concepts into simpler terms when appropriate.
- Use analogies or examples drawn from the document itself when helpful.

## Core Rules
1. **STRICTLY grounded in the document.** You may ONLY use information found in the document below. Never invent, assume, or bring in outside knowledge.
2. **ALWAYS cite your sources.** Every factual claim MUST include a page reference in this exact format: *(Source: Page N)* or *(Source: Pages N, M, ...)*. Place citations immediately after the relevant statement.
3. **If the answer is not in the document**, respond exactly: "I couldn't find that in the document." You may then suggest what section might be relevant if the student rephrases.
4. **When summarising**, cover all key points and note which pages they come from.
5. **When comparing or contrasting**, use a structured format (bullet points or a brief table).
6. **For definitions**, provide the term, its definition from the document, and the page number.
7. **For "explain" or "how does X work" questions**, walk through the concept step by step, referencing the relevant pages.

## Formatting
- Use **bold** for key terms and definitions.
- Use *italics* for emphasis or document-specific terminology.
- Use \`inline code\` for technical terms, variables, or formulas.
- Use bullet lists for multiple points; numbered lists for sequential steps.
- Keep answers concise but complete — aim for clarity over length.
- Do NOT use headings (##) or horizontal rules in your response.

## Conversation Context
- You have access to the full conversation history. Reference earlier parts of the conversation when relevant.
- If the student asks a follow-up, connect it to what was previously discussed.
- If the student's question is ambiguous, ask for clarification rather than guessing.

## When the Document is Truncated
The student's document may have been truncated for context. If you suspect important information is missing, say so: "Note: this answer is based on the available portion of the document. The full document may contain additional relevant information on pages beyond what was provided."${truncated ? "\n\nIMPORTANT: The document WAS truncated. Only the first portion was provided. If a question likely requires information from later pages, mention this limitation." : ""}

--- DOCUMENT CONTENT START ---
${pageBlocks}
--- DOCUMENT CONTENT END ---`;
}

/**
 * Extract cited page numbers from an AI response string.
 * Looks for patterns like: (Source: Page 3), (Source: Pages 2, 5), Page 4, etc.
 */
function extractCitedPages(text) {
  const cited = new Set();
  // Match "(Source: Page N)" or "(Source: Pages N, M)"
  const sourcePattern = /\(Source:\s*Pages?\s*([\d,\s]+)\)/gi;
  let m;
  while ((m = sourcePattern.exec(text)) !== null) {
    m[1].split(",").forEach((n) => {
      const num = parseInt(n.trim(), 10);
      if (!isNaN(num)) cited.add(num);
    });
  }
  // Also match bare "[Page N]" references
  const pagePattern = /\[Page\s+(\d+)\]/gi;
  while ((m = pagePattern.exec(text)) !== null) {
    cited.add(parseInt(m[1], 10));
  }
  return Array.from(cited).sort((a, b) => a - b);
}

/**
 * POST /api/chat/pdf
 *
 * Accepts either:
 *   { documentId, message, conversationHistory }   ← preferred (uses stored pages)
 *   { extractedText, message, conversationHistory } ← legacy fallback
 */
async function handlePost(request) {
  await connectToDatabase();
  const user = request.user;
  const body = await request.json();
  const { message, conversationHistory, documentId, extractedText } = body;

  // === Input Validation ===
  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }
  if (!Array.isArray(conversationHistory)) {
    return NextResponse.json(
      { error: "Invalid conversation history", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }
  if (!documentId && !extractedText) {
    return NextResponse.json(
      { error: "documentId or extractedText is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // === Credit check ===
  const { db } = await connectToDatabase();
  const userId = user._id;
  const userDoc = await db
    .collection("users")
    .findOne({ _id: typeof userId === "string" ? new ObjectId(userId) : userId });
  const creditCheck = await checkAPILimit(db, userDoc, "pdf_chat");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        message: `You need ${creditCheck.creditCost} credits to send a PDF chat message. You have ${creditCheck.credits} credits.`,
        credits: creditCheck.credits,
        creditCost: creditCheck.creditCost,
        code: "INSUFFICIENT_CREDITS",
      },
      { status: 429 }
    );
  }

  // === Resolve pages ===
  let pages = [];
  let truncated = false;

  if (documentId) {
    const doc = await PdfDocument.findOne({
      _id: documentId,
      userId: user._id,
    })
      .select("pages totalPages")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    pages = doc.pages || [];

    // Cap total prompt size: include pages until we reach ~12 000 chars of text
    let charCount = 0;
    const cappedPages = [];
    for (const p of pages) {
      if (charCount + (p.text?.length || 0) > 12000) {
        truncated = true;
        break;
      }
      cappedPages.push(p);
      charCount += p.text?.length || 0;
    }
    pages = cappedPages;
  } else {
    // Legacy: split raw text into synthetic pages by the "--- Page N ---" markers
    const rawText = (extractedText || "").slice(0, 12000);
    truncated = (extractedText || "").length > 12000;
    const pageChunks = rawText.split(/\n\n---\s*Page\s+(\d+)\s*---\n\n/);

    if (pageChunks.length > 1) {
      // Odd indices are page numbers, even indices (>0) are page texts
      for (let i = 1; i < pageChunks.length; i += 2) {
        const pageNum = parseInt(pageChunks[i], 10);
        const text = pageChunks[i + 1] || "";
        if (!isNaN(pageNum) && text.trim()) {
          pages.push({ page: pageNum, text });
        }
      }
    } else {
      // No markers — treat entire text as page 1
      pages = [{ page: 1, text: rawText }];
    }
  }

  if (pages.length === 0) {
    return NextResponse.json(
      { error: "No text content found in document", code: "EMPTY_DOCUMENT" },
      { status: 400 }
    );
  }

  // === Cap conversation history at last 10 turns ===
  const recentHistory = (conversationHistory || []).slice(-10);

  // === Call OpenAI ===
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1000,
    presence_penalty: 0.2,
    frequency_penalty: 0.2,
    messages: [
      { role: "system", content: buildSystemPrompt(pages, truncated) },
      ...recentHistory,
      { role: "user", content: message.trim() },
    ],
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();
  if (!aiResponse) throw new Error("Empty response from OpenAI");

  // === Extract cited pages from AI response ===
  const citedPages = extractCitedPages(aiResponse);

  // === Track usage ===
  await trackAPIUsage(user._id, "pdf-chat");

  return NextResponse.json({
    success: true,
    response: aiResponse,
    citedPages,
    timestamp: new Date().toISOString(),
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      total_tokens: completion.usage?.total_tokens,
    },
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (handler) => withAPIRateLimit(handler, "pdf-chat")
)(handlePost);
