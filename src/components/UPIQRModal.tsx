"use client";

import React, { useState } from "react";
import { QrCode, X, Copy, Check, ExternalLink, ShieldCheck, Smartphone } from "lucide-react";

interface UPIQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  amount: number;
  note?: string;
}

export const UPIQRModal: React.FC<UPIQRModalProps> = ({
  isOpen,
  onClose,
  customerName,
  amount,
  note = "Gupta Kirana Store Bill",
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upiId = "guptakirana@upi";
  const payeeName = "Gupta Kirana Store";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Instant UPI Payment</h3>
              <p className="text-[11px] text-slate-400">Gupta Kirana Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Bill Settle for
          </div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{customerName}</div>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-2 font-sans">
            ₹{validAmount.toLocaleString("en-IN")}
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto my-3 w-56 h-56 bg-white p-3 rounded-2xl border-2 border-slate-900/10 shadow-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageSrc}
              alt="UPI QR Code"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            Scan with GPay, PhonePe, Paytm, or BHIM
          </p>

          {/* UPI ID Pill with Copy button */}
          <div className="mt-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="text-left pl-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                UPI ID
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">{upiId}</div>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs active:scale-95 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
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
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <a
            href={upiUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            Pay in UPI App
          </a>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
