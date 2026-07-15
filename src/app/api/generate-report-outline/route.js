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
    research_project:      "Five chapters: Introduction, Literature Review, Methodology, Findings/Discussion, and Conclusion.",
    research_proposal:     "Chapters 1–3 in future tense: Introduction, Literature Review, Methodology, then a work plan.",
    academic_essay:        "A focused thesis, sequenced arguments with evidence, and a conclusion.",
    literature_review:     "Theme-by-theme synthesis, comparison of scholars, debates, and explicit research gaps.",
    term_paper:            "Course-relevant context followed by balanced explanation and critical analysis.",
    business_report:       "Executive summary, findings, analysis, recommendations, implementation, and risks.",
    grant_proposal:        "Need statement, SMART objectives, activities, evaluation, sustainability, and budget narrative.",
    case_study:            "Situation, diagnosis, alternatives, recommendation, implementation, and risks.",
    business_plan:         "Executive summary, market, operations, marketing, risks, and financial projections.",
    dissertation:          "Extended original research: Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion with a clear scholarly contribution.",
    capstone_project:      "Applied project: problem definition, research, solution design, implementation, evaluation, and reflection.",
    policy_brief:          "Concise decision-maker format: issue, evidence, policy options, recommendation, implementation implications, and references.",
    white_paper:           "Authoritative format: executive summary, problem, evidence, approach, benefits, limitations, and next steps.",
    feasibility_study:     "Viability assessment covering market, technical, operational, legal, schedule, financial, and risk considerations.",
    lab_report:            "Scientific format: Abstract, Introduction, Method, Results, Discussion, limitations, Conclusion, and references.",
    project_proposal:      "Approval-ready plan: problem, objectives, scope, deliverables, timeline, resources/budget, risks, and monitoring.",
    annotated_bibliography:"Source-by-source citations each with a critical summary, methodology evaluation, and relevance note tied to the user's project.",
    reflective_journal:    "First-person critical reflection: context, description (brief), critical reflection, theory connection, growth identified, and forward-looking conclusion.",
};

// Humanization layer — prepended to every document-specific prompt
function humanizationLayer(docType, pageRange, wordRange) {
    return `You are an experienced writer producing a ${docType} for a real person with a real deadline.
Write the way a sharp, slightly tired grad student or professional writes at 11pm when they actually know the material — not the way a marketing brochure writes.

Rules:
- Vary sentence length on purpose. Follow a long, clause-heavy sentence with a short one.
- Do not open paragraphs with "Furthermore," "Moreover," "In today's world," or "It is important to note that." Ban these outright.
- Use concrete nouns and real numbers over vague intensifiers. "Revenue fell 12% in Q3" beats "revenue declined significantly."
- Let some claims stay appropriately uncertain ("the data suggests," "this may indicate") rather than forcing false confidence.
- Include at least one place where the writer weighs a counterargument or limitation before moving on.
- No em-dash chains, no rule-of-three adjective stacking ("innovative, dynamic, and transformative"), no rhetorical questions used as transitions.
- Match register to audience: academic sections read like academic writing; executive sections read like something a busy VP would actually finish reading.
- Cite/reference claims that need it; do not fabricate sources, statistics, or quotes. If the user supplied sources, use only those.
- Length target: ${pageRange} pages (~${wordRange} words).

`;
}

// Document-specific writing instructions per type
function docTypePrompt(type, topic, level, field) {
    const t = type?.toLowerCase();
    if (t === "research_project") return `Write a five-chapter Research Project on ${topic} for a ${level} student${field ? " in " + field : ""}.
Chapter 1 – Introduction: real-world hook, 2-3 sentence problem statement, 3-5 specific objectives and matching research questions, significance to field and practice, scope and limitations honestly stated.
Chapter 2 – Literature Review: organize by theme not by source. Build toward a clearly named gap. Include a short theoretical/conceptual framework.
Chapter 3 – Methodology: justify the design choice, describe sample/population and selection, name instruments and validity/reliability handling, describe analysis procedure step by step.
Chapter 4 – Findings: present results objective-by-objective, use descriptive language around tables rather than restating numbers as prose.
Chapter 5 – Discussion & Conclusion: interpret findings against the literature (agree, disagree, extend), state 2-4 concrete limitations, give recommendations a practitioner could act on, close by answering the original research questions directly.
End each chapter with one sentence that hands off to the next.`;

    if (t === "research_proposal") return `Write a Research Proposal on ${topic}. Everything describing the study itself must be in future or conditional tense — never past tense. Flag any sentence that drifts into "the study found" or similar.
Open with why this problem matters right now, narrow to a specific answerable research question or hypothesis, justify against 6-10 pieces of existing literature framed as "here's what's known — here's what isn't."
Methodology: specific enough that someone else could execute it — name the design, describe recruitment/sampling with real numbers or ranges, name instruments, state the planned analysis technique.
Include a realistic timeline and a short ethics section addressing consent, risk, and data handling.
Tone: persuasive but not oversold — hedge appropriately on scope.`;

    if (t === "academic_essay") return `Write an Academic Essay arguing a specific thesis on ${topic}. State the thesis in one clear sentence by the end of the introduction.
Each body paragraph does exactly one job: state a claim, back it with evidence, analyze what the evidence actually shows, tie it back to the thesis in the closing sentence. Vary how paragraphs open.
Include one paragraph that takes the strongest counterargument seriously before explaining why the thesis still holds — a real concession, not a straw man.
Conclusion: say what changes if the thesis is true — a stake, an implication, or a next question.`;

    if (t === "literature_review") return `Write a Literature Review on ${topic}, organized by theme, never by source-by-source summary. For each theme, put sources in conversation: "X argues A, while Y's later data complicates this by showing B."
Explicitly name at least one live debate or contradiction. Do not let any single source dominate a paragraph — synthesize at least 2-3 sources per major point.
State inclusion/exclusion logic briefly up front. End with a clearly stated gap worded so it could justify the next research project.
Avoid summarizing abstracts. The reader should understand the shape of a scholarly conversation.`;

    if (t === "term_paper") return `Write a Term Paper on ${topic}. Open with a framing question or angle, not just a topic announcement.
Spend roughly a third on background — tight and purposeful, not encyclopedic. Spend the rest applying specific concepts, theories, or frameworks, showing judgment (what works, what doesn't, where the theory strains) rather than just reporting facts.
Write like a strong student who did the reading and has an actual opinion, supported but not overhedged.`;

    if (t === "business_report") return `Write a Business Report on ${topic}.
Executive Summary must work standalone: situation, key finding, and recommendation in under a page — no "as this report will show."
Findings: organize around the actual business questions, not a generic template. Support each finding with a number, comparison, or specific observation.
Recommendations: specific and actionable — who does what, by when, at roughly what cost.
Register: direct, no padding, headers that let a skimmer find what they need.`;

    if (t === "grant_proposal") return `Write a Grant Proposal for ${topic}.
Statement of Need: concrete and specific — real scale (numbers, trends) plus a human-scale detail.
Objectives must be genuinely SMART. Write each as "By [date], [measurable change] will be achieved."
Budget Narrative: justify each major cost line tied to an objective.
Evaluation: name what will be measured, how, and against what baseline.
Tone: confident and specific, but never oversell impact that can't be credibly delivered.`;

    if (t === "case_study") return `Write a Case Study analyzing ${topic}. Diagnose the underlying problem, not just the symptoms — distinguish "what happened" from "why it actually happened."
Present 2-4 genuinely distinct options, each with a fair account of upside, cost, and risk. Do not stack the deck so one option is a straw man.
Recommendation: pick one option, justify against the others directly, include a short implementation outline.
Write like a consultant who has to defend this recommendation out loud in the room.`;

    if (t === "business_plan") return `Write a Business Plan for ${topic}.
Market Analysis: use real category dynamics and a credible bottoms-up estimate — not a single unsupported "$X billion market" number.
Financial Plan: conservative-leaning projections, internally consistent, key assumptions stated explicitly.
Funding Request: amount, specific use of funds by category, and the milestone the funding is meant to reach.
Tone: confident, specific, numbers-literate — no startup-pitch inflation language.`;

    if (t === "dissertation") return `Write a Dissertation-level treatment of ${topic}${field ? " in " + field : ""}. Name the original contribution to knowledge explicitly in the introduction and return to it in the conclusion.
Literature Review: build the theoretical lens the study uses — position the study within, and slightly against, existing frameworks.
Methodology: defensible under committee scrutiny — justify design against alternatives, address validity/reliability explicitly, acknowledge limitations honestly.
Discussion: engage seriously with disconfirming or inconvenient findings.
Register: formal academic prose, precise terminology — but avoid empty hedge-stacking.`;

    if (t === "capstone_project") return `Write a Capstone Project document for ${topic}. Show a clear line from problem, to research/design rationale, to a concrete built output, to evaluation.
Design/Development: justify choices made (why this approach over alternatives).
Evaluation: state success criteria and assess the outcome against them honestly, including where results fell short.
Reflection: what would be done differently, what was learned that wasn't anticipated — not generic "valuable learning experience" language.`;

    if (t === "policy_brief") return `Write a Policy Brief on ${topic}. Must be readable in under 10 minutes — cut anything that doesn't change the decision.
Open with the issue in one tight paragraph: what's wrong, who's affected, why it matters now.
Present 2-3 real policy options with honest trade-offs (cost, political feasibility, speed, side effects).
State a clear recommendation and justify it against the trade-offs just laid out.
Use short paragraphs, plain language — assume a smart non-specialist who is busy.`;

    if (t === "white_paper") return `Write a White Paper on ${topic}.
Establish the problem with real stakes and evidence before mentioning any solution.
Analysis: give existing approaches a fair, specific critique before showing where they fall short.
Proposed approach: explain the mechanism of why it works, not just that it works.
Tone: authoritative but not salesy — persuade through analysis quality, not enthusiasm.`;

    if (t === "feasibility_study") return `Write a Feasibility Study for ${topic}. Assess each dimension — market, technical, operational, legal, financial — independently and honestly. A feasibility study that concludes everything is fine on every dimension reads as unreliable.
For each dimension: state the specific question being tested, the evidence/analysis used, and a clear verdict (feasible / feasible with conditions / not feasible).
If any dimension raises a real risk, say so plainly and carry that into the overall recommendation.
Overall Assessment must synthesize all dimensions into one clear go/no-go/go-with-conditions recommendation.`;

    if (t === "lab_report") return `Write a Laboratory Report for ${topic}. Follow standard scientific reporting convention: methods in past tense, results reported neutrally before interpretation.
Methods: precise enough that someone could replicate — specific quantities, equipment, and conditions.
Results: report what was observed/measured without interpreting yet.
Discussion: explicitly address sources of error and their likely effect on results (not a token "human error may have occurred" line). State whether the hypothesis was supported, partially supported, or not supported — directly.
Conclusion: one tight paragraph tying result back to the hypothesis and its broader significance.`;

    if (t === "project_proposal") return `Write a Project Proposal for ${topic}.
Scope: state deliverables specifically enough to prevent scope creep — "a functioning prototype tested against 3 defined criteria," not "an improved system."
Timeline: real phases/milestones with rough durations, not a single end date.
Risk Assessment: 2-4 real risks (not generic "risk of delay") with a brief mitigation for each.
Close with a direct, specific ask — what exactly is being requested and what happens if approved vs. delayed.`;

    if (t === "annotated_bibliography") return `Write an Annotated Bibliography on ${topic}.
Open with a short paragraph stating the scope and why these sources were selected — what counts and what was deliberately left out.
For each source write one self-contained entry with: the full citation, a summary stating the source's actual argument or findings (not vague "this article discusses X"), a brief evaluation of methodology/credibility/bias, and a relevance note saying explicitly how this source will be used tied to the actual project.
Do NOT synthesize sources against each other. Each entry is self-contained.
If real sources were not supplied, do not invent citations, authors, or findings — flag that sources are needed.`;

    if (t === "reflective_journal") return `Write a Reflective Journal on ${topic} in first person.
Keep the "what happened" description short — spend most of the space on what the experience meant: what was felt in the moment, what assumption got challenged, what surprised them.
Include at least one moment of real difficulty, doubt, or mistake and reflect on it honestly — genuine reflective writing sits with discomfort instead of resolving it too quickly.
Where relevant, connect the experience to specific prior learning, theory, or professional standards — but don't force an academic citation into a personal reflection where it doesn't belong.
End by naming a specific, concrete change in thinking or behavior going forward — not a vague "I learned a lot" close.
Voice: personal, reflective, first-person throughout — contractions and a genuinely searching tone are appropriate here.`;

    return `Write a formal structured ${type} on ${topic} using the appropriate academic or professional conventions for this document type.`;
}

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

        const pageRange = length === "short" ? "3–5" : length === "long" ? "11–15" : "6–10";
        const wordRange = length === "short" ? "1,500–2,500" : length === "long" ? "5,500–7,500" : "3,000–5,000";

        const systemPrompt = [
            humanizationLayer(type, pageRange, wordRange),
            docTypePrompt(type, topic, academicLevel, ""),
            `---
Generate a comprehensive outline for the above ${type} on: "${topic}".

Configuration:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Critical Depth: ${criticalDepth || "Moderate"}.
- Citation Style: ${citationStyle || "APA 7"}.
- Institution: ${institution || "Not specified"}.
- Research question / outcome: ${researchQuestion || "Not specified"}.
- Additional requirements: ${requirements || "None"}.
- Table of contents: ${includeToc ? "Yes" : "No"}; plan tables/figures: ${includeFigures ? "Yes" : "No"}.
- Document profile: ${DOCUMENT_PROFILES[type] || "Formal structured document"}

Structural Rules:
- No markdown, no bullet symbols, no numbering in headings.
- If the topic contains specific assignment questions, structure the outline to answer EACH question sequentially.
- Include a "Cover" section and an "Abstract" section at the start.
- Include "Introduction" and "Conclusion" sections.
- For each section provide a short heading and a detailed description of sub-topics to cover.
- Specify the target word count per section to meet the overall length: ${length}.

OUTPUT FORMAT: JSON only.
{
  "title": "Main Title",
  "abstract": "Brief overview (approx 150-250 words)",
  "outline": [
    {
      "id": "01",
      "title": "Section Title",
      "heading": "Professional Academic Heading",
      "description": "Detailed sub-topics and arguments to be covered...",
      "isCover": true,
      "targetWords": 300
    }
  ]
}`,
        ].join("\n");

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

            const sectionPrompt = [
                humanizationLayer(type, pageRange, wordRange),
                `Write the "${section.heading}" section of a ${type} on: "${topic}".

Section description: ${section.description}
Target word count: ~${section.targetWords || 500} words.

Configuration:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Critical Depth: ${criticalDepth || "Moderate"}.
- Citation Style: ${citationStyle || "APA 7"}.

Rules: No markdown, no bullets, no numbering. Each paragraph must be a coherent block of 3-6 sentences. Include REAL in-text citations from Google Scholar, PubMed, arXiv, or major publishers. DO NOT hallucinate titles, authors, or DOIs.

OUTPUT FORMAT: JSON only.
{
  "heading": "${section.heading}",
  "paragraphs": ["Paragraph text...", "Paragraph text..."],
  "references": ["Reference 1 (APA/MLA style string)", "Reference 2"]
}`,
            ].join("\n");

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
Topic: ${topic} | Heading: ${section.heading}

Tasks:
- Ensure NO markdown, NO bullets, NO numbering.
- Improve logical flow; remove "Furthermore," "Moreover," "In today's world," and rhetorical-question transitions.
- Vary sentence length — break up any sequences of similarly-lengthed sentences.
- Verify in-text citations are present and match the references list.
- Rewrite any references that look hallucinated or generic.

Data:
${JSON.stringify(sectionData, null, 2)}

Return refined JSON in the same structure:
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
