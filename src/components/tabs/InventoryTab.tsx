"use client";

import React, { useState } from "react";
import { InventoryItem } from "@/types";
import {
  formatDistributorOrder,
  formatStoreRateList,
  openWhatsAppLink,
} from "@/utils/whatsapp";
import {
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  PlusCircle,
  Tag,
  X,
  MessageCircle,
  Share2,
} from "lucide-react";

interface InventoryTabProps {
  inventory: InventoryItem[];
  onUpdateStock: (id: string, delta: number) => void;
  onAddItem: (item: InventoryItem) => void;
  filterLowStockInitial?: boolean;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  onUpdateStock,
  onAddItem,
  filterLowStockInitial = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(filterLowStockInitial);
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form state
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("General");

  const lowStockItems = inventory.filter((item) => item.stock <= 5);

  const handleOrderLowStockWhatsApp = () => {
    if (lowStockItems.length === 0) return;
    const msg = formatDistributorOrder(lowStockItems);
    openWhatsAppLink("919876543299", msg);
  };

  const handleShareRateListWhatsApp = () => {
    const msg = formatStoreRateList(inventory);
    openWhatsAppLink("919876543210", msg);
  };

  const filteredInventory = inventory.filter((item) => {
    if (onlyLowStock && item.stock > 5) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchAliases = item.aliases?.some((a) => a.toLowerCase().includes(q));
      return matchName || matchCat || matchAliases;
    }
    return true;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: "inv-" + Date.now(),
      name: name.trim(),
      unitPrice: parseFloat(unitPrice) || 0,
      stock: parseInt(stock, 10) || 0,
      unit: unit.trim() || "kg",
      category: category.trim() || "General",
    };

    onAddItem(newItem);
    setName("");
    setUnitPrice("");
    setStock("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white/[0.04] backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by name, category, or alias..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Filter Pills, Share Rate-List & Add Item */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareRateListWhatsApp}
            title="Broadcast Store Price List to Customers on WhatsApp"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 shadow-2xs transition active:scale-[0.98]"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Share Rate-List</span>
          </button>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition active:scale-[0.98] flex items-center gap-1.5 ${
              onlyLowStock
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "bg-amber-500/5 text-amber-400/80 border-amber-500/20 hover:bg-amber-500/10"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock ({lowStockItems.length})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Product SKU</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner with WhatsApp Restock CTA */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-float-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                Low Inventory Alert: {lowStockItems.length} Products Need Restocking
              </h4>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Items with 5 or fewer units in stock:{" "}
                <span className="font-semibold text-amber-300">
                  {lowStockItems.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(", ")}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleOrderLowStockWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-[0.98] transition shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Order Low Stock via WhatsApp
          </button>
        </div>
      )}

      {/* Inventory Grid in Obsidian Glass */}
      {filteredInventory.length === 0 ? (
        <div className="bg-[#0E1526]/80 backdrop-blur-xl p-12 rounded-3xl border border-dashed border-white/10 text-center">
          <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Catalog Items Match</h3>
          <p className="text-xs text-slate-400 mt-1">Try another search or register a new product SKU.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredInventory.map((item) => {
            const isLow = item.stock <= 5;
            return (
              <div
                key={item.id}
                className={`bg-[#0E1526]/90 backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${
                  isLow ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.05] text-slate-300 border border-white/5 mb-1.5">
                      {item.category || "General"}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug">
                      {item.name}
                    </h4>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Standard unit: <span className="font-medium text-slate-300">{item.unit}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-white font-sans tabular-nums drop-shadow-sm">
                      ₹{item.unitPrice}
                    </div>
                    <span className="text-[10px] text-slate-400">per {item.unit}</span>
                  </div>
                </div>

                {/* Stock Level Control */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg border tabular-nums ${
                        isLow
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {item.stock} {item.unit} in stock
                    </span>
                    {isLow && (
                      <span className="text-[10px] text-amber-400 font-semibold">Low</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateStock(item.id, -1)}
                      disabled={item.stock <= 0}
                      className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center font-bold disabled:opacity-20 active:scale-[0.98] transition border border-white/10"
                      title="Decrease stock count"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateStock(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold active:scale-[0.98] transition shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      title="Add stock count"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0E1526] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Product SKU</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parle-G Biscuit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#0E1526] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="kg">kg</option>
                    <option value="pack">pack</option>
                    <option value="L">L</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Snacks"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
