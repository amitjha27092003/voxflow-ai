"use client";

import React, { useState, useEffect, useRef } from "react";
import { Customer, InventoryItem, VoiceProcessResponse } from "@/types";
import { speakHindi } from "@/utils/speech";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Volume2,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Send,
  X,
  MessageSquare,
} from "lucide-react";

interface VoiceDockProps {
  customers: Customer[];
  inventory: InventoryItem[];
  onVoiceSuccess: (response: VoiceProcessResponse, rawTranscript: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

const DEMO_PILLS = [
  "Sharma ji ke 2 kilo aata aur 1 Amul butter udhaar likh de",
  "Rahul ke 500 rupaye jama kar le",
  "Sunita devi ko 1 liter Fortune tel aur 1 kilo cheeni udhaar",
  "Aaj kiska udhaar baaki hai?",
];

export const VoiceDock: React.FC<VoiceDockProps> = ({
  customers,
  inventory,
  onVoiceSuccess,
  isListening,
  setIsListening,
}) => {
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<VoiceProcessResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const [manualInput, setManualInput] = useState<string>("");
  const [showManualBox, setShowManualBox] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setBrowserSupported(false);
      }
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setLastResponse(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in this browser. Use quick demo chips below.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN"; // Native Hindi / Hinglish voice recognition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInterimTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access denied. Please allow microphone permissions or use demo pills.");
        } else if (event.error !== "no-speech") {
          setErrorMessage(`Microphone notice: ${event.error}. You can also click demo pills.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setErrorMessage("Unable to activate microphone. Please try clicking a demo pill.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    if (interimTranscript.trim()) {
      handleProcessVoice(interimTranscript.trim());
    }
  };

  const handleProcessVoice = async (transcriptText: string) => {
    if (!transcriptText || !transcriptText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/process-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          customers,
          inventory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: VoiceProcessResponse = await res.json();
      setLastResponse(data);

      // Trigger crisp audio confirmation with SpeechSynthesis
      if (data.voice_response_hi) {
        speakHindi(data.voice_response_hi);
      }

      // Update state if intent is TRANSACTION
      if (data.intent === "TRANSACTION" && data.actions && data.actions.length > 0) {
        onVoiceSuccess(data, transcriptText);
      }
    } catch (err: any) {
      console.error("Voice processing error:", err);
      setErrorMessage("Could not process voice instruction. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePillClick = (pillText: string) => {
    setInterimTranscript(pillText);
    handleProcessVoice(pillText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    setInterimTranscript(text);
    setManualInput("");
    setShowManualBox(false);
    handleProcessVoice(text);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-3 sm:pb-5 pt-3 px-3 sm:px-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent pointer-events-none">
      <div className="max-w-2xl mx-auto flex flex-col items-center pointer-events-auto">
        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-2 w-full max-w-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Voice Response Banner in 100% clean modern English UI */}
        {lastResponse && (
          <div
            className={`mb-3 w-full max-w-lg rounded-2xl p-4 shadow-xl border animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${
              lastResponse.intent === "TRANSACTION"
                ? "bg-slate-900 text-white border-slate-800"
                : lastResponse.intent === "QUERY"
                ? "bg-slate-900 text-white border-slate-800"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {lastResponse.intent === "TRANSACTION" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : lastResponse.intent === "QUERY" ? (
                    <Sparkles className="w-4 h-4 text-teal-400" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {lastResponse.intent === "TRANSACTION"
                        ? "Transaction Recorded"
                        : lastResponse.intent === "QUERY"
                        ? "AI Response"
                        : "Clarification Needed"}
                    </span>
                    <button
                      onClick={() => speakHindi(lastResponse.voice_response_hi)}
                      title="Replay Voice Audio"
                      className="p-1 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {lastResponse.voice_response_hi}
                  </div>
                  {lastResponse.query_answer_hi && (
                    <div className="text-xs text-slate-300 mt-1.5 bg-white/5 p-2.5 rounded-lg border border-white/10 font-mono whitespace-pre-line leading-relaxed">
                      {lastResponse.query_answer_hi}
                    </div>
                  )}
                  {lastResponse.clarification_question_hi && (
                    <div className="text-xs text-amber-300 mt-1.5 font-medium">
                      {lastResponse.clarification_question_hi}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setLastResponse(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Interim Transcript Box with Animated Waveform */}
        {(isListening || isProcessing || interimTranscript) && (
          <div className="mb-2.5 w-full max-w-lg bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
              ) : isListening ? (
                /* Sleek Animated Voice Waveform Bar */
                <div className="flex items-center gap-1 shrink-0 h-6 px-1">
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-1" />
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-2" />
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-3" />
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-4" />
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-5" />
                  <span className="w-1 bg-rose-500 rounded-full wave-bar-6" />
                </div>
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                {interimTranscript || (isListening ? "Listening... Speak naturally in Hinglish or Hindi" : "")}
              </span>
            </div>

            {interimTranscript && !isListening && !isProcessing && (
              <button
                onClick={() => handleProcessVoice(interimTranscript)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shrink-0"
              >
                Submit
              </button>
            )}
          </div>
        )}

        {/* Modern Quick Demo Command Chips */}
        <div className="w-full max-w-xl mb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {DEMO_PILLS.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handlePillClick(pill)}
              disabled={isProcessing}
              className="whitespace-nowrap px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 rounded-full shadow-xs active:scale-95 transition shrink-0 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{pill}</span>
            </button>
          ))}
        </div>

        {/* Hero Mic Dock Button */}
        <div className="relative flex items-center gap-2.5">
          {/* Manual Type Toggle Button */}
          <button
            onClick={() => setShowManualBox(!showManualBox)}
            title="Type voice command text"
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-md active:scale-95 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          {/* Sleek Silicon Valley Microphone Trigger */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`relative group flex items-center gap-3.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-white font-bold shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              isListening
                ? "bg-rose-600 hover:bg-rose-700 animate-voice-listening ring-4 ring-rose-400/20"
                : "bg-slate-900 hover:bg-slate-800 animate-voice-idle ring-4 ring-slate-900/10"
            }`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-4 h-4 text-white animate-pulse" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              )}
            </div>

            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold tracking-tight font-sans">
                {isProcessing
                  ? "AI Processing..."
                  : isListening
                  ? "Listening... Tap to Stop"
                  : "Tap to Speak"}
              </div>
              <div className="text-[10px] text-slate-300 font-normal">
                Supports Hinglish &amp; Hindi Voice
              </div>
            </div>

            {/* Waveform mini visualizer on button right when active */}
            {isListening && (
              <div className="flex items-center gap-0.5 h-4 ml-1">
                <span className="w-0.5 bg-white/80 rounded-full wave-bar-1" />
                <span className="w-0.5 bg-white/80 rounded-full wave-bar-3" />
                <span className="w-0.5 bg-white/80 rounded-full wave-bar-5" />
              </div>
            )}
          </button>
        </div>

        {/* Optional Manual Text Box */}
        {showManualBox && (
          <form
            onSubmit={handleManualSubmit}
            className="mt-3 w-full max-w-md flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in duration-150"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. Sharma ji ke 2 kilo aata udhaar likh de"
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
