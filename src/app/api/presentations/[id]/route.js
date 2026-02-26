// src/app/api/presentations/[id]/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import PptxGenJs from "pptxgenjs";

async function handleGet(request, { params }) {
  const user = request.user;
  const { id } = await params;

  try {
    const { db } = await connectToDatabase();

    // Get presentation
    const presentation = await db.collection("presentations").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // Check if download is requested
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";

    if (download) {
      // Generate PPTX file
      const prs = new PptxGenJs();
      
      // Set presentation properties
      prs.defineLayout({ name: "DEFAULT", width: 10, height: 7.5 });
      prs.layout = "DEFAULT";

      // Define color scheme with professional colors
      const colorScheme = {
        primary: "2E5090",
        secondary: "F39C12",
        accent: "E74C3C",
        text: "2C3E50",
        light: "ECF0F1",
      };

      prs.defineLayout({ name: "TITLE_SLIDE", width: 10, height: 7.5 });
      prs.defineLayout({ name: "CONTENT_SLIDE", width: 10, height: 7.5 });

      // Add slides
      presentation.slides.forEach((slide, index) => {
        const slideLayout = index === 0 ? "TITLE_SLIDE" : "CONTENT_SLIDE";
        const newSlide = prs.addSlide();

        // Set background color
        newSlide.background = { color: colorScheme.light };

        // Add header color bar
        newSlide.addShape(prs.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 10,
          h: 0.8,
          fill: { color: colorScheme.primary },
        });

        // Add slide number and title slide
        if (index === 0) {
          // Title Slide
          newSlide.addText(presentation.title, {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 1.5,
            fontSize: 54,
            bold: true,
            color: colorScheme.primary,
            align: "center",
          });

          newSlide.addText(presentation.description || "A comprehensive presentation", {
            x: 0.5,
            y: 4.2,
            w: 9,
            h: 1,
            fontSize: 24,
            color: colorScheme.text,
            align: "center",
            italic: true,
          });

          newSlide.addText(`${presentation.totalSlides} Slides • ${presentation.difficulty}`, {
            x: 0.5,
            y: 6,
            w: 9,
            h: 0.5,
            fontSize: 14,
            color: colorScheme.secondary,
            align: "center",
          });
        } else {
          // Content Slide
          newSlide.addText(slide.title, {
            x: 0.5,
            y: 1,
            w: 9,
            h: 0.6,
            fontSize: 36,
            bold: true,
            color: colorScheme.primary,
          });

          // Add separator line
          newSlide.addShape(prs.ShapeType.line, {
            x: 0.5,
            y: 1.7,
            w: 9,
            line: { color: colorScheme.secondary, width: 2 },
          });

          // Add content bullets
          let yPos = 2;
          const contentArray = Array.isArray(slide.content)
            ? slide.content
            : [slide.content];

          contentArray.forEach((point) => {
            if (yPos < 6.5) {
              newSlide.addText(point, {
                x: 1,
                y: yPos,
                w: 8.5,
                fontSize: 18,
                color: colorScheme.text,
                bullet: true,
              });
              yPos += 0.6;
            }
          });

          // Add footer with slide number
          newSlide.addText(`${index} of ${presentation.slides.length}`, {
            x: 0.5,
            y: 7,
            w: 9,
            h: 0.4,
            fontSize: 10,
            color: colorScheme.secondary,
            align: "right",
          });
        }
      });

      // Save and send file
      const buffer = await prs.write({ outputType: "arraybuffer" });
      const fileName = `${presentation.title.replace(/\s+/g, "_")}_${new Date().getTime()}.pptx`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // Return presentation data
    return NextResponse.json({
      success: true,
      presentation: {
        ...presentation,
        _id: presentation._id.toString(),
        createdAt: presentation.createdAt.toISOString(),
        updatedAt: presentation.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error("Presentation fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

async function handleDelete(request, { params }) {
  const user = request.user;
  const { id } = await params;

  try {
    const { db } = await connectToDatabase();

    const result = await db.collection("presentations").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Presentation deleted" });

  } catch (error) {
    console.error("Presentation deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandling(withAuth(handleGet));
export const DELETE = withErrorHandling(withAuth(handleDelete));
export const runtime = "nodejs";
