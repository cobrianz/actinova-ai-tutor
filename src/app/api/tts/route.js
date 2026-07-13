import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const VOICE_MAP = {
  female: "en-US-AriaNeural",
  male: "en-US-GuyNeural",
  emma: "en-US-EmmaMultilingualNeural",
};

export async function POST(request) {
  try {
    const { text, voice = "female" } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceName = VOICE_MAP[voice] || VOICE_MAP.female;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const result = tts.toStream(text.trim());
    const audioStream = result.audioStream || result;

    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      let settled = false;

      audioStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      audioStream.on("end", () => {
        if (!settled) {
          settled = true;
          resolve(Buffer.concat(chunks));
        }
      });

      audioStream.on("error", (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      });

      setTimeout(() => {
        if (!settled) {
          settled = true;
          if (chunks.length > 0) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error("TTS stream timed out"));
          }
        }
      }, 15000);
    });

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return NextResponse.json({ error: e.message || "TTS failed" }, { status: 500 });
  }
}
