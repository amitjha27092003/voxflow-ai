"use client";

import React from "react";
import { TrendingUp, CreditCard, ArrowDownRight, AlertTriangle } from "lucide-react";

interface KPICardsProps {
  todaySales: number;
  totalUdhaar: number;
  todayJama: number;
  lowStockCount: number;
  todayExpenses?: number;
  onFilterLowStock?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  todaySales,
  totalUdhaar,
  todayJama,
  lowStockCount,
  todayExpenses = 0,
  onFilterLowStock,
}) => {
  const netProfit = Math.max(0, todaySales - todayExpenses);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4 max-w-6xl mx-auto px-4 sm:px-6">
      {/* 1. Today's Revenue & Net Cashflow Bento Tile */}
      <div className="relative group bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-emerald-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        {/* Luminous top-border emerald accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s Revenue
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans tabular-nums drop-shadow-sm">
          ₹{todaySales.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]"></span>
            <span className="tabular-nums">Net Profit: ₹{netProfit.toLocaleString("en-IN")}</span>
          </div>
          {todayExpenses > 0 && (
            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-semibold text-[10px] tabular-nums">
              -₹{todayExpenses.toLocaleString("en-IN")} Exp
            </span>
          )}
        </div>
      </div>

      {/* 2. Pending Credit (Udhaar) - Bento Tile with Rose Luminous Accent */}
      <div className="relative group bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-rose-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        {/* Luminous top-border rose accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/0 via-rose-400 to-rose-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-400">
            Pending Credit (Udhaar)
          </span>
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-rose-400 tracking-tight font-sans tabular-nums drop-shadow-sm">
          ₹{totalUdhaar.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 font-medium truncate">
          Active balance to be collected
        </div>
      </div>

      {/* 3. Collected Today - Bento Tile with Electric Teal/Emerald Accent */}
      <div className="relative group bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-teal-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        {/* Luminous top-border teal accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500/0 via-teal-400 to-teal-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Collected Today
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight font-sans tabular-nums drop-shadow-sm">
          ₹{todayJama.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 font-medium truncate">
          Cash &amp; UPI settlements
        </div>
      </div>

      {/* 4. Low Stock Alerts - Bento Tile with Amber Luminous Accent */}
      <div
        onClick={onFilterLowStock}
        className="relative group bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-amber-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
      >
        {/* Luminous top-border amber accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400">
            Low Stock Alerts
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight font-sans tabular-nums flex items-baseline gap-1.5 drop-shadow-sm">
          {lowStockCount} <span className="text-xs font-medium text-slate-400">SKUs</span>
        </div>
        <div className="mt-2.5 text-[11px] text-amber-400/90 font-medium truncate">
          {lowStockCount > 0 ? "Items at or under 5 units" : "All product stock healthy"}
        </div>
      </div>
    </div>
  );
};
