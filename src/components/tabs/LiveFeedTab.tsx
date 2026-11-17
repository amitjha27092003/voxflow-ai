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
  Receipt,
  Layers,
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
    const message = formatWhatsAppBill(tx, balance);
    openWhatsAppLink(tx.customerPhone || "919876543210", message);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or item..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
          />
        </div>

        {/* Filter Pills with Tactile feedback */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] ${
              filterType === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType("UDHAAR")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
              filterType === "JAMA"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Payment (Jama)
          </button>
          <button
            onClick={() => setFilterType("EXPENSE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
              filterType === "EXPENSE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/50"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Expenses
          </button>
        </div>
      </div>

      {/* Transaction Stream */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                className={`group bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-300 ${
                  isLatest ? "animate-slide-down-spring ring-2 ring-emerald-500/20" : ""
                }`}
              >
                {/* Header row: Customer / Expense + Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Icon Avatar */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isExpense
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : isSplit
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          : isUdhaar
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
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
                          className={`font-bold text-sm sm:text-base text-slate-900 ${
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
                            <span className="text-amber-700 font-semibold">{tx.expenseCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount + Badge */}
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-extrabold tracking-tight font-sans tabular-nums ${
                        isExpense
                          ? "text-amber-600"
                          : isSplit
                          ? "text-indigo-600"
                          : isUdhaar
                          ? "text-rose-600"
                          : "text-emerald-600"
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
                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                          : isSplit
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : isUdhaar
                          ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
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
                  <div className="mt-3 flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-indigo-900 font-medium">
                    <span className="tabular-nums">
                      Settled: <strong>₹{tx.splitDetails.paidAmount}</strong> via{" "}
                      {tx.splitDetails.paymentMode || "UPI"}
                    </span>
                    <span className="text-rose-600 font-bold tabular-nums">
                      Pending Credit: +₹{tx.splitDetails.udhaarAmount}
                    </span>
                  </div>
                )}

                {/* Spoken voice transcript chip */}
                {tx.rawVoiceTranscript && (
                  <div className="mt-3 flex items-center gap-2 bg-slate-50/80 border border-slate-200/70 rounded-xl px-3 py-2 text-xs text-slate-600">
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
                      {tx.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="flex items-center justify-between text-xs bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/60"
                        >
                          <span className="font-medium text-slate-800">
                            {item.name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({item.qty} {item.unit})
                            </span>
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions row: WhatsApp Send Receipt / Expense indicator */}
                {!isExpense && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs active:scale-[0.98] transition duration-150"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        <span>UPI QR</span>
                      </button>
                      <button
                        onClick={() => handleWhatsAppParchi(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 shadow-xs active:scale-[0.98] transition duration-150"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
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
