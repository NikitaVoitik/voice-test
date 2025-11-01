"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LiveClient, LiveTranscriptionEvents, createClient } from "@deepgram/sdk";

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
  
  // Deepgram realtime transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const deepgramConnectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Timing measurements
  const [elevenLabsAudioTime, setElevenLabsAudioTime] = useState<number | null>(null);
  const [cartesiaAudioTime, setCartesiaAudioTime] = useState<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elevenLabsAudio) {
        URL.revokeObjectURL(elevenLabsAudio);
      }
      if (cartesiaAudio) {
        URL.revokeObjectURL(cartesiaAudio);
      }
      if (deepgramConnectionRef.current) {
        deepgramConnectionRef.current.finish();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [elevenLabsAudio, cartesiaAudio]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      if (deepgramConnectionRef.current) {
        deepgramConnectionRef.current.finish();
        deepgramConnectionRef.current = null;
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    } else {
      // Start recording
      setError(null);
      setTranscript("");
      setIsConnecting(true);
      setElevenLabsAudioTime(null);
      setCartesiaAudioTime(null);
      
      try {
        // Get API key from backend
        const keyResponse = await fetch("/api/deepgram");
        if (!keyResponse.ok) {
          throw new Error("Failed to get Deepgram API key");
        }
        const { key } = await keyResponse.json();
        
        // Create Deepgram client
        const deepgram = createClient(key);
        const connection = deepgram.listen.live({
          model: "nova-2",
          language: "en-US",
          smart_format: true,
          interim_results: true,
        });
        
        deepgramConnectionRef.current = connection;
        
        // Set up event listeners
        connection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened");
          setIsConnecting(false);
          setIsRecording(true);
        });
        
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript && transcript.trim().length > 0) {
            setTranscript((prev) => {
              if (data.is_final) {
                return prev + (prev ? " " : "") + transcript;
              }
              return prev;
            });
          }
        });
        
        connection.on(LiveTranscriptionEvents.Metadata, (data) => {
          console.log("Deepgram metadata:", data);
        });
        
        connection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error("Deepgram error:", error);
          setError("Transcription error occurred");
          setIsRecording(false);
          setIsConnecting(false);
        });
        
        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed");
          setIsRecording(false);
          setIsConnecting(false);
        });
        
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        // Create MediaRecorder to send audio to Deepgram
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && deepgramConnectionRef.current) {
            deepgramConnectionRef.current.send(event.data);
          }
        };
        
        mediaRecorder.start(250); // Send data every 250ms
      } catch (err) {
        console.error("Failed to start recording:", err);
        setError("Failed to access microphone or connect to Deepgram. Please check your setup.");
        setIsRecording(false);
        setIsConnecting(false);
      }
    }
  }, [isRecording]);
  
  const generateAudioFromTranscript = async (text: string, provider: "elevenlabs" | "cartesia") => {
    const isElevenLabs = provider === "elevenlabs";
    const setLoading = isElevenLabs ? setElevenLabsLoading : setCartesiaLoading;
    const setAudio = isElevenLabs ? setElevenLabsAudio : setCartesiaAudio;
    const currentAudio = isElevenLabs ? elevenLabsAudio : cartesiaAudio;
    
    setLoading(true);
    const audioStartTime = performance.now();
    
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
      
      const audioTime = performance.now() - audioStartTime;
      
      // Set audio generation time
      if (isElevenLabs) {
        setElevenLabsAudioTime(audioTime);
      } else {
        setCartesiaAudioTime(audioTime);
      }
      
      if (currentAudio) {
        URL.revokeObjectURL(currentAudio);
      }
      
      setAudio(audioUrl);
    } catch (err) {
      console.error(`${provider} audio generation error:`, err);
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
          <div className="flex justify-between items-center mb-4">
            <label
              htmlFor="transcript"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Realtime Transcription (Deepgram):
            </label>
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isConnecting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
              }`}
            >
              {isRecording ? "🔴 Stop Recording" : "🎤 Start Recording"}
            </button>
          </div>
          {isConnecting && (
            <div className="mb-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              ⏳ Connecting to Deepgram...
            </div>
          )}
          {isRecording && (
            <div className="mb-2 text-sm text-red-600 dark:text-red-400 font-medium animate-pulse">
              🔴 Recording... Speak now!
            </div>
          )}
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Start recording to see realtime transcription..."
            className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            disabled={isRecording}
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
              onClick={() => generateAudioFromTranscript(transcript, "elevenlabs")}
              disabled={elevenLabsLoading || !transcript.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4"
            >
              {elevenLabsLoading ? "Generating..." : "Generate Audio"}
            </button>
            
            {elevenLabsAudioTime !== null && (
              <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm">
                <div className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">⏱️ Timing:</div>
                <div className="text-indigo-700 dark:text-indigo-300">
                  Audio Generation: <span className="font-mono font-bold">{(elevenLabsAudioTime / 1000).toFixed(2)}s</span>
                </div>
              </div>
            )}
            
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
              onClick={() => generateAudioFromTranscript(transcript, "cartesia")}
              disabled={cartesiaLoading || !transcript.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4"
            >
              {cartesiaLoading ? "Generating..." : "Generate Audio"}
            </button>
            
            {cartesiaAudioTime !== null && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
                <div className="font-semibold text-purple-900 dark:text-purple-100 mb-1">⏱️ Timing:</div>
                <div className="text-purple-700 dark:text-purple-300">
                  Audio Generation: <span className="font-mono font-bold">{(cartesiaAudioTime / 1000).toFixed(2)}s</span>
                </div>
              </div>
            )}
            
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
