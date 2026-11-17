"use client";

import React, { useState, useEffect } from "react";
import { Customer, InventoryItem, Transaction, VoiceProcessResponse } from "@/types";
import {
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
} from "@/data/seedData";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { TabsNav, TabType } from "@/components/TabsNav";
import { LiveFeedTab } from "@/components/tabs/LiveFeedTab";
import { CustomersTab } from "@/components/tabs/CustomersTab";
import { InventoryTab } from "@/components/tabs/InventoryTab";
import { RecoveryInsightsTab } from "@/components/tabs/RecoveryInsightsTab";
import { VoiceDock } from "@/components/VoiceDock";
import { Sparkles, Undo2, X } from "lucide-react";

const STORAGE_KEY_CUSTOMERS = "voxflow_customers_v1";
const STORAGE_KEY_INVENTORY = "voxflow_inventory_v1";
const STORAGE_KEY_TRANSACTIONS = "voxflow_transactions_v1";

interface ActiveInsight {
  query: string;
  answer: string;
  data?: any;
}

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filterLowStockInitial, setFilterLowStockInitial] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeInsight, setActiveInsight] = useState<ActiveInsight | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  // Initialize from localStorage safely on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      const storedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY);
      const storedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      if (storedInventory) setInventory(JSON.parse(storedInventory));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    } catch (e) {
      console.warn("Could not load from localStorage, using initial seed data:", e);
    }
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [customers, inventory, transactions, isClient]);

  // Reset Demo Data handler
  const handleResetData = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setInventory(INITIAL_INVENTORY);
    setTransactions(INITIAL_TRANSACTIONS);
    setActiveInsight(null);
    setUndoToast(null);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    } catch (e) {
      console.warn("Error resetting localStorage:", e);
    }
  };

  // Helper to match inventory item name fuzzily
  const findMatchingInventoryItem = (itemName: string): InventoryItem | undefined => {
    const q = itemName.toLowerCase().trim();
    return inventory.find((inv) => {
      const invName = inv.name.toLowerCase();
      if (invName.includes(q) || q.includes(invName)) return true;
      if (inv.aliases && inv.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
        return true;
      }
      return false;
    });
  };

  // Voice AI Action Handler (Transactions, Undo, Conversational Analytics)
  const handleVoiceSuccess = (response: VoiceProcessResponse, rawTranscript: string) => {
    // 1. Handle UNDO_LAST Intent
    if (response.intent === "UNDO_LAST") {
      if (transactions.length === 0) {
        setUndoToast("No previous transactions found to revert.");
        return;
      }

      const lastTx = transactions[0];
      let updatedCustomers = [...customers];
      let updatedInventory = [...inventory];

      // Revert customer balance
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.id === lastTx.customerId) {
          const newBal =
            lastTx.type === "UDHAAR"
              ? Math.max(0, c.balance - lastTx.totalAmount)
              : c.balance + lastTx.totalAmount;
          return { ...c, balance: newBal, lastActivity: new Date().toISOString() };
        }
        return c;
      });

      // If UDHAAR, revert stock deduction by restoring item quantities
      if (lastTx.type === "UDHAAR" && lastTx.items && lastTx.items.length > 0) {
        lastTx.items.forEach((item) => {
          const match = findMatchingInventoryItem(item.name);
          if (match) {
            updatedInventory = updatedInventory.map((inv) =>
              inv.id === match.id ? { ...inv, stock: inv.stock + item.qty } : inv
            );
          }
        });
      }

      setCustomers(updatedCustomers);
      setInventory(updatedInventory);
      setTransactions((prev) => prev.slice(1));

      const typeLabel = lastTx.type === "UDHAAR" ? "Credit" : "Payment";
      setUndoToast(
        `Cancelled last ${typeLabel} of ₹${lastTx.totalAmount} for ${lastTx.customerName}. Balances & stock restored.`
      );
      return;
    }

    // 2. Handle QUERY Intent (Conversational Business Analytics)
    if (response.intent === "QUERY") {
      setActiveInsight({
        query: rawTranscript,
        answer: response.query_answer_hi || response.voice_response_hi,
        data: response.insight_data,
      });

      // Switch tab intelligently if user asked about stock or debtor
      if (response.insight_data?.type === "INVENTORY") {
        setFilterLowStockInitial(true);
        setActiveTab("inventory");
      } else if (response.insight_data?.type === "DEBTOR") {
        setActiveTab("recovery");
      }
      return;
    }

    // 3. Handle TRANSACTION Intent
    if (!response.actions || response.actions.length === 0) return;

    let updatedCustomers = [...customers];
    let updatedInventory = [...inventory];
    let newTransactions: Transaction[] = [];

    response.actions.forEach((action, idx) => {
      // Resolve Customer
      let targetCustomer = updatedCustomers.find(
        (c) =>
          c.name.toLowerCase().includes(action.customer_name.toLowerCase()) ||
          action.customer_name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!targetCustomer) {
        targetCustomer = {
          id: `cust-${Date.now()}-${idx}`,
          name: action.customer_name,
          phone: `9198765432${Math.floor(10 + Math.random() * 89)}`,
          balance: 0,
          lastActivity: new Date().toISOString(),
        };
        updatedCustomers.push(targetCustomer);
      }

      // Adjust Balance
      const isUdhaar = action.transaction_type === "UDHAAR";
      const amount = action.total_amount || 0;

      if (isUdhaar) {
        targetCustomer.balance += amount;
      } else {
        targetCustomer.balance = Math.max(0, targetCustomer.balance - amount);
      }
      targetCustomer.lastActivity = new Date().toISOString();

      // Deduct Inventory for items sold via voice
      if (isUdhaar && action.items && action.items.length > 0) {
        action.items.forEach((item) => {
          const match = findMatchingInventoryItem(item.name);
          if (match) {
            updatedInventory = updatedInventory.map((inv) =>
              inv.id === match.id
                ? { ...inv, stock: Math.max(0, inv.stock - (item.qty || 1)) }
                : inv
            );
          }
        });
      }

      // Create Transaction Record
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${idx}`,
        customerId: targetCustomer.id,
        customerName: targetCustomer.name,
        customerPhone: targetCustomer.phone,
        type: action.transaction_type,
        items: action.items || [],
        totalAmount: amount,
        timestamp: new Date().toISOString(),
        rawVoiceTranscript: rawTranscript,
      };

      newTransactions.push(newTx);
    });

    setCustomers(updatedCustomers);
    setInventory(updatedInventory);
    setTransactions((prev) => [...newTransactions, ...prev]);
    setUndoToast(null);
  };

  // Stock update from Inventory tab
  const handleUpdateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      )
    );
  };

  // Add Item to inventory
  const handleAddInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
  };

  // Add Customer
  const handleAddCustomer = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  // Navigate to customer details
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab("customers");
  };

  // KPI Calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransactions = transactions.filter(
    (t) => new Date(t.timestamp).getTime() >= todayStart.getTime()
  );

  const todaySales = todayTransactions
    .filter((t) => t.type === "UDHAAR")
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const todayJama = todayTransactions
    .filter((t) => t.type === "JAMA")
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const totalUdhaar = customers.reduce(
    (acc, c) => acc + (c.balance > 0 ? c.balance : 0),
    0
  );

  const lowStockCount = inventory.filter((i) => i.stock <= 5).length;
  const overdueCount = customers.filter((c) => c.balance > 500).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-56 sm:pb-64">
      {/* Header */}
      <Header onResetData={handleResetData} isListening={isListening} />

      {/* Top 4 KPI Cards */}
      <KPICards
        todaySales={todaySales}
        totalUdhaar={totalUdhaar}
        todayJama={todayJama}
        lowStockCount={lowStockCount}
        onFilterLowStock={() => {
          setFilterLowStockInitial(true);
          setActiveTab("inventory");
        }}
      />

      {/* Tab Navigation */}
      <TabsNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "customers") setSelectedCustomerId(null);
          if (tab !== "inventory") setFilterLowStockInitial(false);
        }}
        feedCount={transactions.length}
        customersCount={customers.length}
        lowStockCount={lowStockCount}
        overdueCount={overdueCount}
      />

      {/* Main Tab Content Panels */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        {/* Undo Toast Notification Banner */}
        {undoToast && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3.5 mb-4 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Undo2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{undoToast}</span>
            </div>
            <button
              onClick={() => setUndoToast(null)}
              className="p-1 text-rose-400 hover:text-rose-700 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Highlighted Conversational Business Insight Card */}
        {activeInsight && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-4 shadow-md border border-slate-700/80 relative overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      VoxFlow AI Business Insight
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Query: &ldquo;{activeInsight.query}&rdquo;
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1 whitespace-pre-line leading-relaxed font-sans">
                    {activeInsight.answer}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveInsight(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Dismiss insight"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "live" && (
          <LiveFeedTab
            transactions={transactions}
            customers={customers}
            onSelectCustomer={handleSelectCustomer}
          />
        )}

        {activeTab === "customers" && (
          <CustomersTab
            customers={customers}
            transactions={transactions}
            onAddCustomer={handleAddCustomer}
            selectedCustomerId={selectedCustomerId}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryTab
            inventory={inventory}
            onUpdateStock={handleUpdateStock}
            onAddItem={handleAddInventoryItem}
            filterLowStockInitial={filterLowStockInitial}
          />
        )}

        {activeTab === "recovery" && (
          <RecoveryInsightsTab
            customers={customers}
            transactions={transactions}
            inventory={inventory}
            onSelectCustomer={handleSelectCustomer}
          />
        )}
      </div>

      {/* Sticky Bottom Voice Dock (The Hero Component) */}
      <VoiceDock
        customers={customers}
        inventory={inventory}
        transactions={transactions}
        onVoiceSuccess={handleVoiceSuccess}
        isListening={isListening}
        setIsListening={setIsListening}
      />
    </main>
  );
}
