"use client";

import { useEffect, useState } from "react";

// ElevenLabs voice options
const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
];

const ELEVENLABS_MODELS = [
  { id: "eleven_monolingual_v1", name: "Eleven Monolingual v1" },
  { id: "eleven_multilingual_v1", name: "Eleven Multilingual v1" },
  { id: "eleven_multilingual_v2", name: "Eleven Multilingual v2" },
  { id: "eleven_turbo_v2", name: "Eleven Turbo v2" },
  { id: "eleven_turbo_v2_5", name: "Eleven Turbo v2.5" },
];

// Cartesia voice options
const CARTESIA_VOICES = [
  { id: "a0e99841-438c-4a64-b679-ae501e7d6091", name: "Barbershop Man" },
  { id: "79a125e8-cd45-4c13-8a67-188112f4dd22", name: "British Lady" },
  { id: "95856005-0332-41b0-935f-352e296aa0df", name: "Calm Lady" },
  { id: "69267136-1bdc-412f-ad78-0caad210fb40", name: "Classy British Man" },
  { id: "726d5ae5-055f-4c3d-8355-d9677de68937", name: "Conversational Lady" },
  { id: "fb26447f-308b-471e-8b00-8e9f04284eb5", name: "Friendly Reading Man" },
  { id: "41534e16-2966-4c6b-9670-111411def906", name: "Newsman" },
  { id: "156fb8d2-335b-4950-9cb3-a2d33befec77", name: "Wise Lady" },
];

const CARTESIA_MODELS = [
  { id: "sonic-english", name: "Sonic English" },
  { id: "sonic-multilingual", name: "Sonic Multilingual" },
];

export default function Home() {
  const [text, setText] = useState("");
  const [elevenLabsLoading, setElevenLabsLoading] = useState(false);
  const [cartesiaLoading, setCartesiaLoading] = useState(false);
  const [elevenLabsAudio, setElevenLabsAudio] = useState<string | null>(null);
  const [cartesiaAudio, setCartesiaAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // ElevenLabs selection state
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(ELEVENLABS_VOICES[0].id);
  const [elevenLabsModelId, setElevenLabsModelId] = useState(ELEVENLABS_MODELS[0].id);
  
  // Cartesia selection state
  const [cartesiaVoiceId, setCartesiaVoiceId] = useState(CARTESIA_VOICES[0].id);
  const [cartesiaModelId, setCartesiaModelId] = useState(CARTESIA_MODELS[0].id);

  // Cleanup URLs when component unmounts or URLs change
  useEffect(() => {
    return () => {
      if (elevenLabsAudio) {
        URL.revokeObjectURL(elevenLabsAudio);
      }
      if (cartesiaAudio) {
        URL.revokeObjectURL(cartesiaAudio);
      }
    };
  }, [elevenLabsAudio, cartesiaAudio]);

  const generateAudio = async (provider: "elevenlabs" | "cartesia") => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setError(null);
    const isElevenLabs = provider === "elevenlabs";
    const setLoading = isElevenLabs ? setElevenLabsLoading : setCartesiaLoading;
    const setAudio = isElevenLabs ? setElevenLabsAudio : setCartesiaAudio;
    const currentAudio = isElevenLabs ? elevenLabsAudio : cartesiaAudio;

    setLoading(true);

    try {
      const requestBody = isElevenLabs
        ? { text, voiceId: elevenLabsVoiceId, modelId: elevenLabsModelId }
        : { text, voiceId: cartesiaVoiceId, modelId: cartesiaModelId };

      const response = await fetch(`/api/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Revoke old URL before setting new one
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio);
      }

      setAudio(audioUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Test App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Compare ElevenLabs vs Cartesia Text-to-Speech
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <label
            htmlFor="text-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Enter text to convert to speech:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something here..."
            className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ElevenLabs Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ElevenLabs
            </h2>
            
            <div className="mb-4">
              <label
                htmlFor="elevenlabs-voice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Voice:
              </label>
              <select
                id="elevenlabs-voice"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {ELEVENLABS_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label
                htmlFor="elevenlabs-model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Model:
              </label>
              <select
                id="elevenlabs-model"
                value={elevenLabsModelId}
                onChange={(e) => setElevenLabsModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {ELEVENLABS_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => generateAudio("elevenlabs")}
              disabled={elevenLabsLoading || !text.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4"
            >
              {elevenLabsLoading ? "Generating..." : "Generate Audio"}
            </button>
            {elevenLabsAudio && (
              <div className="mt-4">
                {/* biome-ignore lint/a11y/useMediaCaption: The audio is generated from the text input which serves as the caption */}
                <audio controls className="w-full" key={elevenLabsAudio}>
                  <source src={elevenLabsAudio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {/* Cartesia Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Cartesia
            </h2>
            
            <div className="mb-4">
              <label
                htmlFor="cartesia-voice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Voice:
              </label>
              <select
                id="cartesia-voice"
                value={cartesiaVoiceId}
                onChange={(e) => setCartesiaVoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {CARTESIA_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label
                htmlFor="cartesia-model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Model:
              </label>
              <select
                id="cartesia-model"
                value={cartesiaModelId}
                onChange={(e) => setCartesiaModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {CARTESIA_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => generateAudio("cartesia")}
              disabled={cartesiaLoading || !text.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4"
            >
              {cartesiaLoading ? "Generating..." : "Generate Audio"}
            </button>
            {cartesiaAudio && (
              <div className="mt-4">
                {/* biome-ignore lint/a11y/useMediaCaption: The audio is generated from the text input which serves as the caption */}
                <audio controls className="w-full" key={cartesiaAudio}>
                  <source src={cartesiaAudio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Make sure to set up your API keys in the .env
            file. See .env.example for reference.
          </p>
        </div>
      </main>
    </div>
  );
}
