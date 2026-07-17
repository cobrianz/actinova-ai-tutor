import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handlePost(request) {
  const { task, name, subject, content, classroomName, assignmentTitle } = await request.json();

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
      systemPrompt = "You are an academic assessment expert. Generate a grading rubric as a JSON array of objects, each with fields: criterion (string), description (string), maxPoints (number). Create 4-6 criteria covering different aspects. Return ONLY the JSON array, no other text.";
      userPrompt = `Create a grading rubric for: "${assignmentTitle}" in the course "${classroomName}". Max total points: 100.`;
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
      userPrompt = `Generate a syllabus for "${name}" course. ${subject ? `Subject: ${subject}` : ""} ${content ? `Additional details: ${content}` : ""}`;
      break;

    default:
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: task === "rubric" ? 1000 : 2000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const result = completion.choices[0]?.message?.content?.trim();

  if (task === "rubric") {
    try {
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const rubric = JSON.parse(cleaned);
      return NextResponse.json({ result: rubric });
    } catch {
      return NextResponse.json({ result: [{ criterion: "Content Quality", description: "Accuracy and depth of content", maxPoints: 25 }, { criterion: "Organization", description: "Structure and flow", maxPoints: 20 }, { criterion: "Analysis", description: "Critical thinking and analysis", maxPoints: 25 }, { criterion: "Writing", description: "Grammar, clarity, and style", maxPoints: 15 }, { criterion: "References", description: "Proper citations and sources", maxPoints: 15 }] });
    }
  }

  return NextResponse.json({ result });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth, handlePost);
