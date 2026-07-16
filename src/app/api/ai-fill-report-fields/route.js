import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withAPIRateLimit } from "@/lib/planMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PAPER_FIELD_KEYS = {
    research_project: { brief: ["researchProblem", "objectives"], approach: ["methodology", "dataSource", "framework"] },
    research_proposal: { brief: ["researchProblem", "population"], approach: ["methodology", "timeline", "ethics"] },
    academic_essay: { brief: ["essayPrompt", "thesis"], approach: ["arguments", "counterargument"] },
    literature_review: { brief: ["reviewQuestion", "timeRange"], approach: ["themes", "debates"] },
    term_paper: { brief: ["course", "assignment"], approach: ["concepts"] },
    business_report: { brief: ["situation", "audience"], approach: ["keyQuestions", "metrics"] },
    grant_proposal: { brief: ["project", "funder"], approach: ["funding", "objectives", "population"] },
    case_study: { brief: ["background", "problem"], approach: ["options", "criteria"] },
    business_plan: { brief: ["venture", "market"], approach: ["revenue", "funding", "assumptions"] },
    dissertation: { brief: ["contribution", "subfield"], approach: ["methodology", "framework", "limitations"] },
    capstone_project: { brief: ["project", "problem"], approach: ["approach", "evaluation"] },
    policy_brief: { brief: ["issue", "audience"], approach: ["options"] },
    white_paper: { brief: ["problem", "solution"], approach: ["audience", "examples"] },
    feasibility_study: { brief: ["project"], approach: ["dimensions", "risks"] },
    lab_report: { brief: ["experiment", "hypothesis"], approach: ["materials", "procedure", "results"] },
    project_proposal: { brief: ["project", "approver"], approach: ["deliverables", "timeline", "resources"] },
    annotated_bibliography: { brief: ["question", "sourceCount"], approach: ["criteria"] },
    reflective_journal: { brief: ["experience", "learning"], approach: ["model", "tone"] },
};

const TYPE_NAMES = {
    research_project: "Research Project",
    research_proposal: "Research Proposal",
    academic_essay: "Academic Essay",
    literature_review: "Literature Review",
    term_paper: "Term Paper",
    business_report: "Business Report",
    grant_proposal: "Grant Proposal",
    case_study: "Case Study",
    business_plan: "Business Plan",
    dissertation: "Dissertation",
    capstone_project: "Capstone Project",
    policy_brief: "Policy Brief",
    white_paper: "White Paper",
    feasibility_study: "Feasibility Study",
    lab_report: "Laboratory Report",
    project_proposal: "Project Proposal",
    annotated_bibliography: "Annotated Bibliography",
    reflective_journal: "Reflective Journal",
};

async function handlePost(request) {
    const { topic, type } = await request.json();

    if (!topic || !type) {
        return NextResponse.json({ error: "topic and type are required" }, { status: 400 });
    }

    const fields = PAPER_FIELD_KEYS[type] || PAPER_FIELD_KEYS.research_project;
    const typeName = TYPE_NAMES[type] || "Report";

    const prompt = `You are helping a student fill out a form for creating a "${typeName}" on the topic: "${topic}".

Based on this topic, suggest values for the following fields. Return ONLY valid JSON with these keys. Use empty string "" for any field you cannot reasonably infer.

Brief fields:
- researchProblem / essayPrompt / reviewQuestion / situation / project / venture / experiment / issue / question / experience / background / problem / assignment / course / contribution: The core problem, question, or description (textarea, 1-3 sentences)
- objectives / arguments / themes / options / sourceCount / number of objectives or arguments (number as string, e.g. "3")
- population / audience / funder / market / subfield / approver / timeRange / course / experiment / learning: Context field (short text)
- thesis / solution: Direction or hypothesis (short text)

Approach fields:
- methodology: One of "Qualitative", "Quantitative", "Mixed Methods", "Theoretical / Conceptual", or "Let AI decide"
- dataSource: One of "Primary", "Secondary", "Both", "Theoretical"
- framework: Theoretical framework (short text)
- counterargument: "Yes" or "No"
- timeline / procedure: Brief text
- ethics / debates / limitations / dimensions / risks / materials / criteria / assumptions / examples / evaluation / resources / approach / deliverables / objectives / population / funding: Textarea content (1-3 sentences)
- model: One of "Gibbs' Reflective Cycle", "Kolb's Experiential Learning", "Rolfe's Framework", "Free-form"
- tone: One of "Personal & Informal", "Professional & Reflective", "Academic Reflective"
- results: Placeholder text
- funding: Amount or description
- revenue / deliverables: Brief text
- sourceCount: Number as string

Also suggest:
- academicLevel: One of "High School", "Undergraduate", "Graduate/Master's", "Doctoral", "Professional/Business"
- criticalDepth: One of "Basic", "Moderate", "Critical", "Advanced"

Return JSON like:
{
  "typeFields": { ...all the brief and approach field values above... },
  "academicLevel": "...",
  "criticalDepth": "..."
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: prompt }],
    });

    let data;
    try {
        data = JSON.parse(completion.choices[0].message.content);
    } catch {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

export const POST = combineMiddleware(
    withErrorHandling,
    withAuth,
    (handler) => withAPIRateLimit(handler, "ai-fill-report-fields")
)(handlePost);
