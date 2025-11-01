"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [elevenLabsLoading, setElevenLabsLoading] = useState(false);
  const [cartesiaLoading, setCartesiaLoading] = useState(false);
  const [elevenLabsAudio, setElevenLabsAudio] = useState<string | null>(null);
  const [cartesiaAudio, setCartesiaAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`/api/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
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
