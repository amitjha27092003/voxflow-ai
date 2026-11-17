"use client";

import React, { useState } from "react";
import { Customer, Transaction } from "@/types";
import { formatWhatsAppReminder, openWhatsAppLink } from "@/utils/whatsapp";
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
} from "lucide-react";

interface CustomersTabProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Customer) => void;
  selectedCustomerId?: string | null;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  transactions,
  onAddCustomer,
  selectedCustomerId,
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

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim() || "919876543200",
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

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
          />
        </div>

        {/* Filter Pills & Add Customer Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterBalance("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterBalance === "ALL" ? "bg-white shadow-xs text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterBalance("DUE")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterBalance === "DUE" ? "bg-rose-500 text-white font-bold" : "text-slate-500"
              }`}
            >
              Pending Dues
            </button>
            <button
              onClick={() => setFilterBalance("ZERO")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterBalance === "ZERO" ? "bg-emerald-600 text-white font-bold" : "text-slate-500"
              }`}
            >
              Settled
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Add Customer&quot; above to register a new account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((cust) => {
            const hasDue = cust.balance > 0;
            const isExpanded = expandedCustomerId === cust.id;
            const customerTxs = transactions.filter((t) => t.customerId === cust.id);

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* Main Card Row */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div
                    onClick={() => toggleExpand(cust.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        hasDue
                          ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                      }`}
                    >
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        {cust.name}
                        {cust.balance === 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                            Settled
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  {/* Balance & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {hasDue ? "Outstanding Credit" : "Account Balance"}
                      </div>
                      <div
                        className={`text-base sm:text-lg font-extrabold tracking-tight font-sans ${
                          hasDue ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        ₹{cust.balance.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* WhatsApp Reminder Button */}
                    {hasDue && (
                      <button
                        onClick={() => handleSendReminder(cust)}
                        title="Send WhatsApp Payment Reminder"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 shadow-xs active:scale-95 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Send Reminder</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(cust.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      aria-label="Toggle history"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Transactions Accordion */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Transaction Ledger ({customerTxs.length})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {customerTxs.length === 0 ? "No records recorded" : "Complete history"}
                      </span>
                    </div>

                    {customerTxs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 italic">
                        No transactions recorded for this customer yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {customerTxs.map((tx) => {
                          const isUdhaar = tx.type === "UDHAAR";
                          return (
                            <div
                              key={tx.id}
                              className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                    isUdhaar
                                      ? "bg-rose-50 text-rose-600"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {isUdhaar ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">
                                    {isUdhaar ? "Credit Sale (Udhaar)" : "Payment Received (Cash/UPI)"}
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
                                className={`font-extrabold text-sm ${
                                  isUdhaar ? "text-rose-600" : "text-emerald-600"
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

      {/* Add Customer Modal in clean modern English */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Customer Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543215"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Opening Credit Balance (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
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
