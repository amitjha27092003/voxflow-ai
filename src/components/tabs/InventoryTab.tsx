"use client";

import React, { useState } from "react";
import { InventoryItem } from "@/types";
import { formatDistributorOrder, openWhatsAppLink } from "@/utils/whatsapp";
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
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by name, category, or alias..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
          />
        </div>

        {/* Filter Pills & Add Item */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              onlyLowStock
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock ({lowStockItems.length})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-200/70 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="font-bold">{lowStockItems.length} products require restocking.</span>{" "}
              <span className="text-amber-800 hidden sm:inline">
                Current inventory is at or below 5 units.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleOrderLowStockWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-2xs active:scale-95"
              title="Send Wholesale Purchase Order to Distributor on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Order Low Stock via WhatsApp</span>
            </button>
            {!onlyLowStock && (
              <button
                onClick={() => setOnlyLowStock(true)}
                className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs transition"
              >
                Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Products Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {onlyLowStock
              ? "All products have healthy inventory levels."
              : "Click 'Add Product' to create a new SKU."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredInventory.map((item) => {
            const isLow = item.stock <= 5;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col justify-between ${
                  isLow
                    ? "border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/15"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {item.category || "General"}
                    </span>
                    {isLow && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {item.name}
                  </h4>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400">Unit Price</span>
                      <div className="text-base sm:text-lg font-extrabold text-slate-900 font-sans">
                        ₹{item.unitPrice}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">In Stock</span>
                      <div
                        className={`text-base sm:text-lg font-extrabold font-sans ${
                          isLow ? "text-amber-600" : "text-slate-800"
                        }`}
                      >
                        {item.stock}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Quick Adjustment */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">Quick Adjust:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => onUpdateStock(item.id, -1)}
                      title="Decrease stock by 1"
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold px-1.5 text-slate-800 min-w-[20px] text-center">
                      {item.stock}
                    </span>
                    <button
                      onClick={() => onUpdateStock(item.id, 1)}
                      title="Increase stock by 1"
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Catalog Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Product SKU</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parle-G Biscuit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                  >
                    <option value="kg">kg</option>
                    <option value="pack">pack</option>
                    <option value="L">L</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Snacks"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                  />
                </div>
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
