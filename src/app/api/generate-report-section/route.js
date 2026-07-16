import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const {
            reportId,
            sectionId,
            sectionTitle,
            sectionDescription,
            topic,
            type,
            difficulty,
            citationStyle,
            requestedPages,
            existingContent,
            existingReferences
        } = await request.json();

        if (!reportId || !sectionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const isCover = sectionTitle.toLowerCase().includes('cover') || sectionTitle.toLowerCase().includes('title');

        // Humanization layer (same as outline route)
        const humanLayer = `You are an experienced writer producing a section of a ${type} for a real person with a real deadline.
Write the way a sharp, slightly tired grad student or professional writes at 11pm when they actually know the material.
Rules: vary sentence length on purpose; ban "Furthermore," "Moreover," "In today's world," "It is important to note that"; use concrete nouns and real numbers; let some claims stay appropriately uncertain; include at least one place weighing a counterargument or limitation; no em-dash chains, no rule-of-three adjective stacking, no rhetorical questions as transitions; match register to audience; do not fabricate sources, statistics, or quotes.\n\n`;

        const systemPrompt = humanLayer + `Write the "${sectionTitle}" section of a ${type} on: "${topic}".

Section description: ${sectionDescription}
Target word count: ~${(requestedPages || 1) * 275} words.

Configuration:
- Academic Level: ${difficulty}.
- Citation Style: ${citationStyle || "APA 7"}.

Formatting Rules:
- No markdown, no bullet symbols, no numbering in headings or paragraphs.
- Each paragraph must be a separate string in the array (3-6 coherent sentences).
- Do not invent citations, statistics, quotes, authors, titles, or DOIs. If no verified user-supplied sources are available, write without citations and return an empty references array.
- Existing references already used in this report (reuse exact strings if citing these sources):
  ${existingReferences && existingReferences.length > 0 ? existingReferences.map(r => `- ${r}`).join('\n  ') : 'None'}
- Do not use placeholder citations like "(Source, Year)".

${isCover ? "SPECIAL CASE: COVER PAGE — JSON must include title, author, institution, course, date, and paragraphs listing items on the cover.\n" : ""}OUTPUT FORMAT: JSON only.
{
  "heading": "${sectionTitle}",
  "paragraphs": ["First paragraph text...", "Second paragraph text..."],
  "references": ["Reference 1 (${citationStyle || "APA"} style)", "Reference 2"]
}
DO NOT include a References heading inside the paragraphs array.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }],
        });

        const sectionData = JSON.parse(completion.choices[0].message.content);

        // Quality Control Refinement Pass
        const refinementPrompt = `Review the following academic section for a ${type} report.
Topic: ${topic} | Heading: ${sectionTitle}

Tasks:
- Ensure NO markdown, NO bullets, NO numbering.
- Improve logical flow and transitions between paragraphs.
- Strengthen academic tone — remove any "Furthermore," "Moreover," "In today's world," or rhetorical-question transitions.
- Vary sentence length: break up any sequences of similarly-lengthed sentences.
- Ensure in-text citations are present inside paragraphs and match the references list.
- Check all references look like real academic citations — rewrite any that look hallucinated.
- If an existing reference was provided, ensure it was reused correctly.

Data:
${JSON.stringify(sectionData, null, 2)}

Existing References for Continuity:
${existingReferences && existingReferences.length > 0 ? JSON.stringify(existingReferences) : 'None'}

Return refined JSON in the same structure:
{
  "heading": "${sectionTitle}",
  "paragraphs": ["Refined paragraph 1", "..."],
  "references": ["Ref 1", "Ref 2"]
}`;

        const refinement = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: refinementPrompt }],
        });

        const refinedData = JSON.parse(refinement.choices[0].message.content);

        // Track usage AFTER successful generation (per-section, shared reportGenerations limit)
        await trackAPIUsage(userId, "generate-report-section", { itemType: "report_generation", creditCost: 25 });

        return NextResponse.json({
            success: true,
            data: refinedData
        });

    } catch (error) {
        console.error("Section generation error:", error);
        return NextResponse.json({ error: "Failed to generate section" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withAuth,
    (handler) => withAPIRateLimit(handler, "generate-report-section")
)(handlePost);

