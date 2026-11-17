"use client";

import React, { useState } from "react";
import { Mic, RotateCcw, Store, CheckCircle2, Sparkles } from "lucide-react";

interface HeaderProps {
  onResetData: () => void;
  isListening: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onResetData, isListening }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    onResetData();
    setShowConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2400);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800">
            <Mic className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
                VoxFlow <span className="text-emerald-600 font-extrabold">AI</span>
              </h1>
              {/* Voice active badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Hinglish Voice Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              Gupta Kirana Store • Voice Retail OS
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {resetSuccess ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Demo Reset Complete
            </span>
          ) : null}

          <button
            onClick={() => setShowConfirm(true)}
            title="Reset Demo Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xs:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal in 100% Modern English */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              Reset Demo State?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              This will restore all default customer balances (Sharma Ji, Rahul Verma, etc.), inventory counts, and recent ledger entries to initial settings.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
