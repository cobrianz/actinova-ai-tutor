// src/app/api/generate-report-outline/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DOCUMENT_PROFILES = {
    research_project: "Five chapters: Introduction, Literature Review, Methodology, Findings/Discussion, and Conclusion.",
    research_proposal: "Chapters 1–3 in future tense: Introduction, Literature Review, Methodology, then a work plan.",
    academic_essay: "A focused thesis, sequenced arguments with evidence, and a conclusion.",
    literature_review: "Theme-by-theme synthesis, comparison of scholars, debates, and explicit research gaps.",
    term_paper: "Course-relevant context followed by balanced explanation and critical analysis.",
    business_report: "Executive summary, findings, analysis, recommendations, implementation, and risks.",
    grant_proposal: "Need statement, SMART objectives, activities, evaluation, sustainability, and budget narrative.",
    case_study: "Situation, diagnosis, alternatives, recommendation, implementation, and risks.",
    business_plan: "Executive summary, market, operations, marketing, risks, and financial projections.",
    dissertation: "Extended original research: Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion with a clear scholarly contribution.",
    capstone_project: "Applied project: problem definition, research, solution design, implementation, evaluation, and reflection.",
    policy_brief: "Concise decision-maker format: issue, evidence, policy options, recommendation, implementation implications, and references.",
    white_paper: "Authoritative format: executive summary, problem, evidence, approach, benefits, limitations, and next steps.",
    feasibility_study: "Viability assessment covering market, technical, operational, legal, schedule, financial, and risk considerations.",
    lab_report: "Scientific format: Abstract, Introduction, Method, Results, Discussion, limitations, Conclusion, and references.",
    project_proposal: "Approval-ready plan: problem, objectives, scope, deliverables, timeline, resources/budget, risks, and monitoring.",
};

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const { topic, type, length, difficulty, citationStyle, academicLevel, criticalDepth, researchQuestion, requirements, institution, includeToc, includeFigures } = await request.json();

        if (!topic?.trim()) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const { canAccessDifficulty } = await import("@/lib/planLimits");

        if (difficulty && !canAccessDifficulty(user, difficulty)) {
            return NextResponse.json(
                { error: `Your current plan does not support ${difficulty} level reports. Please upgrade to Pro.` },
                { status: 403 }
            );
        }

        const systemPrompt = `🎯 ROLE
You are an academic writing engine specialized in producing high-quality, structured content for Actinova AI Tutor.

📐 TASK
Generate a comprehensive outline for a ${type} on the topic: "${topic}".

Rules:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Critical Depth: ${criticalDepth || "Moderate"}.
- Formatting / Citation Style: ${citationStyle || "APA 7"}.
- Institution/client requirements: ${institution || "Not specified"}.
- Research question or outcome: ${researchQuestion || "Not specified"}.
- Additional requirements: ${requirements || "None provided"}.
- Include table of contents: ${includeToc ? "Yes" : "No"}; plan useful tables/figures: ${includeFigures ? "Yes" : "No"}.
- Selected document profile: ${DOCUMENT_PROFILES[type] || "Formal structured document"}
- Tone: Formal, objective academic tone. Use disciplinary terminology correctly.
- Coherence: Ensure logical flow between sections.
- Structural Rules:
    - **No markdown**.
    - **No bullet symbols**.
    - **No numbering** in headings.
    - If the topic contains specific assignment questions or exam prompts, structure the outline to answer EACH question sequentially and thoroughly, producing a top-tier A-grade academic paper.
    - Include an "Abstract" section at the start.
    - Include "Introduction" and "Conclusion" sections.
    - For each section, provide a short heading and a detailed description of the sub-topics to be covered.
    - Include a "Cover" section at the start.
    - Specify the target word count per section to meet the overall length: ${length}.

🔒 OUTPUT FORMAT: JSON only.
{
  "title": "Main Title",
  "abstract": "Brief overview (approx 150-250 words)",
  "outline": [
    {
      "id": "01",
      "title": "Section Title",
      "heading": "Professional Academic Heading",
      "description": "Detailed sub-topics and arguments to be covered...",
      "isCover": true/false,
      "targetWords": 300
    },
    ...
  ]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }],
        });

        const outlineData = JSON.parse(completion.choices[0].message.content);

        const { db } = await connectToDatabase();

        const newReport = {
            userId: new ObjectId(userId),
            title: outlineData.title,
            topic,
            type,
            length,
            difficulty,
            citationStyle: citationStyle || "APA",
            academicLevel: academicLevel || "Undergraduate",
            criticalDepth: criticalDepth || "Moderate",
            researchQuestion: researchQuestion || "",
            requirements: requirements || "",
            institution: institution || "",
            includeToc: Boolean(includeToc),
            includeFigures: Boolean(includeFigures),
            outline: outlineData.outline,
            abstract: outlineData.abstract || "",
            sections: {}, // Will store generated content for each section
            fullContent: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("reports").insertOne(newReport);
        const reportId = result.insertedId.toString();

        // Track API Usage for Reports
        const { trackAPIUsage } = await import("@/lib/planMiddleware");
        await trackAPIUsage(user._id, "generate-report-outline", { itemType: "report_generation", creditCost: 25 });

        // ─── Generate full content for each section ───
        const reportSections = {};
        const allReferences = [];
        const contentParts = [];

        // Generate abstract content
        if (outlineData.abstract) {
            const abstractCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                temperature: 0.7,
                response_format: { type: "json_object" },
                messages: [{
                    role: "system",
                    content: `Generate an abstract for a ${type} titled "${outlineData.title}" on "${topic}".

Rules:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Citation Style: ${citationStyle || "APA 7"}.
- Tone: Formal, objective academic tone.
- No markdown, no bullets, no numbering.
- The abstract should be 150-250 words summarizing the key points.

OUTPUT FORMAT: JSON only.
{
  "paragraphs": ["Abstract paragraph text..."],
  "references": []
}`
                }],
            });
            const abstractData = JSON.parse(abstractCompletion.choices[0].message.content);
            reportSections.abstract = abstractData;
            contentParts.push(...abstractData.paragraphs || []);
        }

        // Generate content for each outline section
        for (const section of outlineData.outline) {
            if (section.isCover) {
                reportSections[section.id] = { heading: section.heading, paragraphs: [section.title], references: [] };
                contentParts.push(`<h2>${section.heading}</h2><p>${section.title}</p>`);
                continue;
            }

            const sectionPrompt = `🎯 ROLE
You are an academic writing engine specialized in producing high-quality, structured content.

📐 TASK
Write the "${section.heading}" section of a ${type} on the topic: "${topic}".

Section description: ${section.description}
Target word count: ${section.targetWords || 500} words.

Rules:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Critical Depth: ${criticalDepth || "Moderate"}.
- Citation Style: ${citationStyle || "APA 7"}.
- Tone: Formal, objective academic tone.
- No markdown, no bullets, no numbering.
- Each paragraph must be a coherent block of 3-6 sentences.
- Include REAL in-text citations from Google Scholar, PubMed, arXiv, or major academic publishers.
- DO NOT hallucinate titles, authors, or DOIs.
- Paraphrase conceptual explanations.

OUTPUT FORMAT: JSON only.
{
  "heading": "${section.heading}",
  "paragraphs": ["Paragraph text...", "Paragraph text..."],
  "references": ["Reference 1 (APA/MLA style string)", "Reference 2"]
}`;

            try {
                const sectionCompletion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    temperature: 0.7,
                    response_format: { type: "json_object" },
                    messages: [{ role: "system", content: sectionPrompt }],
                });
                const sectionData = JSON.parse(sectionCompletion.choices[0].message.content);

                // Quality refinement pass
                const refinementPrompt = `Review the following academic section for a ${type} report.
Topic: ${topic}
Heading: ${section.heading}

Tasks:
- Ensure NO markdown, NO bullets, and NO numbering.
- Improve logical flow and transitions between paragraphs.
- Strengthen academic tone and terminology accuracy.
- VERIFY that in-text citations are present and match the references list.
- Check that all references look like real academic citations.

Data:
${JSON.stringify(sectionData, null, 2)}

Return the refined JSON in the same structure:
{
  "heading": "${section.heading}",
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
                reportSections[section.id] = refinedData;

                if (refinedData.paragraphs) {
                    contentParts.push(`<h2>${refinedData.heading || section.heading}</h2>`);
                    for (const para of refinedData.paragraphs) {
                        contentParts.push(`<p>${para}</p>`);
                    }
                }
                if (refinedData.references) {
                    allReferences.push(...refinedData.references);
                }
            } catch (sectionError) {
                console.error(`Failed to generate section ${section.id}:`, sectionError);
                reportSections[section.id] = { heading: section.heading, paragraphs: [], references: [] };
            }
        }

        // Add references section
        if (allReferences.length > 0) {
            const uniqueRefs = [...new Set(allReferences)];
            contentParts.push(`<h2>References</h2>`);
            for (const ref of uniqueRefs) {
                contentParts.push(`<p>${ref}</p>`);
            }
        }

        // Update report with generated content
        await db.collection("reports").updateOne(
            { _id: new ObjectId(reportId) },
            {
                $set: {
                    sections: reportSections,
                    fullContent: contentParts.join("\n"),
                    abstract: outlineData.abstract || "",
                    references: allReferences,
                    updatedAt: new Date(),
                }
            }
        );

        return NextResponse.json({
            success: true,
            reportId,
            outline: outlineData.outline,
            fullContent: contentParts.join("\n"),
        });

    } catch (error) {
        console.error("Outline generation error:", error);
        return NextResponse.json({ error: "Failed to generate outline" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withAuth,
    (handler) => {
        const { withAPIRateLimit } = require("@/lib/planMiddleware");
        return withAPIRateLimit(handler, "generate-report-outline");
    }
)(handlePost);
