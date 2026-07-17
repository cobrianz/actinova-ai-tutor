import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
  const { name, subject } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Classroom name is required" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that writes concise classroom descriptions. Write a 2-3 sentence description for a classroom based on the name and optional subject. Be professional and informative. Do not use quotes or markdown.",
      },
      {
        role: "user",
        content: `Classroom: "${name}"${subject ? `\nSubject: "${subject}"` : ""}\n\nWrite a brief classroom description.`,
      },
    ],
  });

  const description = completion.choices[0]?.message?.content?.trim();
  return NextResponse.json({ description });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
