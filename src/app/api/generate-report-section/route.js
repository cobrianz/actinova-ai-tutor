import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withAPIRateLimit, trackAPIUsage, checkAPILimit } from "@/lib/planMiddleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

function buildSystemPrompt({ sectionTitle, sectionDescription, type, topic, difficulty, citationStyle, requestedPages, existingReferences, isCover }) {
    const humanLayer = `You are an experienced writer producing a section of a ${type} for a real person with a real deadline.
Write the way a sharp, slightly tired grad student or professional writes at 11pm when they actually know the material.
Rules: vary sentence length on purpose; ban "Furthermore," "Moreover," "In today's world," "It is important to note that"; use concrete nouns and real numbers; let some claims stay appropriately uncertain; include at least one place weighing a counterargument or limitation; no em-dash chains, no rule-of-three adjective stacking, no rhetorical questions as transitions; match register to audience; do not fabricate sources, statistics, or quotes.\n\n`;

    return humanLayer + `Write the "${sectionTitle}" section of a ${type} on: "${topic}".

Section description: ${sectionDescription}
Target word count: ~${(requestedPages || 1) * 275} words.

Configuration:
- Academic Level: ${difficulty}.
- Citation Style: ${citationStyle || "APA 7"}.

Formatting Rules:
- No markdown, no bullet symbols, no numbering in headings or paragraphs.
- Each paragraph must be separated by a blank line (3-6 coherent sentences each).
- Do not invent citations, statistics, quotes, authors, titles, or DOIs. If no verified user-supplied sources are available, write without citations.
- Existing references already used in this report (reuse exact strings if citing these sources):
  ${existingReferences && existingReferences.length > 0 ? existingReferences.map(r => `- ${r}`).join('\n  ') : 'None'}
- Do not use placeholder citations like "(Source, Year)".

${isCover ? "SPECIAL CASE: COVER PAGE — include title, author, institution, course, date.\n" : ""}Write the content directly as plain text. Separate each paragraph with a blank line. Do NOT use JSON format.`;
}

async function handleStreamingPost(request, userId) {
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

    const systemPrompt = buildSystemPrompt({ sectionTitle, sectionDescription, type, topic, difficulty, citationStyle, requestedPages, existingReferences, isCover });

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
                    data: { sectionId, sectionTitle, isCover },
                });

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    temperature: 0.7,
                    stream: true,
                    messages: [{ role: "system", content: systemPrompt }],
                });

                for await (const part of completion) {
                    const delta = part?.choices?.[0]?.delta?.content || "";
                    if (!delta) continue;
                    full += delta;
                    sseWrite(controller, encoder, { event: "chunk", data: { text: delta } });
                }

                // Extract references from the streamed content via a quick non-streaming call
                let references = [];
                try {
                    const refCompletion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        temperature: 0.2,
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: "system",
                                content: `Extract any academic references/citations from the following text. Return JSON: { "references": ["ref1", "ref2"] }. If no references found, return { "references": [] }. Only include real-looking academic citations (author, year, title patterns). Do not fabricate new ones.

Text:
${full}`
                            }
                        ],
                    });
                    const refData = JSON.parse(refCompletion.choices[0].message.content);
                    references = Array.isArray(refData.references) ? refData.references : [];
                } catch (_) {
                    references = [];
                }

                sseWrite(controller, encoder, {
                    event: "done",
                    data: { sectionId, references },
                });
                safeClose();
            } catch (err) {
                sseWrite(controller, encoder, { event: "error", data: { error: err?.message || "stream_failed" } });
                safeClose();
            }
        },
    });

    return new Response(stream, { headers: sseHeaders() });
}

async function handleNonStreamingPost(request, userId) {
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

    const systemPrompt = buildSystemPrompt({ sectionTitle, sectionDescription, type, topic, difficulty, citationStyle, requestedPages, existingReferences, isCover }) +
        `\n\nOUTPUT FORMAT: JSON only.
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

    await trackAPIUsage(userId, "generate-report-section", { itemType: "report_generation", creditCost: 25 });

    return NextResponse.json({
        success: true,
        data: refinedData
    });
}

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const body = await request.json();

        // Deduct credits before any generation
        const { db } = await connectToDatabase();
        const userDoc = await db.collection("users").findOne({ _id: typeof userId === "string" ? new ObjectId(userId) : userId });
        const creditCheck = await checkAPILimit(db, userDoc, "generate-report-section");
        if (!creditCheck.allowed) {
            return NextResponse.json({ error: "Insufficient credits", credits: creditCheck.credits, creditCost: creditCheck.creditCost }, { status: 429 });
        }

        if (body?.stream) {
            return await handleStreamingPost({ json: () => Promise.resolve(body) }, userId);
        }

        return await handleNonStreamingPost(request, userId);
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
