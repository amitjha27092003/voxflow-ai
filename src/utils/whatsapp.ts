import { Transaction, Customer, InventoryItem } from "@/types";

export function formatWhatsAppBill(transaction: Transaction, currentBalance: number): string {
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

  const message = `🧾 *GUPTA KIRANA STORE*
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
📍 Gupta Kirana Store • Main Market`;

  return message;
}

export function formatWhatsAppReminder(customer: Customer): string {
  const message = `🙏 *GUPTA KIRANA STORE*
_Payment Notice • Powered by VoxFlow AI_
━━━━━━━━━━━━━━━━━━━━
Hello *${customer.name}*,

This is a gentle payment reminder regarding your pending store credit balance:
💰 *Amount Due: ₹${customer.balance}*

Please settle your pending balance via UPI or Cash at your earliest convenience.

💳 UPI ID: guptakirana@upi
📞 Store Contact: +91 98765 43210

Thank you!
Gupta Kirana Store • Powered by VoxFlow AI`;

  return message;
}

export function formatDistributorOrder(lowStockItems: InventoryItem[]): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemsList = lowStockItems
    .map((item, idx) => {
      // Suggesting standard retail restock quantity
      const suggestQty = item.unit === "kg" ? 25 : item.unit === "L" ? 20 : 24;
      return `${idx + 1}. *${item.name}*\n   Current Stock: ${item.stock} ${item.unit} | Order Quantity: ${suggestQty} ${item.unit}`;
    })
    .join("\n\n");

  const message = `📦 *PURCHASE ORDER — GUPTA KIRANA STORE*
_Wholesale Restock Request • Date: ${dateStr}_
━━━━━━━━━━━━━━━━━━━━
Dear Distributor / Vendor,

Please dispatch the following replenishment items to our store:

${itemsList}

📍 *Delivery Location:*
Gupta Kirana Store, Shop #12, Main Market
📞 Contact: +91 98765 43210
💳 Payment: Immediate on delivery via UPI/Cheque

Thank you!
━━━━━━━━━━━━━━━━━━━━
_Generated via VoxFlow AI Retail Copilot_`;

  return message;
}

export function formatKhataStatement(customer: Customer, customerTxs: Transaction[]): string {
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

  const upiLink = `upi://pay?pa=guptakirana@upi&pn=Gupta%20Kirana%20Store&am=${customer.balance}&cu=INR`;

  return `📜 *DIGITAL KHATA STATEMENT — GUPTA KIRANA STORE*
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

UPI ID: *guptakirana@upi*
🏪 Gupta Kirana Store, Shop #12, Main Market
📞 Store Helpline: +91 98765 43210

_Thank you for your business! Powered by VoxFlow AI_`;
}

export function formatStoreRateList(inventory: InventoryItem[]): string {
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

  return `🛒 *TODAY'S STORE RATE LIST — GUPTA KIRANA STORE*
_Daily Fresh Rates & Inventory Catalog • ${dateStr}_
━━━━━━━━━━━━━━━━━━━━
Namaste! Here are today's verified prices for grocery & daily essentials:

${itemsList}

━━━━━━━━━━━━━━━━━━━━
🛵 *Free Home Delivery for orders above ₹300!*
📞 Call / WhatsApp Order: *+91 98765 43210*
💳 Payment: Cash on Delivery or UPI (*guptakirana@upi*)

📍 Gupta Kirana Store, Main Colony Market
_Powered by VoxFlow AI Retail Copilot_`;
}

export function openWhatsAppLink(phone: string, text: string) {
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
