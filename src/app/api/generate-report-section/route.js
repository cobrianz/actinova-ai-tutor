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

        const systemPrompt = `🎯 ROLE
You are an academic writing engine. Your task is to write a specific section for a ${type} on the topic: "${topic}".

📐 SECTION DETAILS
- Title: ${sectionTitle}
- Description: ${sectionDescription}
- Academic Level: ${difficulty}
- Citation Style: ${citationStyle || "APA 7"}
- Target Word Count: Approximately ${(requestedPages || 1) * 275} words.

📜 RULES
- Writing Tone: Formal academic tone. Use appropriate disciplinary terminology.
- Formatting: 
    - **No markdown**.
    - **No bullet symbols**.
    - **No numbering** in headings or paragraphs.
    - Each paragraph must be a separate string in an array.
    - Do not include commentary outside JSON.
    - Citation Style: Follow ${citationStyle || "APA 7"} exactly. You MUST provide REAL, credible IN-TEXT CITATIONS (e.g. (Smith, 2023) or [1]) inside the paragraph text wherever claims are made.
    - These in-text citations MUST perfectly match the full bibliography entries provided in your 'references' array.
    - **Existing References**: Here are the references already used in this report:
      ${existingReferences && existingReferences.length > 0 ? existingReferences.map(r => `- ${r}`).join('\n      ') : 'None'}
    - If you need to cite a source already mentioned above, YOU MUST REUSE the exact reference string and the same in-text citation format.
    - **AUTHENTICITY**: You MUST cite REAL academic papers, books, or reputable news sources that actually exist. DO NOT hallucinate titles, autores, or DOIs. Use sources from Google Scholar, PubMed, arXiv, or major academic publishers.
    - Do not use placeholders like "(Source, Year)".
- Originality: Paraphrase conceptual explanations. Ensure content is original, but well-supported by the citations.
- Exam/Assignment Prompts: If this section is answering a specific exam or assignment question, ensure the answer is comprehensive, accurate, and written at an A-grade level.

${isCover ? `
📐 SPECIAL CASE: COVER PAGE
Since this is a ${sectionTitle}, the JSON must include:
- "title": Full academic title
- "author": Student name
- "institution": University name
- "course": Course code and name
- "date": Current date (Month Day, Year)
- "paragraphs": A list of items to show on the cover page for visual verification.
` : ''}

🔒 OUTPUT FORMAT: JSON only.
{
  "heading": "${sectionTitle}",
  "paragraphs": [
    "First paragraph text...",
    "Second paragraph text..."
  ],
  "references": [
    "Reference 1 (APA/MLA style string)",
    "Reference 2"
  ]
}
🚨 IMPORTANT: DO NOT include a "References" heading or list inside the paragraphs array. Use the "references" field only.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }],
        });

        const sectionData = JSON.parse(completion.choices[0].message.content);

        // Quality Control Refinement Pass
        const refinementPrompt = `Review the following academic section for a ${type} report.
Topic: ${topic}
Heading: ${sectionTitle}

Tasks:
- Ensure NO markdown, NO bullets, and NO numbering.
- Improve logical flow and transitions between paragraphs.
- Strengthen academic tone and terminology accuracy.
- Ensure formatting is exactly an array of paragraph strings.
- VERIFY that in-text citations are present inside the paragraph strings and match the references list.
- **CRITICAL**: Check that all references in the 'references' array look like real academic citations. If they look hallucinated or generic, rewrite them to be authentic and verifiable.
- Ensure that if an existing reference was provided, it was used correctly.

Data:
${JSON.stringify(sectionData, null, 2)}

Existing References for Continuity:
${existingReferences && existingReferences.length > 0 ? JSON.stringify(existingReferences) : 'None'}

Return the refined JSON in the same structure:
{
  "heading": "${sectionTitle}",
  "paragraphs": ["Refined paragraph 1", "..."],
  "references": ["Ref 1", "Ref 2"]
}
`;

        const refinement = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: refinementPrompt }],
        });

        const refinedData = JSON.parse(refinement.choices[0].message.content);

        // Track usage AFTER successful generation (per-section, shared reportGenerations limit)
        await trackAPIUsage(userId, "generate-report-section");

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

