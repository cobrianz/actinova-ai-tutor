"use client";

import { isFlutterApp, saveBlobViaFlutter } from "./appBridge";
import { downloadQuizAsPDF } from "./pdfUtils";

export async function downloadQuizPdfFromServer({ quizId, title }) {
  const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "Failed to download assessment";
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch {}
    }
    throw new Error(msg);
  }

  const quiz = await res.json();
  await downloadQuizAsPDF({
    ...quiz,
    title: title || quiz.title || "Assessment",
  });
}
