"use client";

import download from "downloadjs";
import { isFlutterApp, downloadViaFlutter } from "./appBridge";

export async function downloadQuizPdfFromServer({ quizId, title }) {
  const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}/pdf`, {
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

  const blob = await res.blob();
  const safe = String(title || "assessment")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const filename = `assessment_${safe || "exam"}.pdf`;

  if (isFlutterApp()) {
    const reader = new FileReader();
    reader.onloadend = () => downloadViaFlutter(reader.result, filename);
    reader.readAsDataURL(blob);
  } else {
    download(blob, filename, "application/pdf");
  }
}
