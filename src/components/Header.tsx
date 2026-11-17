"use client";

import React, { useState } from "react";
import { StoreProfile } from "@/types";
import { Mic, RotateCcw, Store, CheckCircle2, Settings } from "lucide-react";

interface HeaderProps {
  onResetData: () => void;
  isListening: boolean;
  storeProfile: StoreProfile;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onResetData,
  isListening,
  storeProfile,
  onOpenSettings,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    onResetData();
    setShowConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2400);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-6 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Mic className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                VoxFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-extrabold drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">AI</span>
              </h1>
              {/* Voice active pill badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]"></span>
                Hinglish Voice Active
              </span>
            </div>

            {/* Clickable Store Profile Subtitle */}
            <button
              onClick={onOpenSettings}
              className="text-xs text-slate-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 mt-0.5 group transition"
              title="Click to customize store profile & settings"
            >
              <Store className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
              <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                {storeProfile.storeName}
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">
                {storeProfile.address ? storeProfile.address.split(",")[0] : "Voice Retail OS"}
              </span>
              <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {resetSuccess ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-medium animate-float-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Demo Reset Complete
            </span>
          ) : null}

          {/* Settings Icon Button */}
          <button
            onClick={onOpenSettings}
            title="Store Settings & Multi-Store Profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 shadow-xs active:scale-[0.98] transition duration-150"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Store Settings</span>
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            title="Reset Demo Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 shadow-xs active:scale-[0.98] transition duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xs:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal in Obsidian Dark Glass */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0E1526] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">
              Reset Demo State?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              This will restore all default customer balances (Sharma Ji, Rahul Verma, etc.), inventory counts, and recent ledger entries to initial settings.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl active:scale-[0.98] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition"
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
