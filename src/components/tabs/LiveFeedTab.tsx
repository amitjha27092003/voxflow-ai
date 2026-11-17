"use client";

import React, { useState } from "react";
import { Transaction, Customer, StoreProfile } from "@/types";
import { formatWhatsAppBill, openWhatsAppLink, DEFAULT_STORE_PROFILE } from "@/utils/whatsapp";
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
  Receipt,
  Layers,
} from "lucide-react";

interface LiveFeedTabProps {
  transactions: Transaction[];
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
  onOpenUPIQR: (customerName: string, amount: number) => void;
  storeProfile?: StoreProfile;
}

export const LiveFeedTab: React.FC<LiveFeedTabProps> = ({
  transactions,
  customers,
  onSelectCustomer,
  onOpenUPIQR,
  storeProfile = DEFAULT_STORE_PROFILE,
}) => {
  const [filterType, setFilterType] = useState<"ALL" | "UDHAAR" | "JAMA" | "EXPENSE">("ALL");
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
    const message = formatWhatsAppBill(tx, balance, storeProfile);
    openWhatsAppLink(tx.customerPhone || "919876543210", message);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar in Obsidian Dark Glass */}
      <div className="bg-white/[0.04] backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or item..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Filter Pills with Glowing Active States */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] ${
              filterType === "ALL"
                ? "bg-white/15 text-white shadow-sm border border-white/20"
                : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType("UDHAAR")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
              filterType === "UDHAAR"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-rose-500/5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Credit (Udhaar)
          </button>
          <button
            onClick={() => setFilterType("JAMA")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
              filterType === "JAMA"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-emerald-500/5 text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Payment (Jama)
          </button>
          <button
            onClick={() => setFilterType("EXPENSE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
              filterType === "EXPENSE"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-amber-500/5 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Expenses
          </button>
        </div>
      </div>

      {/* Transaction Stream */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-[#0E1526]/80 backdrop-blur-xl p-12 rounded-3xl border border-dashed border-white/10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] text-slate-400 flex items-center justify-center mx-auto mb-3 border border-white/10">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Transactions Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Speak using the voice dock below (e.g. &ldquo;Sharma ji ke 2 kilo cheeni udhaar likh de&rdquo;) or select a demo command.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx, idx) => {
            const isUdhaar = tx.type === "UDHAAR";
            const isJama = tx.type === "JAMA";
            const isExpense = tx.type === "EXPENSE";
            const isSplit = tx.type === "SPLIT";
            const isLatest = idx === 0;

            return (
              <div
                key={tx.id}
                className={`group bg-[#0E1526]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 ${
                  isLatest ? "animate-slide-down-spring ring-2 ring-emerald-500/30" : ""
                }`}
              >
                {/* Header row: Customer / Expense + Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Icon Avatar */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isExpense
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : isSplit
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                          : isUdhaar
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      }`}
                    >
                      {isExpense ? (
                        <Receipt className="w-5 h-5" />
                      ) : isSplit ? (
                        <Layers className="w-5 h-5" />
                      ) : isUdhaar ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => {
                            if (!isExpense && tx.customerId) onSelectCustomer(tx.customerId);
                          }}
                          className={`font-bold text-sm sm:text-base text-white ${
                            !isExpense ? "hover:underline cursor-pointer" : ""
                          }`}
                        >
                          {tx.customerName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(tx.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(tx.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {isExpense && tx.expenseCategory && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">{tx.expenseCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount + Badge */}
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-extrabold tracking-tight font-sans tabular-nums drop-shadow-sm ${
                        isExpense
                          ? "text-amber-400"
                          : isSplit
                          ? "text-indigo-400"
                          : isUdhaar
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {isExpense
                        ? `-₹${tx.totalAmount.toLocaleString("en-IN")}`
                        : isUdhaar
                        ? `+₹${tx.totalAmount.toLocaleString("en-IN")}`
                        : isSplit
                        ? `₹${tx.totalAmount.toLocaleString("en-IN")}`
                        : `-₹${tx.totalAmount.toLocaleString("en-IN")}`}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isExpense
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : isSplit
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : isUdhaar
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isExpense
                        ? "Expense"
                        : isSplit
                        ? "Split Pay"
                        : isUdhaar
                        ? "Credit"
                        : "Payment"}
                    </span>
                  </div>
                </div>

                {/* Split details chip if applicable */}
                {isSplit && tx.splitDetails && (
                  <div className="mt-3 flex items-center justify-between bg-indigo-500/10 border border-indigo-500/25 rounded-xl px-3 py-1.5 text-xs text-indigo-200 font-medium">
                    <span className="tabular-nums">
                      Settled: <strong>₹{tx.splitDetails.paidAmount}</strong> via{" "}
                      {tx.splitDetails.paymentMode || "UPI"}
                    </span>
                    <span className="text-rose-400 font-bold tabular-nums">
                      Pending Credit: +₹{tx.splitDetails.udhaarAmount}
                    </span>
                  </div>
                )}

                {/* Spoken voice transcript chip */}
                {tx.rawVoiceTranscript && (
                  <div className="mt-3 flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                      Voice:
                    </span>
                    <span className="italic truncate text-slate-200">
                      &ldquo;{tx.rawVoiceTranscript}&rdquo;
                    </span>
                  </div>
                )}

                {/* Itemized breakdown list */}
                {tx.items && tx.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Itemized Breakdown:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tx.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="flex items-center justify-between text-xs bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5"
                        >
                          <span className="font-medium text-slate-200">
                            {item.name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({item.qty} {item.unit})
                            </span>
                          </span>
                          <span className="font-bold text-white tabular-nums">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions row: WhatsApp Send Receipt / Expense indicator */}
                {!isExpense && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Phone: {tx.customerPhone || "Not configured"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onOpenUPIQR(
                            tx.customerName,
                            isSplit && tx.splitDetails
                              ? tx.splitDetails.udhaarAmount
                              : tx.totalAmount
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 shadow-2xs active:scale-[0.98] transition duration-150"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-300" />
                        <span>UPI QR</span>
                      </button>
                      <button
                        onClick={() => handleWhatsAppParchi(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-[0.98] transition duration-150"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Send Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
