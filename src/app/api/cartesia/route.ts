import { CartesiaClient } from "@cartesia/cartesia-js";
import { type NextRequest } from "next/server";

// Default voice: Barbershop Man
const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091";
const DEFAULT_MODEL_ID = "sonic-english";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, modelId } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Cartesia API key not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const cartesia = new CartesiaClient({
      apiKey: apiKey,
    });

    const selectedVoiceId = voiceId || process.env.CARTESIA_VOICE_ID || DEFAULT_VOICE_ID;
    const selectedModelId = modelId || process.env.CARTESIA_MODEL_ID || DEFAULT_MODEL_ID;

    const response = await cartesia.tts.bytes({
      modelId: selectedModelId,
      transcript: text,
      voice: {
        mode: "id",
        id: selectedVoiceId,
      },
      outputFormat: {
        container: "mp3",
        sampleRate: 44100,
        bitRate: 128000,
      },
    });

    // Create a ReadableStream that forwards the audio chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          console.error("Cartesia streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Cartesia API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate audio with Cartesia" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
