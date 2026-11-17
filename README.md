# VoxFlow AI — Hinglish Voice Retail OS 🎙️🛒
> **A Hinglish Voice-First Digital Ledger (Udhaar Khata), Billing & Inventory Copilot for Indian Retail Merchants.**

Built for **Gupta Kirana Store** and millions of Indian neighborhood dukandaars, VoxFlow AI enables hands-free voice billing, automatic stock deduction, WhatsApp digital bills (parchi), and smart recovery reminders (vasooli).

---

## 🌟 Key Features

### 🎙️ 1. Bharat-First Hinglish Voice Processing
- **Native Browser Speech Recognition**: Automatic recognition tuned for `hi-IN` with real-time interim transcript preview.
- **Natural Voice Feedback**: Uses `window.speechSynthesis` with Indian accent / Hindi voice (`hi-IN` / `en-IN`) for crisp audio confirmations under 15 words.
- **Multi-Intent Parsing**: Powered by `@google/generative-ai` with intelligent phonetic item matching (`atta` -> `Aashirvaad Atta`, `tel` -> `Fortune Sunflower Oil`, `makhan` -> `Amul Butter`, `chini` -> `Cheeni / Sugar`).
- **Mixed Commands**: Handles multiple customers and mixed actions in a single sentence (e.g., *"Sharma ji ke 2 kilo aata aur 1 butter udhaar aur Rahul ke 500 rupaye jama"*).
- **One-Tap Demo Pills**: Instant 1-click test pills right above the mic button for live demonstrations.

### 📊 2. Top 4 Live KPI Cards
1. **आज की बिक्री (Aaj Ki Bikri)**: Real-time cumulative daily sales total in ₹.
2. **कुल उधार बाकी (Total Udhaar Baaki)**: Active pending credit in ₹ with semantic Crimson Red (`#DC2626`).
3. **आज जमा हुआ (Aaj Jama Hua)**: Cash and UPI receipts collected today in Forest Green (`#16A34A`).
4. **कम स्टॉक सामान (Low Stock Items)**: Auto-alert for items with stock ≤ 5 units in Amber (`#D97706`).

### 📑 3. Clean 4-Tab Navigation
1. **Live Feed (लेजर स्ट्रीम)**: Chronological transaction stream with customer name, itemized bill breakdown, timestamp, UDHAAR/JAMA badge, and 1-tap WhatsApp Parchi button.
2. **Customers (ग्राहक खाता)**: Grahak ledger with search, net balance status, expandable transaction history, and 1-tap WhatsApp payment reminder.
3. **Inventory (स्मार्ट स्टॉक)**: Real-time stock catalog with automatic stock deduction when items are sold via voice. Quick `+` / `-` stock adjustments and instant low stock alerts.
4. **Recovery & Insights (वसूली AI)**: Highlights all overdue customers (> ₹500 pending) with a **Bulk WhatsApp Reminder** modal and AI retail health score.

### 📲 4. WhatsApp Digital Parchi & Vasooli Reminders
- Opens formatted WhatsApp chat via `https://wa.me/{phone}?text=...` with custom bilingual (Hindi + English) store receipts and overdue notices from "Gupta Kirana Store".

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (`#FAF8F5` Warm Cream, Deep Emerald `#0F766E`, Semantic Crimson & Forest Green)
- **Icons**: `lucide-react`
- **AI SDK**: `@google/generative-ai` (`gemini-2.5-flash` / `gemini-3.8-flash`) reading `GEMINI_API_KEY` from `.env.local`
- **Storage**: Client-side React state synced with `localStorage` (no external database required)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file with your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
npm run build
```
Verify 0 TypeScript or linting errors.

---

## 🎙️ Sample Spoken Commands to Try

1. **Udhaar Entry**: *"Sharma ji ke 2 kilo aata aur 1 Amul butter udhaar likh de"*
2. **Jama Entry**: *"Rahul ke 500 rupaye jama kar le"*
3. **Itemized Sale**: *"Sunita devi ko 1 liter Fortune tel aur 1 kilo cheeni udhaar"*
4. **Ledger Query**: *"Aaj kiska udhaar baaki hai?"*
