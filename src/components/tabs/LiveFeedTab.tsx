"use client";

import React, { useState } from "react";
import { Transaction, Customer } from "@/types";
import { formatWhatsAppBill, openWhatsAppLink } from "@/utils/whatsapp";
import {
  Share2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Mic,
  Search,
  MessageCircle,
  QrCode,
} from "lucide-react";

interface LiveFeedTabProps {
  transactions: Transaction[];
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
  onOpenUPIQR: (customerName: string, amount: number) => void;
}

export const LiveFeedTab: React.FC<LiveFeedTabProps> = ({
  transactions,
  customers,
  onSelectCustomer,
  onOpenUPIQR,
}) => {
  const [filterType, setFilterType] = useState<"ALL" | "UDHAAR" | "JAMA">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions
    .filter((tx) => {
      if (filterType !== "ALL" && tx.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.customerName.toLowerCase().includes(q);
        const matchesItems = tx.items.some((i) => i.name.toLowerCase().includes(q));
        return matchesName || matchesItems;
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleWhatsAppParchi = (tx: Transaction) => {
    const customer = customers.find((c) => c.id === tx.customerId);
    const balance = customer ? customer.balance : tx.totalAmount;
    const message = formatWhatsAppBill(tx, balance);
    openWhatsAppLink(tx.customerPhone || "919876543210", message);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or item..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filterType === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType("UDHAAR")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
              filterType === "UDHAAR"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Credit (Udhaar)
          </button>
          <button
            onClick={() => setFilterType("JAMA")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
              filterType === "JAMA"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Payment (Jama)
          </button>
        </div>
      </div>

      {/* Transaction Stream */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Use the bottom voice microphone or click one of the demo command pills to record an entry.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const isUdhaar = tx.type === "UDHAAR";
            const dateObj = new Date(tx.timestamp);
            const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const dateFormatted = dateObj.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all group"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isUdhaar
                          ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                      }`}
                    >
                      {isUdhaar ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => onSelectCustomer(tx.customerId)}
                        className="text-sm sm:text-base font-bold text-slate-900 hover:text-slate-700 transition text-left flex items-center gap-1.5"
                      >
                        {tx.customerName}
                      </button>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateFormatted}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge & Amount */}
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-extrabold tracking-tight font-sans ${
                        isUdhaar ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isUdhaar ? "+" : "-"}₹{tx.totalAmount.toLocaleString("en-IN")}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide mt-1 uppercase ${
                        isUdhaar
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isUdhaar ? "Credit" : "Payment"}
                    </span>
                  </div>
                </div>

                {/* Spoken voice transcript chip */}
                {tx.rawVoiceTranscript && (
                  <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs text-slate-600">
                    <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                      Voice:
                    </span>
                    <span className="italic truncate text-slate-700">
                      &ldquo;{tx.rawVoiceTranscript}&rdquo;
                    </span>
                  </div>
                )}

                {/* Itemized breakdown list */}
                {tx.items && tx.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Itemized Breakdown:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/60"
                        >
                          <span className="font-medium text-slate-800">
                            {item.name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({item.qty} {item.unit})
                            </span>
                          </span>
                          <span className="font-bold text-slate-900">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions row: WhatsApp Send Receipt */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Phone: {tx.customerPhone || "Not configured"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenUPIQR(tx.customerName, tx.totalAmount)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs active:scale-95 transition"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-600" />
                      <span>UPI QR</span>
                    </button>
                    <button
                      onClick={() => handleWhatsAppParchi(tx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 shadow-xs active:scale-95 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Send Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
