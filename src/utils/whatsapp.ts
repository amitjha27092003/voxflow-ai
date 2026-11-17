import { Transaction, Customer, InventoryItem, StoreProfile } from "@/types";

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "Gupta Kirana Store",
  ownerName: "Rajesh Gupta",
  address: "Main Market, Sector 87",
  timings: "8:00 AM – 10:00 PM",
  upiId: "guptakirana@upi",
  phone: "919876543210",
};

export function formatWhatsAppBill(
  transaction: Transaction,
  currentBalance: number,
  store: StoreProfile = DEFAULT_STORE_PROFILE
): string {
  const dateStr = new Date(transaction.timestamp).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isUdhaar = transaction.type === "UDHAAR";
  const typeLabel = isUdhaar ? "CREDIT SALE (UDHAAR)" : "PAYMENT SETTLEMENT (JAMA)";

  let itemsText = "";
  if (transaction.items && transaction.items.length > 0) {
    itemsText = "\n\n📦 *Itemized Breakdown:*\n" +
      transaction.items
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.name} (${item.qty} ${item.unit}) @ ₹${item.unit_price} = ₹${item.total}`
        )
        .join("\n");
  }

  const message = `🧾 *${store.storeName.toUpperCase()}*
_Digital Receipt • Powered by VoxFlow AI_
━━━━━━━━━━━━━━━━━━━━
Customer: *${transaction.customerName}*

📅 Date: ${dateStr}
🏷️ Entry: *${typeLabel}*
${itemsText}

💰 *Invoice Total: ₹${transaction.totalAmount}*
━━━━━━━━━━━━━━━━━━━━
📊 *Total Outstanding Credit: ₹${currentBalance}*

Thank you for your business! 🙏
📍 ${store.storeName} • ${store.address}
⏰ Hours: ${store.timings}`;

  return message;
}

export function formatWhatsAppReminder(
  customer: Customer,
  store: StoreProfile = DEFAULT_STORE_PROFILE
): string {
  const message = `🙏 *${store.storeName.toUpperCase()}*
_Payment Notice • Powered by VoxFlow AI_
━━━━━━━━━━━━━━━━━━━━
Hello *${customer.name}*,

This is a gentle payment reminder regarding your pending store credit balance:
💰 *Amount Due: ₹${customer.balance}*

Please settle your pending balance via UPI or Cash at your earliest convenience.

💳 UPI ID: ${store.upiId}
📞 Store Helpline: ${store.phone || "+91 98765 43210"}
📍 Address: ${store.address}

Thank you!
${store.storeName} • Powered by VoxFlow AI`;

  return message;
}

export function formatDistributorOrder(
  lowStockItems: InventoryItem[],
  store: StoreProfile = DEFAULT_STORE_PROFILE
): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemsList = lowStockItems
    .map((item, idx) => {
      const suggestQty = item.unit === "kg" ? 25 : item.unit === "L" ? 20 : 24;
      return `${idx + 1}. *${item.name}*\n   Current Stock: ${item.stock} ${item.unit} | Order Quantity: ${suggestQty} ${item.unit}`;
    })
    .join("\n\n");

  const message = `📦 *PURCHASE ORDER — ${store.storeName.toUpperCase()}*
_Wholesale Restock Request • Date: ${dateStr}_
━━━━━━━━━━━━━━━━━━━━
Dear Distributor / Vendor,

Please dispatch the following replenishment items to our store:

${itemsList}

📍 *Delivery Location:*
${store.storeName}, ${store.address}
📞 Contact: ${store.phone || "+91 98765 43210"} (${store.ownerName})
💳 Payment: Immediate on delivery via UPI/Cheque (${store.upiId})

Thank you!
━━━━━━━━━━━━━━━━━━━━
_Generated via VoxFlow AI Retail Copilot_`;

  return message;
}

export function formatKhataStatement(
  customer: Customer,
  customerTxs: Transaction[],
  store: StoreProfile = DEFAULT_STORE_PROFILE
): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const txLines =
    customerTxs.length === 0
      ? "• No previous ledger records"
      : customerTxs
          .slice(0, 5)
          .map((tx) => {
            const txDate = new Date(tx.timestamp).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
            const typeStr = tx.type === "UDHAAR" ? "Credit (+)" : tx.type === "SPLIT" ? "Split Pay" : "Payment (-)";
            const itemsStr =
              tx.items && tx.items.length > 0
                ? ` [${tx.items.map((i) => `${i.name} ${i.qty}${i.unit}`).join(", ")}]`
                : "";
            return `• ${txDate}: ₹${tx.totalAmount} (${typeStr})${itemsStr}`;
          })
          .join("\n");

  const upiLink = `upi://pay?pa=${encodeURIComponent(store.upiId)}&pn=${encodeURIComponent(
    store.storeName
  )}&am=${customer.balance}&cu=INR`;

  return `📜 *DIGITAL KHATA STATEMENT — ${store.storeName.toUpperCase()}*
_Official Customer Account Statement • ${dateStr}_
━━━━━━━━━━━━━━━━━━━━
Grahak Name: *${customer.name}*
Contact: ${customer.phone}

💰 *Current Pending Balance: ₹${customer.balance}*
━━━━━━━━━━━━━━━━━━━━
*Recent Transaction History:*
${txLines}

━━━━━━━━━━━━━━━━━━━━
💳 *Pay Online via Instant UPI:*
${upiLink}

UPI ID: *${store.upiId}*
🏬 ${store.storeName}, ${store.address}
⏰ Timings: ${store.timings}
📞 Store Helpline: ${store.phone || "+91 98765 43210"}

_Thank you for your business! Powered by VoxFlow AI_`;
}

export function formatStoreRateList(
  inventory: InventoryItem[],
  store: StoreProfile = DEFAULT_STORE_PROFILE
): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemsList = inventory
    .map((item, idx) => {
      const inStock = item.stock > 0 ? "✅ In Stock" : "⏳ Restocking";
      return `${idx + 1}. *${item.name}* — ₹${item.unitPrice}/${item.unit} (${inStock})`;
    })
    .join("\n");

  return `🛒 *TODAY'S STORE RATE LIST — ${store.storeName.toUpperCase()}*
_Daily Fresh Rates & Inventory Catalog • ${dateStr}_
━━━━━━━━━━━━━━━━━━━━
Namaste! Here are today's verified prices for grocery & daily essentials:

${itemsList}

━━━━━━━━━━━━━━━━━━━━
🛵 *Free Home Delivery for orders above ₹300!*
📞 Call / WhatsApp Order: *${store.phone || "+91 98765 43210"}*
💳 Payment: Cash on Delivery or UPI (*${store.upiId}*)

📍 ${store.storeName}, ${store.address}
⏰ Hours: ${store.timings}
_Powered by VoxFlow AI Retail Copilot_`;
}

/**
 * Opens WhatsApp link intelligently:
 * 1. For pre-seeded dummy demo numbers (e.g. starting with 9198765432 or 98765432),
 *    opens https://wa.me/?text=... without a phone number so WhatsApp launches
 *    its native Contact Picker for 1-tap sharing to any real WhatsApp contact during live demos.
 * 2. For real mobile numbers (10-digit or 12-digit Indian), opens https://wa.me/91${phone}?text=...
 *    directly into that customer's chat without "Phone number is not on WhatsApp" error.
 */
export function openWhatsAppLink(phone: string, text: string) {
  const rawDigits = (phone || "").replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(text);

  // Check if this is a dummy/seeded demo phone number
  const isDummyNumber =
    !rawDigits ||
    rawDigits.startsWith("9198765432") ||
    rawDigits.startsWith("98765432") ||
    rawDigits === "919876543210" ||
    rawDigits === "919876543299";

  if (isDummyNumber) {
    // Native WhatsApp Contact Picker for seamless live demo sharing
    const url = `https://wa.me/?text=${encodedText}`;
    window.open(url, "_blank");
    return;
  }

  // Real user-entered phone number handling
  let cleanPhone = rawDigits;
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, "_blank");
}
