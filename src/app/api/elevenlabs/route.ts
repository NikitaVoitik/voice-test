import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { type NextRequest } from "next/server";

// Default voice: Rachel (one of the free voices)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const DEFAULT_MODEL_ID = "eleven_monolingual_v1";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, modelId } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const client = new ElevenLabsClient({ apiKey });

    const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const selectedModelId = modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

    const audio = await client.textToSpeech.convert(selectedVoiceId, {
      text,
      modelId: selectedModelId,
    });

    // Create a ReadableStream that forwards the audio chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = audio.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              controller.enqueue(value);
            }
          }
          controller.close();
        } catch (error) {
          console.error("ElevenLabs streaming error:", error);
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
    console.error("ElevenLabs API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate audio with ElevenLabs" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
