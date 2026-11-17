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
      {/* 1. Today's Revenue & Net Cashflow */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s Revenue
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
          ₹{todaySales.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Net Profit: ₹{netProfit.toLocaleString("en-IN")}</span>
          </div>
          {todayExpenses > 0 && (
            <span className="text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded font-semibold text-[10px]">
              -₹{todayExpenses.toLocaleString("en-IN")} Exp
            </span>
          )}
        </div>
      </div>

      {/* 2. Pending Credit (Udhaar) - Rose/Crimson accent */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-rose-200 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Pending Credit (Udhaar)
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-rose-600 tracking-tight font-sans">
          ₹{totalUdhaar.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium truncate">
          Active balance to be collected
        </div>
      </div>

      {/* 3. Collected Today - Emerald accent */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Collected Today
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight font-sans">
          ₹{todayJama.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium truncate">
          Cash &amp; UPI settlements
        </div>
      </div>

      {/* 4. Low Stock Alerts - Amber accent */}
      <div
        onClick={onFilterLowStock}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Low Stock Alerts
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight font-sans flex items-baseline gap-1.5">
          {lowStockCount} <span className="text-xs font-medium text-slate-400">SKUs</span>
        </div>
        <div className="mt-2 text-[11px] text-amber-700 font-medium truncate">
          {lowStockCount > 0 ? "Items at or under 5 units" : "All product stock healthy"}
        </div>
      </div>
    </div>
  );
};
