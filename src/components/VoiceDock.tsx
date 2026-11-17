"use client";

import React, { useState, useEffect, useRef } from "react";
import { Customer, InventoryItem, Transaction, VoiceProcessResponse } from "@/types";
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
  Undo2,
} from "lucide-react";

interface VoiceDockProps {
  customers: Customer[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  onVoiceSuccess: (response: VoiceProcessResponse, rawTranscript: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

const DEMO_PILLS = [
  "Sharma ji ke 2 kilo aata aur 1 Amul butter udhaar likh de",
  "Rahul ka 500 ka bill bana, 300 UPI se aur 200 udhaar likh de",
  "Bijli ka bill 1200 rupaye kharch likh de",
  "Cheeni ka rate 46 rupaye kilo kar do",
  "Aadha kilo cheeni aur dedh kilo toor dal udhaar likh do",
  "20 kilo aata aur 10 packet Amul butter stock mein add kar do",
  "Rahul ke 500 rupaye jama kar le",
  "Pichli entry cancel kar do",
  "Sabse zyada udhaar kiska baaki hai?",
  "Kaun sa samaan kam hai?",
  "Aaj ka hisaab batao",
];

export const VoiceDock: React.FC<VoiceDockProps> = ({
  customers,
  inventory,
  transactions,
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
        let isFinalResult = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinalResult = true;
          }
        }
        setInterimTranscript(currentTranscript);

        // Instant Auto-Submit on Final Speech without waiting for browser silence timeout
        if (isFinalResult && currentTranscript.trim()) {
          try {
            recognition.stop();
          } catch {}
          setIsListening(false);
          handleProcessVoice(currentTranscript.trim());
        }
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

    // Subtle audio chime / haptic feedback simulation
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch {}

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/process-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          transcript: transcriptText,
          customers,
          inventory,
          transactions,
        }),
      });

      clearTimeout(timeoutId);

      const data: VoiceProcessResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process voice command");
      }

      setLastResponse(data);

      // 1. Immediately propagate result so UI state and ledger update with ZERO blocking delay
      if (
        (data.intent === "TRANSACTION" && data.actions && data.actions.length > 0) ||
        data.intent === "QUERY" ||
        data.intent === "UNDO_LAST" ||
        data.intent === "RESTOCK" ||
        data.intent === "EXPENSE" ||
        data.intent === "UPDATE_ITEM"
      ) {
        onVoiceSuccess(data, transcriptText);
      }

      // 2. Trigger TTS voice feedback asynchronously right after updating ledger state so UI rendering is never blocked
      const textToSpeak = data.ttsText || data.voiceFeedback;
      if (textToSpeak) {
        setTimeout(() => speakHindi(textToSpeak), 10);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error processing voice:", err);
      if (err.name === "AbortError") {
        setErrorMessage("Request took too long. Retrying locally...");
      } else {
        setErrorMessage(err.message || "Failed to parse voice command. Try again.");
      }
    } finally {
      setIsProcessing(false);
      setInterimTranscript("");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleProcessVoice(manualInput.trim());
      setManualInput("");
      setShowManualBox(false);
    }
  };

  const handlePillClick = (text: string) => {
    setInterimTranscript(text);
    handleProcessVoice(text);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-5 pointer-events-none flex flex-col items-center">
      {/* Dynamic Feedback Toast / AI Result Notification */}
      {lastResponse && (
        <div className="pointer-events-auto max-w-lg w-full mb-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-2xl animate-float-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  lastResponse.intent === "TRANSACTION"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : lastResponse.intent === "UNDO_LAST"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : lastResponse.intent === "RESTOCK"
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                    : lastResponse.intent === "EXPENSE"
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : lastResponse.intent === "UPDATE_ITEM"
                    ? "bg-teal-50 text-teal-600 border border-teal-100"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {lastResponse.intent === "TRANSACTION" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : lastResponse.intent === "UNDO_LAST" ? (
                  <Undo2 className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Voice AI Copilot
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Confidence: {Math.round(lastResponse.confidence * 100)}%
                  </span>
                </div>
                {/* On-screen Toast UI in Roman Hinglish */}
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 font-sans leading-snug">
                  {lastResponse.voiceFeedback}
                </p>
              </div>
            </div>

            <button
              onClick={() => setLastResponse(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="pointer-events-auto max-w-md w-full mb-3 bg-rose-50/95 backdrop-blur-md border border-rose-200 text-rose-900 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-2 animate-float-in text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Living Voice FinTech Dock Capsule (Frosted Glass with White/10 border) */}
      <div className="pointer-events-auto w-full max-w-2xl bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 sm:p-4 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col items-center gap-3">
        {/* Live Interim Transcript Bubble */}
        {(isListening || interimTranscript) && (
          <div className="w-full bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-inner flex items-center gap-2 text-xs sm:text-sm animate-float-in">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-medium truncate text-slate-200">
              {interimTranscript || "Listening to Hindi / Hinglish..."}
            </span>
          </div>
        )}

        {/* Quick Demo Commands Chip Strip - Frosted chips with subtle hover glow */}
        <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {DEMO_PILLS.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handlePillClick(pill)}
              disabled={isProcessing}
              className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-full shadow-xs active:scale-[0.98] transition-all duration-200 shrink-0 disabled:opacity-40 flex items-center gap-1.5 border backdrop-blur-md ${
                pill.includes("cancel")
                  ? "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60 hover:border-rose-400/50"
                  : pill.includes("hisaab") || pill.includes("zyada") || pill.includes("kam")
                  ? "bg-teal-950/40 text-teal-300 border-teal-500/30 hover:bg-teal-900/60 hover:border-teal-400/50"
                  : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/10 hover:border-white/20"
              }`}
            >
              {pill.includes("cancel") ? (
                <Undo2 className="w-3 h-3 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
              <span>{pill}</span>
            </button>
          ))}
        </div>

        {/* Hero Living Voice AI Mic Dock Button */}
        <div className="relative flex items-center gap-3">
          {/* Manual Type Toggle Button */}
          <button
            onClick={() => setShowManualBox(!showManualBox)}
            title="Type voice command text"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center shadow-md active:scale-[0.98] transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          {/* Living Voice AI Orb & Liquid Waveform Trigger */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`relative group flex items-center gap-3.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-white font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 ${
              isListening
                ? "bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 animate-voice-listening shadow-[0_0_30px_rgba(244,63,94,0.5)] border border-rose-400/50"
                : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-850 hover:to-slate-800 animate-voice-idle border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isListening ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            }`}>
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

            {/* 7 Animated Audio Equalizer Bars when listening */}
            {isListening && (
              <div className="flex items-center gap-1 h-6 px-1.5 ml-1 shrink-0 bg-black/20 rounded-full py-1">
                <span className="w-1 bg-white rounded-full eq-bar-1" />
                <span className="w-1 bg-white rounded-full eq-bar-2" />
                <span className="w-1 bg-white rounded-full eq-bar-3" />
                <span className="w-1 bg-white rounded-full eq-bar-4" />
                <span className="w-1 bg-white rounded-full eq-bar-5" />
                <span className="w-1 bg-white rounded-full eq-bar-6" />
                <span className="w-1 bg-white rounded-full eq-bar-7" />
              </div>
            )}
          </button>
        </div>

        {/* Optional Manual Text Box */}
        {showManualBox && (
          <form
            onSubmit={handleManualSubmit}
            className="mt-1 w-full max-w-md flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-white/10 shadow-2xl animate-float-in"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. Sharma ji ke 2 kilo aata udhaar likh de"
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-slate-800 text-white placeholder-slate-400 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
