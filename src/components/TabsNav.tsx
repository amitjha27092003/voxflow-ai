"use client";

import React from "react";
import { History, Users, Package, ShieldCheck } from "lucide-react";

export type TabType = "live" | "customers" | "inventory" | "recovery";

interface TabsNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  feedCount: number;
  customersCount: number;
  lowStockCount: number;
  overdueCount: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onChangeTab,
  feedCount,
  customersCount,
  lowStockCount,
  overdueCount,
}) => {
  const tabs = [
    {
      id: "live" as TabType,
      label: "Live Ledger",
      icon: History,
      badge: feedCount > 0 ? feedCount : null,
      badgeColor: "bg-white/10 text-slate-200 border border-white/10",
    },
    {
      id: "customers" as TabType,
      label: "Customers",
      icon: Users,
      badge: customersCount,
      badgeColor: "bg-white/10 text-slate-200 border border-white/10",
    },
    {
      id: "inventory" as TabType,
      label: "Inventory",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    },
    {
      id: "recovery" as TabType,
      label: "Recovery AI",
      icon: ShieldCheck,
      badge: overdueCount > 0 ? `${overdueCount} Due` : null,
      badgeColor: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 my-2">
      <div className="flex items-center bg-white/[0.03] backdrop-blur-xl p-1.5 rounded-2xl gap-1.5 overflow-x-auto no-scrollbar border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 min-w-[120px] sm:min-w-0 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white font-bold border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "text-slate-500"
                }`}
              />
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
