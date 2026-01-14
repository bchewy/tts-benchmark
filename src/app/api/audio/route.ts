import { NextResponse } from "next/server";

import { prompts, providers } from "@/lib/bench-data";
import { getOrCreateAudio } from "@/lib/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveContentType = (format: string) => {
  switch (format) {
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    case "alaw":
    case "mulaw":
      return "audio/basic";
    default:
      return "audio/mpeg";
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("provider");
  const promptId = searchParams.get("prompt");

  if (!providerId || !promptId) {
    return NextResponse.json({ error: "Missing provider or prompt" }, { status: 400 });
  }

  const provider = providers.find((item) => item.id === providerId);
  const prompt = prompts.find((item) => item.id === promptId);

  if (!provider || !prompt) {
    return NextResponse.json({ error: "Unknown provider or prompt" }, { status: 400 });
  }

  try {
    const result = await getOrCreateAudio({
      providerId,
      promptId,
      promptText: prompt.text,
    });

    return new Response(result.audio, {
      headers: {
        "Content-Type": resolveContentType(result.format),
        "Cache-Control": result.cached
          ? "public, max-age=31536000, immutable"
          : "public, max-age=86400",
        "X-Cache": result.cached ? "HIT" : "MISS",
        "X-TTS-Provider": providerId,
        "X-TTS-Voice": result.voice,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audio generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
