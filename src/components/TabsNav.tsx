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
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      id: "customers" as TabType,
      label: "Customers",
      icon: Users,
      badge: customersCount,
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      id: "inventory" as TabType,
      label: "Inventory",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: "bg-amber-50 text-amber-700 border border-amber-200/80",
    },
    {
      id: "recovery" as TabType,
      label: "Recovery AI",
      icon: ShieldCheck,
      badge: overdueCount > 0 ? `${overdueCount} Due` : null,
      badgeColor: "bg-rose-50 text-rose-700 border border-rose-200/80",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 my-2">
      <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar border border-slate-200/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 min-w-[120px] sm:min-w-0 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-slate-900" : "text-slate-400"
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
