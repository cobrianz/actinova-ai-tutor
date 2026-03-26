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

function normalizeResumeForPrompt(resume = {}) {
    const personalInfo = resume.personalInfo || {};
    return {
        personalInfo: {
            name: personalInfo.fullName || personalInfo.name || "",
            email: personalInfo.email || "",
            title: personalInfo.jobTitle || personalInfo.title || "",
            phone: personalInfo.phone || "",
            location: personalInfo.location || "",
            website: personalInfo.website || "",
            linkedin: personalInfo.linkedin || "",
            github: personalInfo.github || "",
        },
        summary: personalInfo.summary || resume.summary || "",
        experience: Array.isArray(resume.experience)
            ? resume.experience.map((item) => ({
                company: item?.company || "",
                position: item?.title || item?.position || "",
                duration: item?.dateRange || [item?.startDate, item?.endDate].filter(Boolean).join(" - "),
                location: item?.location || "",
                highlights: Array.isArray(item?.highlights)
                    ? item.highlights
                    : String(item?.description || "")
                        .split(/\r?\n/)
                        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
                        .filter(Boolean),
            }))
            : [],
        education: Array.isArray(resume.education)
            ? resume.education.map((item) => ({
                school: item?.school || "",
                degree: item?.degree || "",
                year: item?.dateRange || item?.year || [item?.startDate, item?.endDate].filter(Boolean).join(" - "),
                location: item?.location || "",
                description: item?.description || "",
            }))
            : [],
        skills: Array.isArray(resume.skills) ? resume.skills : [],
        projects: Array.isArray(resume.projects) ? resume.projects : [],
        certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
        awards: Array.isArray(resume.awards) ? resume.awards : [],
        languages: Array.isArray(resume.languages) ? resume.languages : [],
    };
}

function normalizeResumeResponse(raw, fallbackResume = {}) {
    const data = raw && typeof raw === "object" ? raw : {};
    const fallbackPersonalInfo = fallbackResume.personalInfo || {};
    const personalInfo = data.personalInfo || {};
    const fullName =
        personalInfo.fullName ||
        personalInfo.name ||
        fallbackPersonalInfo.fullName ||
        fallbackPersonalInfo.name ||
        "";
    const jobTitle =
        personalInfo.jobTitle ||
        personalInfo.title ||
        fallbackPersonalInfo.jobTitle ||
        fallbackPersonalInfo.title ||
        "";

    return {
        personalInfo: {
            fullName,
            name: fullName,
            jobTitle,
            title: jobTitle,
            email: personalInfo.email || fallbackPersonalInfo.email || "",
            phone: personalInfo.phone || fallbackPersonalInfo.phone || "",
            location: personalInfo.location || fallbackPersonalInfo.location || "",
            website: personalInfo.website || fallbackPersonalInfo.website || "",
            linkedin: personalInfo.linkedin || fallbackPersonalInfo.linkedin || "",
            github: sanitizeGithub(personalInfo.github || fallbackPersonalInfo.github || ""),
            summary: personalInfo.summary || data.summary || fallbackPersonalInfo.summary || fallbackResume.summary || "",
        },
        summary: data.summary || personalInfo.summary || fallbackResume.summary || "",
        experience: Array.isArray(data.experience)
            ? data.experience.map((item) => ({
                title: item?.title || item?.position || "",
                company: item?.company || "",
                location: item?.location || "",
                startDate: item?.startDate || "",
                endDate: item?.endDate || "",
                dateRange: item?.dateRange || item?.duration || "",
                description: Array.isArray(item?.highlights)
                    ? item.highlights.join("\n")
                    : Array.isArray(item?.description)
                        ? item.description.join("\n")
                        : item?.description || "",
            }))
            : (fallbackResume.experience || []),
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
            : (fallbackResume.education || []),
        skills: Array.isArray(data.skills) ? data.skills.filter(Boolean) : (fallbackResume.skills || []),
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
            : (fallbackResume.projects || []),
        certifications: Array.isArray(data.certifications) ? data.certifications : (fallbackResume.certifications || []),
        awards: Array.isArray(data.awards) ? data.awards : (fallbackResume.awards || []),
        languages: Array.isArray(data.languages) ? data.languages : (fallbackResume.languages || []),
        customSections: Array.isArray(data.customSections) ? data.customSections : (fallbackResume.customSections || []),
    };
}

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const body = await request.json();
        const { resume, jobDescription, matchResult } = body;

        if (!resume || !jobDescription?.trim() || !matchResult) {
            return NextResponse.json({ error: "Resume, job description, and match result are required" }, { status: 400 });
        }

        const normalizedResume = normalizeResumeForPrompt(resume);

        const systemPrompt = `You are a professional resume writer and ATS optimization expert.
Refine the provided resume to better match the target job description.
Focus on:
1. Integrating the missing keywords: ${JSON.stringify(matchResult.keywordsMissing)}.
2. Addressing these recommendations: ${JSON.stringify(matchResult.recommendations)}.
3. Improving the impact of experience highlights based on the job description: "${jobDescription}".

Maintain the existing structure but improve the content wordings for better ATS scores and recruiter impact.
Do not invent false employers, degrees, metrics, or contact links.

Original Resume: ${JSON.stringify(normalizedResume)}.

Provide the output in a structured JSON format matching this structure:
{
  "personalInfo": { "name": "...", "email": "...", "title": "..." },
  "summary": "...",
  "experience": [{ "company": "...", "position": "...", "duration": "...", "highlights": ["..."] }],
  "education": [{ "school": "...", "degree": "...", "year": "..." }],
  "skills": ["...", "..."],
  "projects": [{ "name": "...", "description": "...", "technologies": "..." }]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const rawData = JSON.parse(completion.choices[0].message.content);
        const data = normalizeResumeResponse(rawData, resume);

        await trackAPIUsage(userId, "career-resume-refine");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Resume refinement error:", error);
        return NextResponse.json({ error: "Failed to refine resume" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
