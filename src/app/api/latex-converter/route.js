// src/app/api/latex-converter/route.js

import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import { jsonToLatex } from "@/lib/academic-engine";

async function handlePost(request) {
    try {
        const { structuredContent } = await request.json();

        if (!structuredContent) {
            return NextResponse.json({ error: "Structured content is required" }, { status: 400 });
        }

        const latex = jsonToLatex(structuredContent);

        return NextResponse.json({
            success: true,
            latex: latex
        });

    } catch (error) {
        console.error("LaTeX conversion error:", error);
        return NextResponse.json({ error: "Failed to convert to LaTeX" }, { status: 500 });
    }
}

export const POST = withErrorHandling(withAuth(handlePost));
