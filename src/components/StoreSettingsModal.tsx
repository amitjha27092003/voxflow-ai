"use client";

import React, { useState } from "react";
import { StoreProfile } from "@/types";
import { Store, User, MapPin, Clock, QrCode, Phone, X, Trash2, Check } from "lucide-react";

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeProfile: StoreProfile;
  onSaveProfile: (profile: StoreProfile) => void;
  onClearSampleData: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  storeProfile,
  onSaveProfile,
  onClearSampleData,
}) => {
  const [formData, setFormData] = useState<StoreProfile>(storeProfile);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0E1526] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/15 max-h-[92vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Store Profile &amp; SaaS Settings</h3>
              <p className="text-xs text-slate-400">Personalize branding, WhatsApp receipts &amp; UPI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="py-4 overflow-y-auto space-y-3.5 flex-1 pr-1">
          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              Store / Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="e.g. Verma Kirana & General Store"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Owner Name
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="e.g. Ramesh Verma"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Store Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Store Address / Colony
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Shop #4, Sector 87, Near Shiv Mandir, Noida"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Store Timings & Store Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Store Timings
              </label>
              <input
                type="text"
                value={formData.timings}
                onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                placeholder="e.g. 7:30 AM – 10:30 PM"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Store Helpline / Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 919876543210"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          {/* Store UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Store UPI ID (For Direct Customer Settlements) *
            </label>
            <input
              type="text"
              required
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              placeholder="e.g. vermastore@okaxis or 9876543210@upi"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-emerald-300 font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Used automatically in instant UPI QR generation and WhatsApp bill payment deep links.
            </p>
          </div>

          {/* Clear Sample Data Box for Real Merchants */}
          <div className="pt-3 border-t border-white/10">
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Start Blank Store
                </h4>
                <p className="text-[11px] text-rose-400/80 mt-0.5">
                  Wipes sample demo data so you can add your own real customers &amp; inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs active:scale-[0.98] transition shrink-0"
              >
                Clear Data
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl active:scale-[0.98] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                "Save Store Profile"
              )}
            </button>
          </div>
        </form>

        {/* Confirmation Modal to Clear Data */}
        {showConfirmClear && (
          <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Wipe Sample Kirana Data?</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              This will clear demo customers (Sharma Ji, etc.) and reset transactions to 0 so your store starts 100% fresh for your business.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.05] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearSampleData();
                  setShowConfirmClear(false);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg active:scale-[0.98]"
              >
                Yes, Start Blank Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
