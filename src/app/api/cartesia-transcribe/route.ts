import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cartesia API key not configured" },
        { status: 500 },
      );
    }

    // Create form data for Cartesia API
    const cartesiaFormData = new FormData();
    // Convert File to Blob with proper type
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    cartesiaFormData.append("file", audioBlob, audioFile.name || "recording.webm");
    cartesiaFormData.append("model", "ink-whisper");
    cartesiaFormData.append("language", "en");

    const response = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Cartesia-Version": "2024-06-10",
      },
      body: cartesiaFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cartesia transcription error:", errorText);
      throw new Error(`Cartesia API error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      text: result.text || "",
      provider: "cartesia",
    });
  } catch (error) {
    console.error("Cartesia transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio with Cartesia" },
      { status: 500 },
    );
  }
}
