import { CartesiaClient } from "@cartesia/cartesia-js";
import { type NextRequest, NextResponse } from "next/server";

// Default voice: Barbershop Man
const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091";
const DEFAULT_MODEL_ID = "sonic-english";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cartesia API key not configured" },
        { status: 500 },
      );
    }

    const cartesia = new CartesiaClient({
      apiKey: apiKey,
    });

    const voiceId = process.env.CARTESIA_VOICE_ID || DEFAULT_VOICE_ID;
    const modelId = process.env.CARTESIA_MODEL_ID || DEFAULT_MODEL_ID;

    const response = await cartesia.tts.bytes({
      modelId,
      transcript: text,
      voice: {
        mode: "id",
        id: voiceId,
      },
      outputFormat: {
        container: "mp3",
        sampleRate: 44100,
        bitRate: 128000,
      },
    });

    // Convert the stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response) {
      chunks.push(chunk);
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
    console.error("Cartesia API error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio with Cartesia" },
      { status: 500 },
    );
  }
}
