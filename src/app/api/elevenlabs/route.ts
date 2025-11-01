import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 },
      );
    }

    const client = new ElevenLabsClient({ apiKey });

    // Using the default voice "Rachel" - one of the free voices
    const audio = await client.textToSpeech.convert("21m00Tcm4TlvDq8ikWAM", {
      text,
      modelId: "eleven_monolingual_v1",
    });

    // Convert the audio stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio with ElevenLabs" },
      { status: 500 },
    );
  }
}
