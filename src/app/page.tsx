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

const STORAGE_KEY_CUSTOMERS = "voxflow_customers_v1";
const STORAGE_KEY_INVENTORY = "voxflow_inventory_v1";
const STORAGE_KEY_TRANSACTIONS = "voxflow_transactions_v1";

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filterLowStockInitial, setFilterLowStockInitial] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);

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

  // Voice AI Action Handler
  const handleVoiceSuccess = (response: VoiceProcessResponse, rawTranscript: string) => {
    if (!response.actions || response.actions.length === 0) return;

    let updatedCustomers = [...customers];
    let updatedInventory = [...inventory];
    let newTransactions: Transaction[] = [];

    response.actions.forEach((action, idx) => {
      // 1. Resolve Customer
      let targetCustomer = updatedCustomers.find(
        (c) =>
          c.name.toLowerCase().includes(action.customer_name.toLowerCase()) ||
          action.customer_name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!targetCustomer) {
        // Auto-create new customer
        targetCustomer = {
          id: `cust-${Date.now()}-${idx}`,
          name: action.customer_name,
          phone: `9198765432${Math.floor(10 + Math.random() * 89)}`,
          balance: 0,
          lastActivity: new Date().toISOString(),
        };
        updatedCustomers.push(targetCustomer);
      }

      // 2. Adjust Balance
      const isUdhaar = action.transaction_type === "UDHAAR";
      const amount = action.total_amount || 0;

      if (isUdhaar) {
        targetCustomer.balance += amount;
      } else {
        // JAMA (Payment received)
        targetCustomer.balance = Math.max(0, targetCustomer.balance - amount);
      }
      targetCustomer.lastActivity = new Date().toISOString();

      // 3. Deduct Inventory for items sold via voice
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

      // 4. Create Transaction Record
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
    <main className="min-h-screen bg-[#F8FAFC] pb-48 sm:pb-52">
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
        onVoiceSuccess={handleVoiceSuccess}
        isListening={isListening}
        setIsListening={setIsListening}
      />
    </main>
  );
}
