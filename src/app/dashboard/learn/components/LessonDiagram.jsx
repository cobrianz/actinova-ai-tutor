"use client";

import React, { useState, useEffect } from "react";
import diagramMap from "@/data/diagrams/diagramMap";

const wikimediaCache = {};

async function fetchFromWikimedia(diagramId) {
  if (wikimediaCache[diagramId]) return wikimediaCache[diagramId];

  const words = diagramId.split("-");
  const titleCased = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  // Try direct filename variations
  const filenameVariants = [
    titleCased.join("_") + ".svg",
    titleCased.join("-") + ".svg",
  ];

  for (const fname of filenameVariants) {
    try {
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fname)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      const pages = data.query?.pages;
      const page = pages && Object.values(pages)[0];
      if (page && !page.missing) {
        const url = page?.imageinfo?.[0]?.url;
        if (url) {
          const svgRes = await fetch(url);
          if (svgRes.ok) {
            const svgText = await svgRes.text();
            wikimediaCache[diagramId] = { url, svgText, title: fname.replace(".svg", "").replace(/_/g, " ") };
            return wikimediaCache[diagramId];
          }
        }
      }
    } catch (e) {}
  }

  // Search fallback
  try {
    const searchTerms = diagramId.replace(/-/g, " ");
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms + " svg")}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    const results = data.query?.search || [];

    // Filter: must be SVG, prefer results whose title words match the diagramId
    const diagramWords = words.filter((w) => w.length > 3).map((w) => w.toLowerCase());
    const scored = results
      .filter((r) => r.title.toLowerCase().endsWith(".svg"))
      .map((r) => {
        const t = r.title.toLowerCase();
        let score = 0;
        diagramWords.forEach((w) => { if (t.includes(w)) score += 1; });
        return { ...r, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0] || results.find((r) => r.title.toLowerCase().endsWith(".svg"));
    if (!best) return null;

    const title = best.title.replace("File:", "");
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    const page = pages && Object.values(pages)[0];
    const url = page?.imageinfo?.[0]?.url;

    if (url) {
      const svgRes = await fetch(url);
      if (svgRes.ok) {
        const svgText = await svgRes.text();
        wikimediaCache[diagramId] = { url, svgText, title: title.replace(".svg", "").replace(/_/g, " ") };
        return wikimediaCache[diagramId];
      }
    }
  } catch (e) {}

  return null;
}

function stripSvgDimensions(text) {
  if (!text) return text;

  // Check if viewBox already exists
  const hasViewBox = /viewBox\s*=\s*["'][^"']+["']/i.test(text);

  if (hasViewBox) {
    // Just strip width/height, viewBox handles scaling
    return text
      .replace(/<svg([^>]*?)(?:\s+width="[^"]*")/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+height="[^"]*")/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+width='[^']*')/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+height='[^']*')/gi, "<svg$1");
  }

  // No viewBox — extract width/height and convert to viewBox
  const widthMatch = text.match(/<svg[^>]*\swidth=["'](\d+(?:\.\d+)?)/i);
  const heightMatch = text.match(/<svg[^>]*\sheight=["'](\d+(?:\.\d+)?)/i);

  if (widthMatch && heightMatch) {
    const w = Math.ceil(parseFloat(widthMatch[1]));
    const h = Math.ceil(parseFloat(heightMatch[1]));
    // Add viewBox, then strip width/height
    let result = text.replace(/<svg/i, `<svg viewBox="0 0 ${w} ${h}"`);
    result = result
      .replace(/<svg([^>]*?)(?:\s+width="[^"]*")/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+height="[^"]*")/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+width='[^']*')/gi, "<svg$1")
      .replace(/<svg([^>]*?)(?:\s+height='[^']*')/gi, "<svg$1");
    return result;
  }

  // No viewBox and no width/height — try to extract from content bounds
  const vbMatch = text.match(/viewBox=["']([^"']+)["']/i);
  if (vbMatch) {
    return text; // already has viewBox, nothing to do
  }

  // Last resort: try to extract bounds from a background rect or path
  const rectMatch = text.match(/width=["'](\d+(?:\.\d+)?)["'][^>]*height=["'](\d+(?:\.\d+)?)/i);
  if (rectMatch) {
    const w = Math.ceil(parseFloat(rectMatch[1]));
    const h = Math.ceil(parseFloat(rectMatch[2]));
    return text.replace(/<svg/i, `<svg viewBox="0 0 ${w} ${h}"`);
  }

  // Fallback: add a default viewBox so at least something renders
  return text.replace(/<svg/i, '<svg viewBox="0 0 800 600"');
}

function sanitizeSvg(text) {
  if (!text) return text;
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\son\w+=\{[^}]*\}/gi, "")
    .replace(/javascript\s*:/gi, "")
    // Strip metadata elements
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    // Strip text elements containing Wikimedia attribution or source text
    .replace(/<text[\s\S]*?<\/text>/gi, (match) => {
      if (/(?:To modify|read User|Edition of Inkscape|Wikimedia|Source:|draw with layers|from images)/i.test(match)) {
        return "";
      }
      return match;
    });
}

export default function LessonDiagram({ diagramId, className = "" }) {
  const [svgContent, setSvgContent] = useState(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = diagramMap[diagramId];

      if (local) {
        try {
          const res = await fetch(local.path);
          if (!res.ok) throw new Error("Failed to load diagram");
          const text = await res.text();
          if (!cancelled) {
            setSvgContent(sanitizeSvg(stripSvgDimensions(text)));
            setTitle(local.title);
            setSource(local.source);
            setLoading(false);
          }
        } catch {
          if (!cancelled) { setError(true); setLoading(false); }
        }
        return;
      }

      const remote = await fetchFromWikimedia(diagramId);
      if (cancelled) return;

      if (remote) {
        setSvgContent(sanitizeSvg(stripSvgDimensions(remote.svgText)));
        setTitle(remote.title);
        setSource("Wikimedia Commons");
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [diagramId]);

  if (error) {
    return (
      <div className="my-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Diagram not available: {diagramId}
        </p>
      </div>
    );
  }

  if (loading || !svgContent) {
    return (
      <div className="my-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
        <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  return (
    <div className={`w-full my-4 ${className}`}>
      <div className="max-w-full">
        <div className="p-3 sm:p-4">
          <div
            className="w-full sm:w-2/5 mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[140px] [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    </div>
  );
}
