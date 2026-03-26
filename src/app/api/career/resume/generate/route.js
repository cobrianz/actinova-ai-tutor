import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";
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

function normalizeResumeResponse(raw, user, fallbackRole = "") {
  const data = raw && typeof raw === "object" ? raw : {};
  const personalInfo = data.personalInfo || {};
  const fullName =
    personalInfo.fullName ||
    personalInfo.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const jobTitle = personalInfo.jobTitle || personalInfo.title || fallbackRole || "";

  return {
    personalInfo: {
      fullName,
      name: fullName,
      jobTitle,
      title: jobTitle,
      email: personalInfo.email || user.email || "",
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
    const { role, resumeText } = body;
    const trimmedRole = role?.trim() || "";
    const trimmedResumeText = resumeText?.trim() || "";

    if (!trimmedRole && !trimmedResumeText) {
      return NextResponse.json({ error: "Role or existing resume text is required" }, { status: 400 });
    }

    const systemPrompt = `You are a professional resume writer.
Create a comprehensive, professional resume for a candidate${trimmedRole ? ` applying for the role: "${trimmedRole}"` : ""}.
Use the candidate's name: "${user.firstName} ${user.lastName}".
Email: "${user.email}".
${trimmedResumeText ? `The user pasted this existing resume. Rebuild and improve it into a cleaner, stronger, more ATS-friendly resume while preserving truthful core details:\n"""${trimmedResumeText}"""` : ""}

Provide the output in a structured JSON format.

JSON Structure:
{
  "personalInfo": {
     "name": "${user.firstName} ${user.lastName}",
     "email": "${user.email}",
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
If the pasted resume contains useful projects, certifications, awards, or languages, include them too.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }]
    });

    const rawData = JSON.parse(completion.choices[0].message.content);
    const data = normalizeResumeResponse(rawData, user, trimmedRole);

    await trackAPIUsage(userId, "career-resume-gen");

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
