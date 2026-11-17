"use client";

import React, { useState, useEffect } from "react";
import { Customer, InventoryItem, Transaction, VoiceProcessResponse, StoreProfile } from "@/types";
import {
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
} from "@/data/seedData";
import { DEFAULT_STORE_PROFILE } from "@/utils/whatsapp";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { TabsNav, TabType } from "@/components/TabsNav";
import { LiveFeedTab } from "@/components/tabs/LiveFeedTab";
import { CustomersTab } from "@/components/tabs/CustomersTab";
import { InventoryTab } from "@/components/tabs/InventoryTab";
import { RecoveryInsightsTab } from "@/components/tabs/RecoveryInsightsTab";
import { VoiceDock } from "@/components/VoiceDock";
import { UPIQRModal } from "@/components/UPIQRModal";
import { StoreSettingsModal } from "@/components/StoreSettingsModal";
import { Sparkles, Undo2, X } from "lucide-react";

const STORAGE_KEY_CUSTOMERS = "voxflow_customers_v1";
const STORAGE_KEY_INVENTORY = "voxflow_inventory_v1";
const STORAGE_KEY_TRANSACTIONS = "voxflow_transactions_v1";
const STORAGE_KEY_STORE_PROFILE = "voxflow_store_profile_v1";

interface ActiveInsight {
  query: string;
  answer: string;
  data?: any;
}

export default function Home() {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  const [upiModalState, setUpiModalState] = useState<{
    isOpen: boolean;
    customerName: string;
    amount: number;
  }>({
    isOpen: false,
    customerName: "",
    amount: 0,
  });

  // Initialize from localStorage safely on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const storedProfile = localStorage.getItem(STORAGE_KEY_STORE_PROFILE);
      const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      const storedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY);
      const storedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

      if (storedProfile) setStoreProfile(JSON.parse(storedProfile));
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
      localStorage.setItem(STORAGE_KEY_STORE_PROFILE, JSON.stringify(storeProfile));
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [storeProfile, customers, inventory, transactions, isClient]);

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

  // Start Blank Store (Clear sample data for real shopkeepers)
  const handleClearSampleData = () => {
    setCustomers([]);
    setTransactions([]);
    setActiveInsight(null);
    setUndoToast("Sample demo data cleared. Your store is now ready for your real customers.");
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([]));
    } catch (e) {
      console.warn("Error clearing sample data in localStorage:", e);
    }
  };

  // Save Store Profile
  const handleSaveStoreProfile = (updatedProfile: StoreProfile) => {
    setStoreProfile(updatedProfile);
    setUndoToast(`Store profile saved: ${updatedProfile.storeName}`);
  };

  // Update Customer
  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    setUndoToast(`Updated customer: ${updatedCust.name}`);
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

  // Voice AI Action Handler (Transactions, Undo, Conversational Analytics, Store Config)
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
        answer: response.query_answer_hi || response.voiceFeedback || "Query computed successfully.",
        data: response.insight_data,
      });
      return;
    }

    // 3. Handle RESTOCK Intent (Incoming inventory deliveries)
    if (response.intent === "RESTOCK" && response.restock_items && response.restock_items.length > 0) {
      let updatedInventory = [...inventory];
      const restockedSummaries: string[] = [];

      response.restock_items.forEach((restock) => {
        const match = findMatchingInventoryItem(restock.name);
        if (match) {
          updatedInventory = updatedInventory.map((item) =>
            item.id === match.id ? { ...item, stock: item.stock + (restock.qty || 1) } : item
          );
          restockedSummaries.push(`+${restock.qty} ${restock.unit || match.unit} ${match.name}`);
        } else {
          const newSku: InventoryItem = {
            id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: restock.name,
            unitPrice: 50,
            stock: restock.qty || 10,
            unit: restock.unit || "kg",
            category: "General",
          };
          updatedInventory.push(newSku);
          restockedSummaries.push(`+${restock.qty} ${restock.unit || "kg"} ${restock.name} (New SKU)`);
        }
      });

      setInventory(updatedInventory);
      setUndoToast(`Inventory restocked: ${restockedSummaries.join(", ")}`);
      setActiveInsight({
        query: rawTranscript,
        answer: response.query_answer_hi || `Restocked: ${restockedSummaries.join(", ")}`,
        data: { type: "INVENTORY" },
      });
      setActiveTab("inventory");
      return;
    }

    // 4. Handle EXPENSE Intent (Daily shop expenses & petty cash)
    if (response.intent === "EXPENSE" && response.expense_details) {
      const exp = response.expense_details;
      const newTx: Transaction = {
        id: `tx-exp-${Date.now()}`,
        customerId: "store-expense",
        customerName: `Store Expense: ${exp.title}`,
        customerPhone: "",
        type: "EXPENSE",
        items: [
          {
            name: exp.title,
            qty: 1,
            unit: "unit",
            unit_price: exp.amount,
            total: exp.amount,
          },
        ],
        totalAmount: exp.amount,
        timestamp: new Date().toISOString(),
        rawVoiceTranscript: rawTranscript,
        expenseCategory: exp.category,
      };

      setTransactions((prev) => [newTx, ...prev]);
      setUndoToast(
        `Recorded store expense: ₹${exp.amount.toLocaleString("en-IN")} for ${exp.title}. Net cashflow updated.`
      );
      setActiveInsight({
        query: rawTranscript,
        answer: response.query_answer_hi || `Recorded Expense: ₹${exp.amount} for ${exp.title}`,
        data: { type: "SUMMARY" },
      });
      return;
    }

    // 5. Handle UPDATE_ITEM Intent (Catalog Price Updates & New Product Creation)
    if (response.intent === "UPDATE_ITEM" && response.item_update) {
      const upd = response.item_update;
      let updatedInventory = [...inventory];

      if (upd.action === "CREATE_ITEM") {
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: upd.name,
          unitPrice: upd.unitPrice,
          stock: upd.stock || 20,
          unit: upd.unit || "pack",
          category: upd.category || "General",
        };
        updatedInventory = [newItem, ...updatedInventory];
        setUndoToast(
          `Created new SKU: ${upd.name} at ₹${upd.unitPrice}/${upd.unit || "pack"} with 20 units stock.`
        );
      } else {
        const match = findMatchingInventoryItem(upd.name);
        if (match) {
          updatedInventory = updatedInventory.map((item) =>
            item.id === match.id ? { ...item, unitPrice: upd.unitPrice } : item
          );
          setUndoToast(`Updated price: ${match.name} to ₹${upd.unitPrice}/${match.unit}`);
        } else {
          setUndoToast(`Could not find product "${upd.name}" in catalog to update.`);
        }
      }

      setInventory(updatedInventory);
      setActiveInsight({
        query: rawTranscript,
        answer: response.query_answer_hi || `Catalog updated: ${upd.name} at ₹${upd.unitPrice}`,
        data: { type: "INVENTORY" },
      });
      setActiveTab("inventory");
      return;
    }

    // 6. Handle UPDATE_STORE Intent (Voice Store Customization)
    if (response.intent === "UPDATE_STORE" && response.store_update) {
      const upd = response.store_update;
      const updatedProfile: StoreProfile = {
        storeName: upd.storeName || storeProfile.storeName,
        ownerName: upd.ownerName || storeProfile.ownerName,
        address: upd.address || storeProfile.address,
        timings: upd.timings || storeProfile.timings,
        upiId: upd.upiId || storeProfile.upiId,
        phone: upd.phone || storeProfile.phone,
      };

      setStoreProfile(updatedProfile);
      setUndoToast(`Store profile updated: ${updatedProfile.storeName}`);
      setActiveInsight({
        query: rawTranscript,
        answer: `Store settings updated: ${updatedProfile.storeName} • Address: ${updatedProfile.address} • UPI ID: ${updatedProfile.upiId}`,
        data: { type: "SUMMARY" },
      });
      return;
    }

    // 7. Handle TRANSACTION Intent
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
      const isSplit = action.transaction_type === "SPLIT";
      const amount = action.total_amount || 0;

      if (isSplit && action.split_details) {
        // Only the unpaid portion increases customer balance
        targetCustomer.balance += action.split_details.udhaar_amount;
      } else if (isUdhaar) {
        targetCustomer.balance += amount;
      } else if (action.transaction_type === "JAMA") {
        targetCustomer.balance = Math.max(0, targetCustomer.balance - amount);
      }
      targetCustomer.lastActivity = new Date().toISOString();

      // Deduct Inventory for items sold via voice (both UDHAAR and SPLIT)
      if ((isUdhaar || isSplit) && action.items && action.items.length > 0) {
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
        splitDetails:
          isSplit && action.split_details
            ? {
                paidAmount: action.split_details.paid_amount,
                udhaarAmount: action.split_details.udhaar_amount,
                paymentMode: action.split_details.payment_mode || "UPI",
              }
            : undefined,
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

  // Open Instant UPI QR Code Modal
  const handleOpenUPIQR = (customerName: string, amount: number) => {
    setUpiModalState({
      isOpen: true,
      customerName,
      amount,
    });
  };

  // KPI Calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransactions = transactions.filter(
    (t) => new Date(t.timestamp).getTime() >= todayStart.getTime()
  );

  const todaySales = todayTransactions
    .filter((t) => t.type === "UDHAAR" || t.type === "SPLIT")
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const todayJama =
    todayTransactions
      .filter((t) => t.type === "JAMA")
      .reduce((acc, t) => acc + t.totalAmount, 0) +
    todayTransactions
      .filter((t) => t.type === "SPLIT" && t.splitDetails)
      .reduce((acc, t) => acc + (t.splitDetails?.paidAmount || 0), 0);

  const todayExpenses = todayTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const totalUdhaar = customers.reduce(
    (acc, c) => acc + (c.balance > 0 ? c.balance : 0),
    0
  );

  const lowStockCount = inventory.filter((i) => i.stock <= 5).length;
  const overdueCount = customers.filter((c) => c.balance > 500).length;

  return (
    <main className="min-h-screen pb-56 sm:pb-64">
      {/* Header with storeProfile and settings trigger */}
      <Header
        onResetData={handleResetData}
        isListening={isListening}
        storeProfile={storeProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Top 4 KPI Cards */}
      <KPICards
        todaySales={todaySales}
        totalUdhaar={totalUdhaar}
        todayJama={todayJama}
        lowStockCount={lowStockCount}
        todayExpenses={todayExpenses}
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
          <div className="bg-rose-50/95 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl p-3.5 mb-4 shadow-sm flex items-center justify-between gap-3 animate-float-in">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Undo2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{undoToast}</span>
            </div>
            <button
              onClick={() => setUndoToast(null)}
              className="p-1 text-rose-400 hover:text-rose-700 rounded-lg active:scale-[0.98] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Highlighted Conversational Business Insight Card */}
        {activeInsight && (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 mb-4 shadow-xl border border-white/10 relative overflow-hidden animate-float-in">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
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
                  <div className="text-sm font-semibold text-slate-100 mt-1 whitespace-pre-line leading-relaxed font-sans">
                    {activeInsight.answer}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveInsight(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl active:scale-[0.98] transition"
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
            onOpenUPIQR={handleOpenUPIQR}
            storeProfile={storeProfile}
          />
        )}

        {activeTab === "customers" && (
          <CustomersTab
            customers={customers}
            transactions={transactions}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            selectedCustomerId={selectedCustomerId}
            onOpenUPIQR={handleOpenUPIQR}
            storeProfile={storeProfile}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryTab
            inventory={inventory}
            onUpdateStock={handleUpdateStock}
            onAddItem={handleAddInventoryItem}
            filterLowStockInitial={filterLowStockInitial}
            storeProfile={storeProfile}
          />
        )}

        {activeTab === "recovery" && (
          <RecoveryInsightsTab
            customers={customers}
            transactions={transactions}
            inventory={inventory}
            onSelectCustomer={handleSelectCustomer}
            storeProfile={storeProfile}
          />
        )}
      </div>

      {/* Instant UPI Payment QR Code Modal */}
      <UPIQRModal
        isOpen={upiModalState.isOpen}
        onClose={() => setUpiModalState((prev) => ({ ...prev, isOpen: false }))}
        customerName={upiModalState.customerName}
        amount={upiModalState.amount}
        storeProfile={storeProfile}
      />

      {/* Store Profile & SaaS Settings Modal */}
      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        storeProfile={storeProfile}
        onSaveProfile={handleSaveStoreProfile}
        onClearSampleData={handleClearSampleData}
      />

      {/* Sticky Bottom Voice Dock */}
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
