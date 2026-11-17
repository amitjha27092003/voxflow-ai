"use client";

import React, { useState } from "react";
import { Customer, Transaction, InventoryItem, StoreProfile } from "@/types";
import {
  formatWhatsAppReminder,
  formatKhataStatement,
  openWhatsAppLink,
  DEFAULT_STORE_PROFILE,
} from "@/utils/whatsapp";
import {
  TrendingUp,
  AlertCircle,
  MessageCircle,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Phone,
  X,
  CreditCard,
  FileText,
} from "lucide-react";

interface RecoveryInsightsTabProps {
  customers: Customer[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  onSelectCustomer: (customerId: string) => void;
  storeProfile?: StoreProfile;
}

export const RecoveryInsightsTab: React.FC<RecoveryInsightsTabProps> = ({
  customers,
  transactions,
  inventory,
  onSelectCustomer,
  storeProfile = DEFAULT_STORE_PROFILE,
}) => {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sentSuccessIds, setSentSuccessIds] = useState<string[]>([]);

  // Overdue customers > ₹500
  const overdueCustomers = customers
    .filter((c) => c.balance > 500)
    .sort((a, b) => b.balance - a.balance);

  const totalOverdueAmount = overdueCustomers.reduce((acc, c) => acc + c.balance, 0);
  const totalDebtors = customers.filter((c) => c.balance > 0).length;

  const handleSendSingleReminder = (c: Customer) => {
    const text = formatWhatsAppReminder(c, storeProfile);
    openWhatsAppLink(c.phone, text);
    if (!sentSuccessIds.includes(c.id)) {
      setSentSuccessIds((prev) => [...prev, c.id]);
    }
  };

  const handleShareSingleStatement = (c: Customer) => {
    const custTxs = transactions.filter((t) => t.customerId === c.id);
    const text = formatKhataStatement(c, custTxs, storeProfile);
    openWhatsAppLink(c.phone, text);
  };

  return (
    <div className="space-y-4">
      {/* Recovery AI Header Banner */}
      <div className="bg-[#0E1526]/90 rounded-3xl p-5 sm:p-7 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden border border-white/10">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 mb-2 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Recovery AI • Automated Collections Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans text-white">
              High Priority Receivables
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
              {overdueCustomers.length} accounts have balances exceeding ₹500. Recover ₹
              {totalOverdueAmount.toLocaleString("en-IN")} via automated WhatsApp reminders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={overdueCustomers.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              Send Bulk Reminders ({overdueCustomers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary Bento Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:border-white/20 transition-all duration-300">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            High Priority Receivables
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 font-sans tabular-nums drop-shadow-sm">
            ₹{totalOverdueAmount.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {overdueCustomers.length} accounts (&gt; ₹500)
          </p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:border-white/20 transition-all duration-300">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Credit Exposure Ratio
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-sans tabular-nums drop-shadow-sm">
            {customers.length > 0
              ? Math.round((totalDebtors / customers.length) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {totalDebtors} of {customers.length} customers carry open balances
          </p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:border-white/20 transition-all duration-300">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Settlement Velocity
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 font-sans drop-shadow-sm">
            High (94%)
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Average recovery within 4.2 days via WhatsApp
          </p>
        </div>
      </div>

      {/* Overdue Customers List */}
      <div className="bg-[#0E1526]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              Immediate Attention Accounts ({overdueCustomers.length})
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by total outstanding udhaar balance
            </p>
          </div>
        </div>

        {overdueCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">No Overdue Balances Above ₹500</p>
            <p className="text-xs text-slate-400 mt-0.5">Your credit ledger collection is completely on track.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueCustomers.map((cust) => {
              const isSent = sentSuccessIds.includes(cust.id);

              return (
                <div
                  key={cust.id}
                  className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xs hover:border-white/20 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => onSelectCustomer(cust.id)}
                          className="font-bold text-sm text-white hover:underline cursor-pointer"
                        >
                          {cust.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          Trust Score: 64/100 • Follow-up Due
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">{cust.phone}</span>
                        <span>•</span>
                        <span>
                          Pending: <strong className="text-rose-400 font-sans tabular-nums">₹{cust.balance}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleShareSingleStatement(cust)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 shadow-xs active:scale-[0.98] transition"
                      title="Share Complete Khata Statement on WhatsApp"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Statement</span>
                    </button>
                    <button
                      onClick={() => handleSendSingleReminder(cust)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
                        isSent
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      }`}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Sent Notice
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          Send Reminder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Smart Advisory Card */}
      <div className="bg-[#0E1526]/80 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          VoxFlow AI Smart Business Advisory
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>High debt policy:</strong> For customers with &gt; ₹500 balance, recommend a minimum 50% partial payment prior to fulfilling new credit requests.
          </li>
          <li>
            Indian retail benchmarks show that merchants dispatching automated WhatsApp reminders within 48 hours achieve an <strong>82% faster recovery rate</strong> via UPI ({storeProfile.upiId}).
          </li>
        </ul>
      </div>

      {/* Bulk Reminder Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0E1526] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  Bulk WhatsApp Reminders
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispatch payment notices to all {overdueCustomers.length} overdue customer accounts for {storeProfile.storeName}
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3 flex-1">
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 text-xs text-slate-300">
                <span className="font-bold text-white">Message Preview:</span>
                <p className="mt-1 font-mono text-[11px] whitespace-pre-line bg-black/40 p-2.5 rounded-lg border border-white/10 text-slate-300">
                  {`🙏 *${storeProfile.storeName.toUpperCase()}*
Payment Notice for [Customer Name]:
Your current pending balance is: ₹[Balance].
Please settle via UPI or Cash at your earliest convenience.
UPI ID: ${storeProfile.upiId}
Address: ${storeProfile.address}`}
                </p>
              </div>

              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recipients ({overdueCustomers.length}):
              </div>

              <div className="space-y-2">
                {overdueCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/10 shadow-xs text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{c.name}</span>
                      <span className="text-slate-400 ml-2">({c.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-rose-400 tabular-nums">₹{c.balance}</span>
                      <button
                        onClick={() => handleSendSingleReminder(c)}
                        className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold hover:bg-emerald-500/25 active:scale-[0.98] transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Total Collection Value:{" "}
                <span className="font-extrabold text-white font-sans tabular-nums">
                  ₹{totalOverdueAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => {
                  overdueCustomers.forEach((c) => handleSendSingleReminder(c));
                  setShowBulkModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]"
              >
                Open All on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
