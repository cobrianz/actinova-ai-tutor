import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import puppeteer from "puppeteer";
import Test from "@/models/Quiz";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { buildQuizPdfHtml, getQuizPdfFileName } from "@/lib/quizPdfHtml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasPaidAccess(user) {
  const sub = user?.subscription || {};
  const status = String(sub.status || "").toLowerCase();
  const tier = String(sub.tier || "").toLowerCase();
  const plan = String(sub.plan || "").toLowerCase();
  if (status !== "active") return false;
  return (
    tier === "pro" ||
    tier === "enterprise" ||
    plan === "premium" ||
    plan === "pro" ||
    plan === "enterprise"
  );
}

async function handleGet(request, context) {
  const user = request.user;

  const params = await context.params;
  const quizId = params?.id;
  if (!quizId || !ObjectId.isValid(quizId)) {
    return NextResponse.json({ error: "Invalid quiz id" }, { status: 400 });
  }

  await connectToDatabase();
  const quiz = await Test.findOne({
    _id: new ObjectId(quizId),
    createdBy: user._id,
  }).lean();

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const html = buildQuizPdfHtml({
    quiz,
    userLabel: user?.name || user?.email || "",
  });

  const dateStr = new Date().toLocaleDateString("en-GB"); // dd/mm/yyyy
  const footerLine = `Actirova AI Tutor - Assessment: ${quiz?.title || quiz?.course || "Assessment"} ${dateStr} | ${user?.name || user?.email || ""}`.trim();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });
  } catch (e) {
    console.error("Puppeteer launch failed:", e);
    return NextResponse.json(
      { error: "PDF generation unavailable. Try downloading from a desktop browser." },
      { status: 501 }
    );
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: ["load", "domcontentloaded"] });

    // Wait for KaTeX auto-render to finish (best effort).
    try {
      await page.waitForFunction("window.__katexDone === true", { timeout: 5000 });
    } catch {}

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <style>
          .footer {
            width: 100%;
            font-size: 9px;
            color: #6b7280;
            padding: 0 16mm;
            box-sizing: border-box;
          }
          .footer .line {
            border-top: 0.2mm solid #e5e7eb;
            margin-bottom: 2mm;
          }
          .footer .row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 8mm;
          }
        </style>
        <div class="footer">
          <div class="line"></div>
          <div class="row">
            <div>${escapeHtml(footerLine)}</div>
            <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
          </div>
        </div>
      `,
      margin: {
        top: "16mm",
        right: "16mm",
        bottom: "20mm",
        left: "16mm",
      },
    });

    const fileName = getQuizPdfFileName(quiz);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
