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
      <div className="relative group bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-300 overflow-hidden">
        {/* Soft emerald glow accent on top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/80 to-emerald-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s Revenue
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans tabular-nums">
          ₹{todaySales.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="tabular-nums">Net Profit: ₹{netProfit.toLocaleString("en-IN")}</span>
          </div>
          {todayExpenses > 0 && (
            <span className="text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded-md font-semibold text-[10px] tabular-nums">
              -₹{todayExpenses.toLocaleString("en-IN")} Exp
            </span>
          )}
        </div>
      </div>

      {/* 2. Pending Credit (Udhaar) - Bento Tile with Rose Glow */}
      <div className="relative group bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.05)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(244,63,94,0.1)] hover:border-rose-200/90 transition-all duration-300 overflow-hidden">
        {/* Soft rose glow accent on top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500/0 via-rose-500/80 to-rose-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-600">
            Pending Credit (Udhaar)
          </span>
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/80 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-rose-600 tracking-tight font-sans tabular-nums">
          ₹{totalUdhaar.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 font-medium truncate">
          Active balance to be collected
        </div>
      </div>

      {/* 3. Collected Today - Bento Tile with Teal/Emerald Glow */}
      <div className="relative group bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.05)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.1)] hover:border-emerald-200/90 transition-all duration-300 overflow-hidden">
        {/* Soft teal glow accent on top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500/0 via-teal-500/80 to-teal-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Collected Today
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight font-sans tabular-nums">
          ₹{todayJama.toLocaleString("en-IN")}
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 font-medium truncate">
          Cash &amp; UPI settlements
        </div>
      </div>

      {/* 4. Low Stock Alerts - Bento Tile with Amber Glow */}
      <div
        onClick={onFilterLowStock}
        className="relative group bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.12)] hover:border-amber-300 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
      >
        {/* Soft amber glow accent on top edge */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500/0 via-amber-500/80 to-amber-500/0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700">
            Low Stock Alerts
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight font-sans tabular-nums flex items-baseline gap-1.5">
          {lowStockCount} <span className="text-xs font-medium text-slate-400">SKUs</span>
        </div>
        <div className="mt-2.5 text-[11px] text-amber-700 font-medium truncate">
          {lowStockCount > 0 ? "Items at or under 5 units" : "All product stock healthy"}
        </div>
      </div>
    </div>
  );
};
