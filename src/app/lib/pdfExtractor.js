let pdfjsLib = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }
  return pdfjsLib;
}

import { createWorker } from "tesseract.js";

// ---------------------------------------------------------------------------
// Tesseract.js worker singleton — lazily initialised, reused within a call
// ---------------------------------------------------------------------------
let _workerPromise = null;

/**
 * Returns the cached Tesseract worker, creating it on first call.
 * @returns {Promise<import("tesseract.js").Worker>}
 */
async function getWorker() {
  if (!_workerPromise) {
    _workerPromise = createWorker("eng");
  }
  return _workerPromise;
}

/**
 * Custom error class for typed PDF extraction failures.
 *
 * @property {"password" | "corrupt" | "page_limit" | "ocr_runtime"} type
 *   - "password"   — PDF is password-protected
 *   - "corrupt"    — PDF is unreadable / malformed
 *   - "page_limit" — PDF exceeds the 500-page limit
 *   - "ocr_runtime" — Unexpected failure during OCR processing
 */
export class PdfExtractorError extends Error {
  /**
   * @param {"password" | "corrupt" | "page_limit" | "ocr_runtime"} type
   * @param {string} [message] - Optional human-readable message; defaults to type
   */
  constructor(type, message) {
    super(message || type);
    this.type = type;
    this.name = "PdfExtractorError";
  }
}

/**
 * Extract text from a PDF File object.
 * Performs a text-layer pass via pdf.js, then an OCR pass via Tesseract.js
 * for any image-only pages whose text layer has fewer than 20 characters.
 *
 * @param {File} file - The PDF File from the file picker / drop zone
 * @param {object} callbacks - Progress and lifecycle callbacks
 * @param {(current: number, total: number) => void} [callbacks.onTextProgress]
 *   Called after each page processed by pdf.js.
 *   current = 1-based page index, total = document page count.
 * @param {(pageIndex: number, total: number) => void} [callbacks.onOcrProgress]
 *   Called before OCR starts on each image-only page.
 *   pageIndex = 1-based page number within the full document.
 * @param {(extractedText: string) => void} [callbacks.onComplete]
 *   Called once all pages are processed, with the full concatenated text.
 * @returns {Promise<string>} Extracted_Text
 * @throws {PdfExtractorError} Typed errors: "password", "corrupt", "page_limit"
 */
export async function extractPdfText(file, callbacks = {}) {
  const pdfjsLib = await getPdfJs();

  // Step 1: Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Step 2: Load the PDF document, catching typed errors
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    // Password-protected PDF
    if (
      (pdfjsLib.PasswordException && err instanceof pdfjsLib.PasswordException) ||
      (err.name === "PasswordException") ||
      (err.message && err.message.toLowerCase().includes("password"))
    ) {
      throw new PdfExtractorError("password");
    }
    // Corrupted / invalid PDF
    if (
      (pdfjsLib.InvalidPDFException && err instanceof pdfjsLib.InvalidPDFException) ||
      (err.name === "InvalidPDFException") ||
      (err.message && err.message.includes("Invalid PDF"))
    ) {
      throw new PdfExtractorError("corrupt");
    }
    // Re-throw anything else as corrupt
    throw new PdfExtractorError("corrupt");
  }

  // Step 3: Enforce page limit
  if (pdf.numPages > 500) {
    throw new PdfExtractorError("page_limit");
  }

  // Step 4: Initialise accumulators
  const pageTexts = new Array(pdf.numPages).fill("");
  const ocrQueue = []; // 1-based page numbers of image-only pages

  // Step 5: Text-layer pass over every page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ").trim();

    callbacks.onTextProgress?.(pageNum, pdf.numPages);

    if (text.length < 20) {
      // Image-only page — queue for OCR
      ocrQueue.push(pageNum);
    } else {
      pageTexts[pageNum - 1] = `\n\n--- Page ${pageNum} ---\n\n${text}`;
    }
  }

  // Step 6: OCR pass — process image-only pages sequentially
  for (const pageNum of ocrQueue) {
    callbacks.onOcrProgress?.(pageNum, pdf.numPages);
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.08 }); // ≈150 DPI from 72 DPI base

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      const worker = await getWorker();
      const result = await worker.recognize(canvas);

      if (result.data.confidence < 30) {
        pageTexts[pageNum - 1] = `[Page ${pageNum}: could not be read]`;
      } else {
        pageTexts[pageNum - 1] = `\n\n--- Page ${pageNum} ---\n\n${result.data.text}`;
      }
    } catch {
      pageTexts[pageNum - 1] = `[Page ${pageNum}: could not be read]`;
    }
  }

  // Terminate the worker after all OCR pages are processed so it is recreated fresh next call
  if (_workerPromise) {
    try {
      const worker = await _workerPromise;
      await worker.terminate();
    } catch {
      // ignore termination errors
    } finally {
      _workerPromise = null;
    }
  }

  // Step 7: Concatenate all page texts
  let fullText = pageTexts.join("").trim();

  // Step 8: Enforce 10 MB client-side cap
  if (fullText.length > 10_000_000) {
    fullText = fullText.slice(0, 10_000_000);
  }

  // Step 9: Notify caller
  callbacks.onComplete?.(fullText);

  // Step 10: Return
  return fullText;
}
