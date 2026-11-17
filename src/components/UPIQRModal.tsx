"use client";

import React, { useState } from "react";
import { StoreProfile } from "@/types";
import { DEFAULT_STORE_PROFILE } from "@/utils/whatsapp";
import { QrCode, X, Copy, Check, ExternalLink, ShieldCheck, Smartphone } from "lucide-react";

interface UPIQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  amount: number;
  note?: string;
  storeProfile?: StoreProfile;
}

export const UPIQRModal: React.FC<UPIQRModalProps> = ({
  isOpen,
  onClose,
  customerName,
  amount,
  note = "Store Bill",
  storeProfile = DEFAULT_STORE_PROFILE,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upiId = storeProfile.upiId || "guptakirana@upi";
  const payeeName = storeProfile.storeName || "Gupta Kirana Store";
  const validAmount = Math.max(0, amount);

  // Standard NPCI UPI URI Scheme
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${validAmount}&cu=INR&tn=${encodeURIComponent(`${customerName} Khata Settle`)}`;

  // Public QR Generator API
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    upiUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0E1526] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/15 relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.25)]">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Instant UPI Payment</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{payeeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Bill Settle for
          </div>
          <div className="text-base font-bold text-white mt-0.5">{customerName}</div>

          <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 my-2 font-sans tabular-nums drop-shadow-sm">
            ₹{validAmount.toLocaleString("en-IN")}
          </div>

          {/* QR Code Container with subtle glow */}
          <div className="relative mx-auto my-3 w-56 h-56 bg-white p-3 rounded-2xl border-2 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageSrc}
              alt="UPI QR Code"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Scan with GPay, PhonePe, Paytm, or BHIM
          </p>

          {/* UPI ID Pill with Copy button */}
          <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="text-left pl-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Store UPI ID
              </div>
              <div className="text-xs font-mono font-bold text-emerald-300 truncate max-w-[160px] sm:max-w-[190px]">
                {upiId}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 shadow-2xs active:scale-[0.98] transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Button: Direct UPI Deep Link */}
        <div className="pt-2 border-t border-white/10 flex items-center gap-2">
          <a
            href={upiUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition active:scale-[0.98]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
            Pay in UPI App
          </a>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
