"use client";

import React, { useState } from "react";
import { Customer, Transaction } from "@/types";
import {
  formatWhatsAppReminder,
  formatKhataStatement,
  openWhatsAppLink,
} from "@/utils/whatsapp";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface CustomersTabProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Customer) => void;
  selectedCustomerId?: string | null;
  onOpenUPIQR: (customerName: string, amount: number) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  transactions,
  onAddCustomer,
  selectedCustomerId,
  onOpenUPIQR,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBalance, setFilterBalance] = useState<"ALL" | "DUE" | "ZERO">("ALL");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    selectedCustomerId || null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBalance, setNewBalance] = useState("");

  const filteredCustomers = customers.filter((cust) => {
    if (filterBalance === "DUE" && cust.balance <= 0) return false;
    if (filterBalance === "ZERO" && cust.balance > 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return cust.name.toLowerCase().includes(q) || cust.phone.includes(q);
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let cleanPhone = newPhone.trim().replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    } else if (!cleanPhone) {
      cleanPhone = "919876543200";
    }

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: newName.trim(),
      phone: cleanPhone,
      balance: parseFloat(newBalance) || 0,
      lastActivity: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setNewName("");
    setNewPhone("");
    setNewBalance("");
    setShowAddModal(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  };

  const handleSendReminder = (customer: Customer) => {
    const text = formatWhatsAppReminder(customer);
    openWhatsAppLink(customer.phone, text);
  };

  const handleShareStatement = (customer: Customer) => {
    const custTxs = transactions.filter((t) => t.customerId === customer.id);
    const text = formatKhataStatement(customer, custTxs);
    openWhatsAppLink(customer.phone, text);
  };

  const getCustomerTrust = (balance: number) => {
    if (balance === 0) return { score: 98, label: "Reliable", color: "emerald" };
    if (balance <= 400) return { score: 92, label: "Reliable", color: "emerald" };
    if (balance <= 900) return { score: 78, label: "Moderate", color: "amber" };
    return { score: 64, label: "Follow-up Due", color: "rose" };
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white/[0.04] backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Filter Pills & Add Customer Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl text-xs border border-white/5">
            <button
              onClick={() => setFilterBalance("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition active:scale-[0.98] ${
                filterBalance === "ALL" ? "bg-white/15 text-white font-bold border border-white/10" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterBalance("DUE")}
              className={`px-3 py-1 rounded-lg font-medium transition active:scale-[0.98] ${
                filterBalance === "DUE" ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pending Dues
            </button>
            <button
              onClick={() => setFilterBalance("ZERO")}
              className={`px-3 py-1 rounded-lg font-medium transition active:scale-[0.98] ${
                filterBalance === "ZERO" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Settled
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Accounts Feed */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-[#0E1526]/80 backdrop-blur-xl p-12 rounded-3xl border border-dashed border-white/10 text-center">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Customers Match</h3>
          <p className="text-xs text-slate-400 mt-1">Try another search or register a new customer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((cust) => {
            const isDue = cust.balance > 0;
            const isExpanded = expandedCustomerId === cust.id;
            const custTransactions = transactions.filter((t) => t.customerId === cust.id);
            const trust = getCustomerTrust(cust.balance);

            return (
              <div
                key={cust.id}
                className="bg-[#0E1526]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden"
              >
                {/* Main Customer Summary Card */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDue
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      }`}
                    >
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-white">{cust.name}</h4>
                        {/* Dynamic AI Credit Trust Score Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trust.color === "emerald"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : trust.color === "amber"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Trust Score: {trust.score}/100 • {trust.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          {cust.phone}
                        </span>
                        <span>•</span>
                        <span>
                          Last active:{" "}
                          {cust.lastActivity
                            ? new Date(cust.lastActivity).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance & Action Buttons */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {isDue ? "Pending Balance" : "Account Status"}
                      </div>
                      <div
                        className={`text-lg sm:text-xl font-extrabold tracking-tight font-sans tabular-nums drop-shadow-sm ${
                          isDue ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {isDue ? `₹${cust.balance.toLocaleString("en-IN")}` : "All Clear"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDue && (
                        <>
                          <button
                            onClick={() => onOpenUPIQR(cust.name, cust.balance)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 shadow-2xs active:scale-[0.98] transition"
                            title="Generate Instant UPI Payment QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-300" />
                            <span className="hidden xs:inline">UPI QR</span>
                          </button>
                          <button
                            onClick={() => handleShareStatement(cust)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 shadow-xs active:scale-[0.98] transition"
                            title="Share Complete Khata Statement on WhatsApp"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="hidden xs:inline">Statement</span>
                          </button>
                          <button
                            onClick={() => handleSendReminder(cust)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 shadow-xs active:scale-[0.98] transition"
                            title="Send Payment Reminder on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden xs:inline">Remind</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => toggleExpand(cust.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] active:scale-[0.98] transition"
                        title={isExpanded ? "Collapse history" : "Expand history"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Customer Khata Ledger History */}
                {isExpanded && (
                  <div className="bg-black/30 border-t border-white/10 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Recent Khata Transactions ({custTransactions.length})
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        {cust.name}&apos;s Recorded History
                      </span>
                    </div>

                    {custTransactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        No transactions recorded for this customer yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {custTransactions.map((tx) => {
                          const isUdhaar = tx.type === "UDHAAR";
                          return (
                            <div
                              key={tx.id}
                              className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-2xs flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isUdhaar
                                      ? "bg-rose-500/10 text-rose-400"
                                      : "bg-emerald-500/10 text-emerald-400"
                                  }`}
                                >
                                  {isUdhaar ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-200">
                                    {isUdhaar ? "Credit Given (Udhaar)" : "Payment Received (Cash/UPI)"}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {new Date(tx.timestamp).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {tx.items.length > 0 &&
                                      ` • ${tx.items.map((i) => `${i.name} (${i.qty})`).join(", ")}`}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`font-extrabold text-sm tabular-nums ${
                                  isUdhaar ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {isUdhaar ? "+" : "-"}₹{tx.totalAmount}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal in Obsidian Dark Glass */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0E1526] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Customer Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543215"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Opening Credit Balance (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl active:scale-[0.98] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
