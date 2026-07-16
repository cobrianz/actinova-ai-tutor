import { NextResponse } from "next/server";
import {
    AlignmentType,
    Document,
    Footer,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    UnderlineType,
    WidthType,
} from "docx";
import { combineMiddleware, withAuth, withErrorHandling } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";

const PAGE_MARGIN = {
    top: 1440,
    right: 1440,
    bottom: 1440,
    left: 1440,
};

function getDocumentFormat(type = "") {
    const businessTypes = ["business_report", "business_plan", "grant_proposal", "case_study", "policy_brief", "white_paper", "feasibility_study", "project_proposal"];
    if (businessTypes.includes(type)) return { font: "Arial", size: 22, line: 276, alignment: AlignmentType.LEFT, headingSize: 28 };
    if (type === "lab_report") return { font: "Arial", size: 22, line: 360, alignment: AlignmentType.LEFT, headingSize: 28 };
    if (type === "reflective_journal") return { font: "Georgia", size: 24, line: 432, alignment: AlignmentType.LEFT, headingSize: 30 };
    return { font: "Times New Roman", size: 24, line: 480, alignment: AlignmentType.JUSTIFIED, headingSize: 28 };
}

const normalizeText = (value = "") =>
    String(value || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const normalizeList = (value) =>
    Array.isArray(value)
        ? value.map((item) => normalizeText(item)).filter(Boolean)
        : [];

function extractHtmlLines(value = "") {
    return String(value || "")
        .replace(/<\/(p|div|h1|h2|h3|li|br)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
}

function getCitationMode(style = "") {
    const upper = String(style || "").toUpperCase();
    if (upper.includes("MLA")) return "MLA";
    if (upper.includes("CHICAGO")) return "CHICAGO";
    if (upper.includes("APA")) return "APA";
    return "ACADEMIC";
}

function mapAlignment(value = "", fallback = AlignmentType.JUSTIFIED) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "left") return AlignmentType.LEFT;
    if (normalized === "center") return AlignmentType.CENTER;
    if (normalized === "right") return AlignmentType.RIGHT;
    if (normalized === "justify") return AlignmentType.JUSTIFIED;
    return fallback;
}

function getReferenceLayout(style = "") {
    const mode = getCitationMode(style);
    if (mode === "APA" || mode === "MLA" || mode === "CHICAGO") {
        return "hanging";
    }
    return "inline";
}

function bodyParagraph(text, overrides = {}) {
    return new Paragraph({
        text: normalizeText(text),
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 480 },
        ...overrides,
    });
}

function buildRuns(runs = [], base = {}) {
    return (Array.isArray(runs) ? runs : [])
        .map((run) => {
            const text = String(run?.text || "");
            if (!text.trim()) return null;
            return new TextRun({
                text,
                bold: run?.bold ?? base.bold,
                italics: run?.italics ?? base.italics,
                underline: run?.underline ? { type: UnderlineType.SINGLE } : undefined,
            });
        })
        .filter(Boolean);
}

function paragraphFromRuns(runs = [], overrides = {}) {
    return new Paragraph({
        children: buildRuns(runs),
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 480 },
        ...overrides,
    });
}

function sectionHeading(text, pageBreakBefore = false, level = 1, runs = null, alignment = AlignmentType.LEFT) {
    const headingMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
    };
    return new Paragraph({
        text: runs ? undefined : normalizeText(text),
        children: runs ? buildRuns(runs, { bold: true }) : undefined,
        heading: headingMap[level] || HeadingLevel.HEADING_1,
        alignment,
        pageBreakBefore,
        spacing: { before: 200, after: 180, line: 480 },
    });
}

function buildTitlePage({
    title,
    author,
    institution,
    course,
    name,
    date,
    citationStyle,
    titlePageContent,
    titlePageBlocks,
}) {
    if (Array.isArray(titlePageBlocks) && titlePageBlocks.length > 0) {
        return titlePageBlocks
            .map((block) => {
                if (block?.type === "heading") {
                    return sectionHeading(
                        "",
                        false,
                        block.level || 1,
                        block.runs || [],
                        mapAlignment(block.alignment, AlignmentType.CENTER)
                    );
                }

                if (block?.type === "paragraph") {
                    return paragraphFromRuns(block.runs || [], {
                        alignment: mapAlignment(block.alignment, AlignmentType.CENTER),
                    });
                }

                return null;
            })
            .filter(Boolean);
    }

    const customLines = extractHtmlLines(titlePageContent);
    if (customLines.length > 0) {
        return customLines.map((line, index) =>
            new Paragraph({
                children: [
                    new TextRun({
                        text: line,
                        bold: index === 0,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: index === 0 ? 320 : 120, line: 480 },
            })
        );
    }

    const mode = getCitationMode(citationStyle);
    const safeTitle = normalizeText(title) || "Untitled Document";
    const safeName = normalizeText(name) || "Student Name";
    const safeAuthor = normalizeText(author) || "Instructor Name";
    const safeInstitution = normalizeText(institution) || "Institution";
    const safeCourse = normalizeText(course) || "Course";
    const safeDate =
        normalizeText(date) ||
        new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    if (mode === "MLA") {
        return [
            new Paragraph({ text: safeName, spacing: { after: 120, line: 480 } }),
            new Paragraph({ text: safeAuthor, spacing: { after: 120, line: 480 } }),
            new Paragraph({ text: safeCourse, spacing: { after: 120, line: 480 } }),
            new Paragraph({ text: safeDate, spacing: { after: 360, line: 480 } }),
            new Paragraph({
                children: [new TextRun({ text: safeTitle, bold: true })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 360, line: 480 },
            }),
        ];
    }

    return [
        new Paragraph({ text: "", spacing: { after: 720 } }),
        new Paragraph({
            children: [new TextRun({ text: safeTitle, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 520, line: 480 },
        }),
        new Paragraph({ text: safeName, alignment: AlignmentType.CENTER, spacing: { after: 120, line: 480 } }),
        new Paragraph({ text: safeInstitution, alignment: AlignmentType.CENTER, spacing: { after: 120, line: 480 } }),
        new Paragraph({ text: safeCourse, alignment: AlignmentType.CENTER, spacing: { after: 120, line: 480 } }),
        new Paragraph({ text: safeAuthor, alignment: AlignmentType.CENTER, spacing: { after: 120, line: 480 } }),
        new Paragraph({ text: safeDate, alignment: AlignmentType.CENTER, spacing: { after: 120, line: 480 } }),
    ];
}

function buildBodyChildren({ contentBlocks, references, citationStyle, type }) {
    const children = [];
    const normalizedBlocks = Array.isArray(contentBlocks) ? contentBlocks : [];
    const normalizedReferences = normalizeList(references);
    const format = getDocumentFormat(type);

    normalizedBlocks.forEach((block) => {
        if (!block || typeof block !== "object") return;

        if (block.type === "heading") {
            children.push(
                sectionHeading("", false, block.level || 1, block.runs || [], mapAlignment(block.alignment, AlignmentType.LEFT))
            );
            return;
        }

        if (block.type === "list") {
            (Array.isArray(block.items) ? block.items : []).forEach((item) => {
                children.push(
                    new Paragraph({
                        children: buildRuns(item?.runs || []),
                        alignment: mapAlignment(item?.alignment || block.alignment, AlignmentType.JUSTIFIED),
                        bullet: block.ordered ? undefined : { level: 0 },
                        numbering: block.ordered
                            ? {
                                reference: "report-numbering",
                                level: 0,
                            }
                            : undefined,
                        spacing: { after: 120, line: 480 },
                    })
                );
            });
            return;
        }

        if (block.type === "table" && Array.isArray(block.rows) && block.rows.length > 0) {
            children.push(
                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                    rows: block.rows.map((row) =>
                        new TableRow({
                            children: row.map((cell) =>
                                new TableCell({
                                    children: [paragraphFromRuns(cell?.runs || [], {
                                        alignment: mapAlignment(cell?.alignment || block.alignment, AlignmentType.LEFT),
                                        spacing: { after: 0, line: 360 },
                                    })],
                                })
                            ),
                        })
                    ),
                })
            );
            children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
            return;
        }

        if (block.type === "paragraph") {
            children.push(paragraphFromRuns(block.runs || [], {
                alignment: mapAlignment(block.alignment, format.alignment),
                spacing: { after: 160, line: format.line },
            }));
        }
    });

    if (normalizedReferences.length > 0) {
        const mode = getCitationMode(citationStyle);
        const referenceLayout = getReferenceLayout(citationStyle);
        const headingText = mode === "MLA" ? "Works Cited" : "References";
        children.push(sectionHeading(headingText, true));
        normalizedReferences.forEach((reference) => {
            children.push(
                new Paragraph({
                    text: reference,
                    hanging: referenceLayout === "hanging" ? 360 : undefined,
                    indent: referenceLayout === "inline" ? { left: 0, hanging: 0 } : undefined,
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 160, line: 480 },
                })
            );
        });
    }

    return children;
}

async function handlePost(request) {
    const body = await request.json();
    const {
        title,
        type,
        author,
        institution,
        course,
        name,
        date,
        citationStyle,
        titlePageContent,
        titlePageBlocks,
        contentBlocks,
        references,
    } = body || {};

    if (!normalizeText(title)) {
        return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    const safeTitle = normalizeText(title);
    const format = getDocumentFormat(type);
    const document = new Document({
        creator: "Actinova AI Tutor",
        title: safeTitle,
        description: `Structured ${normalizeText(citationStyle || "academic")} export`,
        styles: {
            default: {
                document: {
                    run: {
                        font: format.font,
                        size: format.size,
                    },
                    paragraph: {
                        spacing: { line: format.line },
                    },
                },
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        font: format.font,
                        size: format.headingSize,
                        bold: true,
                    },
                    paragraph: {
                        spacing: { before: 200, after: 180, line: format.line },
                    },
                },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "report-numbering",
                    levels: [
                        {
                            level: 0,
                            format: "decimal",
                            text: "%1.",
                            alignment: AlignmentType.START,
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: PAGE_MARGIN,
                    },
                },
                children: buildTitlePage({
                    title,
                    author,
                    institution,
                    course,
                    name,
                    date,
                    citationStyle,
                    titlePageContent,
                    titlePageBlocks,
                }),
            },
            {
                properties: {
                    page: {
                        margin: PAGE_MARGIN,
                    },
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: normalizeText(name) || safeTitle,
                                        italics: true,
                                        size: 20,
                                        color: "64748B",
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                children: buildBodyChildren({
                    contentBlocks,
                    references,
                    citationStyle,
                    type,
                }),
            },
        ],
    });

    const buffer = await Packer.toBuffer(document);

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="${safeTitle.replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "_") || "document"}.docx"`,
        },
    });
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth
)(handlePost);

export const dynamic = "force-dynamic";
