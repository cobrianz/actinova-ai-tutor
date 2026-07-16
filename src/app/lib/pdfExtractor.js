import * as pdfjsLib from "pdfjs-dist";

// Configure pdf.js to use the static worker bundle served from /public
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

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

// extractPdfText will be implemented in tasks 2.2 and 2.3
