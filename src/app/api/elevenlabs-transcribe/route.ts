import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 },
      );
    }

    // Create form data for ElevenLabs API
    const elevenLabsFormData = new FormData();
    // Convert File to Blob with proper type
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    elevenLabsFormData.append("file", audioBlob, audioFile.name || "recording.webm");
    elevenLabsFormData.append("model_id", "scribe_v1");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs transcription error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      text: result.text || "",
      provider: "elevenlabs",
    });
  } catch (error) {
    console.error("ElevenLabs transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio with ElevenLabs" },
      { status: 500 },
    );
  }
}
