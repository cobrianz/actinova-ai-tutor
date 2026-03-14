// src/app/api/generate-doc/route.js

import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import { withAuth, withErrorHandling } from "@/lib/middleware";

async function handlePost(request) {
    try {
        const data = await request.json();

        const citationStyle = data.citationStyle || "APA";
        let templateFilename = "actinova-academic.dotx";

        if (citationStyle.toUpperCase().includes("MLA")) {
            templateFilename = "MLA .dotx";
        } else if (citationStyle.toUpperCase().includes("CHICAGO")) {
            templateFilename = "Actinova_Chicago_Formatted_Paper.dotx";
        }

        // Template path
        const templatePath = path.resolve(
            process.cwd(),
            "templates",
            templateFilename
        );

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: "Academic template not found" }, { status: 500 });
        }

        let content;
        try {
            content = fs.readFileSync(templatePath, "binary");
        } catch (err) {
            console.warn(`Template read failed for ${templatePath}. Falling back to default.`);
            templatePath = path.resolve(process.cwd(), "templates", "actinova-academic.dotx");
            content = fs.readFileSync(templatePath, "binary");
        }

        let zip = new PizZip(content);
        let doc;

        try {
            doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
        } catch (e) {
            console.error("Template parsing failed:", e.message);
            console.warn("Falling back to default actinova-academic.dotx template.");

            // Fallback to default academic template if the requested .dotx is corrupted
            const fallbackPath = path.resolve(process.cwd(), "templates", "actinova-academic.dotx");
            content = fs.readFileSync(fallbackPath, "binary");
            zip = new PizZip(content);
            doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
        }

        const studentName = data.name || "Actinova Student";
        const parts = studentName.split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        let templateData = {};

        // Define all possible sections/paragraphs for mapping
        let allParagraphs = [];
        if (data.sections && Array.isArray(data.sections)) {
            data.sections.forEach(sec => {
                if (sec.heading) {
                    allParagraphs.push(sec.heading);
                }
                if (sec.paragraphs) {
                    allParagraphs.push(...sec.paragraphs);
                } else if (sec.content) {
                    allParagraphs.push(sec.content);
                }
            });
        }

        let allReferences = [];
        if (data.references && Array.isArray(data.references)) {
            allReferences = data.references.map(ref => typeof ref === 'string' ? ref : ref.text || "");
        }

        // Normalize sections for different template variants (e.g., casing of "Heading")
        const normalizedSections = (data.sections || []).map(sec => ({
            ...sec,
            Heading: sec.heading || sec.title,
            heading: sec.heading || sec.title,
            paragraphs: sec.paragraphs || (sec.content ? [sec.content] : [])
        }));

        templateData = {
            title: data.title || data.topic || "Academic Paper",
            author: data.author || "Research Author",
            first_name: firstName,
            last_name: lastName,
            instructor: data.author || "Professor Name",
            institution: data.institution || "Actinova AI Tutor",
            course: data.course || "",
            name: studentName,
            // Fallback for corrupted tag in Chicago
            student_name: studentName,
            date: data.date || "",
            abstract: data.abstract || "",
            sections: normalizedSections,
            // Fallbacks for Chicago templating
            paragraphs: allParagraphs,
            bibliography: allReferences,
            references: allReferences,
            page_number: "1",
        };

        // Prepare data for template
        doc.render(templateData);

        const buffer = doc.getZip().generate({
            type: "nodebuffer",
        });

        const safeTitle = (templateData.title).replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").substring(0, 100);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
            },
        });

    } catch (error) {
        console.error("Doc generation error:", error);
        return NextResponse.json({ error: "Failed to generate Word document" }, { status: 500 });
    }
}

export const POST = withErrorHandling(withAuth(handlePost));
