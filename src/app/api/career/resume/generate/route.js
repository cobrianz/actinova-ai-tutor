import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage, checkAPILimit } from "@/lib/planMiddleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import CareerHistory from "@/models/CareerHistory";
import dbConnect from "@/lib/dbConnect";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function sanitizeGithub(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /github/i.test(text) ? text : "";
}

function normalizeResumeResponse(raw, user, fallbackRole = "", { preferUserIdentity = true } = {}) {
  const data = raw && typeof raw === "object" ? raw : {};
  const personalInfo = data.personalInfo || {};
  const fullName =
    personalInfo.fullName ||
    personalInfo.name ||
    (preferUserIdentity ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "");
  const jobTitle = personalInfo.jobTitle || personalInfo.title || fallbackRole || "";

  return {
    personalInfo: {
      fullName,
      name: fullName,
      jobTitle,
      title: jobTitle,
      email: personalInfo.email || (preferUserIdentity ? user.email || "" : ""),
      phone: personalInfo.phone || "",
      location: personalInfo.location || "",
      website: personalInfo.website || "",
      linkedin: personalInfo.linkedin || "",
      github: sanitizeGithub(personalInfo.github),
      summary: personalInfo.summary || data.summary || "",
    },
    summary: data.summary || personalInfo.summary || "",
    experience: Array.isArray(data.experience)
      ? data.experience.map((item) => ({
          title: item?.title || item?.position || "",
          company: item?.company || "",
          location: item?.location || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          dateRange: item?.dateRange || item?.duration || item?.year || "",
          description: Array.isArray(item?.description)
            ? item.description.join("\n")
            : Array.isArray(item?.highlights)
              ? item.highlights.join("\n")
              : item?.description || "",
        }))
      : [],
    education: Array.isArray(data.education)
      ? data.education.map((item) => ({
          school: item?.school || item?.university || "",
          degree: item?.degree || item?.course || item?.program || "",
          location: item?.location || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          dateRange: item?.dateRange || item?.year || "",
          description: Array.isArray(item?.description)
            ? item.description.join("\n")
            : item?.description || "",
        }))
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills.filter(Boolean)
      : typeof data.skills === "string"
        ? data.skills.split(/,|\n/).map((item) => item.trim()).filter(Boolean)
        : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((item) => ({
          name: item?.name || item?.title || "",
          description: Array.isArray(item?.description)
            ? item.description.join("\n")
            : item?.description || "",
          technologies: Array.isArray(item?.technologies)
            ? item.technologies.join(", ")
            : item?.technologies || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          dateRange: item?.dateRange || "",
        }))
      : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    awards: Array.isArray(data.awards) ? data.awards : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    customSections: Array.isArray(data.customSections) ? data.customSections : [],
  };
}

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  try {
    const body = await request.json();
    const { role, resumeText, template } = body;
    const trimmedRole = role?.trim() || "";
    const trimmedResumeText = resumeText?.trim() || "";
    const templateId = template || "classic";

    const templateHints = {
      classic: "Use a traditional, formal tone with centered headers and serif-style language.",
      modern: "Use clean, concise language with a modern professional tone.",
      executive: "Use authoritative, high-level language appropriate for C-suite roles.",
      minimal: "Use brief, streamlined wording. Keep sentences short and impactful.",
      creative: "Use expressive, personality-driven language suitable for creative industries.",
      technical: "Use precise, technical terminology with skills-focused descriptions.",
      elegant: "Use refined, polished language with a sophisticated tone.",
      bold: "Use strong, assertive language with high-impact action verbs.",
      compact: "Use extremely concise, dense phrasing to fit maximum content.",
      professional: "Use formal, corporate-appropriate language with structured bullet points.",
    };
    const templateHint = templateHints[templateId] || templateHints.classic;

    if (!trimmedRole && !trimmedResumeText) {
      return NextResponse.json({ error: "Role or existing resume text is required" }, { status: 400 });
    }

    // Credit check
    const { db } = await connectToDatabase();
    const userId = user._id;
    const userDoc = await db.collection("users").findOne({ _id: typeof userId === "string" ? new ObjectId(userId) : userId });
    const creditCheck = await checkAPILimit(db, userDoc, "career_tools");
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: "Insufficient credits", credits: creditCheck.credits, creditCost: creditCheck.creditCost }, { status: 429 });
    }

    const systemPrompt = `You are a professional resume writer.
Create a comprehensive, professional resume for a candidate${trimmedRole ? ` applying for the role: "${trimmedRole}"` : ""}.
${trimmedResumeText
  ? `The user pasted this existing resume. Rebuild and improve it into a cleaner, stronger, more ATS-friendly resume while preserving truthful core details exactly where provided. Treat the pasted resume as the primary source of truth for name, email, phone, location, links, employers, projects, dates, and education:\n"""${trimmedResumeText}"""`
  : `If no source resume is provided, you may use the signed-in user's profile details only as a light fallback for name and email.`}

Writing style for this template: ${templateHint}

Provide the output in a structured JSON format.

JSON Structure:
{
  "personalInfo": {
     "name": "${trimmedResumeText ? "Use the pasted resume candidate name" : `${user.firstName} ${user.lastName}`}",
     "email": "${trimmedResumeText ? "Use the pasted resume candidate email" : user.email}",
     "title": "${trimmedRole}"
  },
  "summary": "Professional summary...",
  "experience": [
    {
      "company": "Company Name",
      "position": "Title",
      "duration": "Dates",
      "highlights": ["bullet point 1", "bullet point 2"]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Name",
      "year": "Year"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Ensure the content is high-quality, ATS-optimized${trimmedRole ? `, and specifically tailored to the ${trimmedRole} position` : ""}.
Use factual, resume-ready wording. Do not invent impossible metrics, employers, dates, degrees, or contact links.
If the pasted resume contains useful projects, certifications, awards, or languages, include them too.
Never replace pasted candidate identity details with the signed-in user's account identity.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }]
    });

    const rawData = JSON.parse(completion.choices[0].message.content);
    const data = normalizeResumeResponse(rawData, user, trimmedRole, {
      preferUserIdentity: !trimmedResumeText,
    });

    await trackAPIUsage(userId, "career-resume-gen", { itemType: "career_tools", creditCost: 25 });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
