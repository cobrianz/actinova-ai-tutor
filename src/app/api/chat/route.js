import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  const { message, conversationHistory = [], topic } = body;

  // === Input Validation ===
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Topic is required for focused learning", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (!Array.isArray(conversationHistory)) {
    return NextResponse.json({ error: "Invalid conversation history", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // === Topic-Focused Tutor Prompt ===
  const systemPrompt = `You are an expert AI tutor helping a student learn **${topic}**.

Your role:
- Teach **${topic}** clearly, patiently, and with encouragement
- Use step-by-step explanations with examples and analogies
- Ask guiding questions to check understanding
- Use markdown: **bold**, *italics*, \`code\`, and lists
- Keep responses concise but complete (under 250 words)
- End with a follow-up question to keep the conversation going

If the student asks something only loosely related to ${topic}, gently steer back by answering briefly if helpful, then redirect to the topic.

Example good response for "What is JavaScript?":
"**JavaScript** is a programming language that powers interactive websites and web applications. It runs in your browser and on servers (via Node.js).

For example, when you click a button and a menu appears — that's JavaScript at work!

What aspect of JavaScript would you like to explore: variables, functions, or something else?"`;

  // === Message History (limit context window) ===
  const recentHistory = conversationHistory.slice(-8);

  const messages = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: message.trim() },
  ];

  // === Call OpenAI ===
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 500,
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();

  if (!aiResponse) {
    throw new Error("Empty response from OpenAI");
  }

  // === Final Safety Trim ===
  const words = aiResponse.split(/\s+/);
  const finalResponse =
    words.length > 250
      ? words.slice(0, 245).join(" ") + "...\n\nWhat would you like to explore next?"
      : aiResponse;

  // Increment API usage after successful response
  await trackAPIUsage(user._id, "ai-tutor-chat");

  return NextResponse.json({
    success: true,
    response: finalResponse,
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      total_tokens: completion.usage?.total_tokens,
    },
    timestamp: new Date().toISOString(),
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (handler) => withAPIRateLimit(handler, "ai-tutor-chat")
)(handlePost);
