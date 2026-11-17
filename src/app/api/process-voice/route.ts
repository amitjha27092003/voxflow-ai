import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Customer, InventoryItem, Transaction, VoiceProcessResponse, VoiceAction, VoiceActionItem } from "@/types";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      {
        intent: "CLARIFICATION_NEEDED",
        confidence: 0,
        clarification_question_hi: "Please speak again, audio could not be detected.",
        voice_response_hi: "Kripya dobara bolein, aawaz spasht nahi thi.",
        actions: [],
        query_answer_hi: null,
      } as VoiceProcessResponse,
      { status: 200 }
    );
  }

  const { transcript, customers = [], inventory = [], transactions = [] } = body;

  if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
    return NextResponse.json(
      {
        intent: "CLARIFICATION_NEEDED",
        confidence: 0,
        clarification_question_hi: "Please speak again, audio was unclear.",
        voice_response_hi: "Kripya dobara bolein, aawaz spasht nahi thi.",
        actions: [],
        query_answer_hi: null,
      } as VoiceProcessResponse,
      { status: 200 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Prioritize ultra-low-latency models
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

    const systemInstruction = `
You are VoxFlow AI, Voice Ledger & Billing Copilot for Indian Kirana stores.
Parse spoken commands into concise JSON.

Store State:
Customers: ${JSON.stringify(customers.map((c: Customer) => ({ name: c.name, balance: c.balance })))}
Inventory: ${JSON.stringify(inventory.map((i: InventoryItem) => ({ name: i.name, unitPrice: i.unitPrice, stock: i.stock, unit: i.unit })))}

INTENTS:
1. "UNDO_LAST": cancel/undo last entry ("pichli entry cancel kar do", "गलत लिख दिया").
2. "RESTOCK": add stock ("20 kilo aata add kar do"). restock_items: [{ name, qty, unit }].
3. "EXPENSE": shop expense ("Bijli bill 1200 kharcha"). expense_details: { title, amount, category }.
4. "UPDATE_ITEM": price update/new SKU ("Cheeni rate 46 kar do"). item_update: { action, name, unitPrice, unit, stock, category }.
5. "QUERY": analytics questions ("Sabse zyada udhaar kiska hai?", "Kaun sa samaan kam hai?", "Aaj ka hisaab").
6. "TRANSACTION":
   - UDHAAR (credit), JAMA (cash/UPI payment), or SPLIT (mixed payment).
   - SPLIT: ("Rahul ka 500 bill, 300 UPI aur 200 udhaar"). split_details: { paid_amount, udhaar_amount, payment_mode }.
   - Fractional units: paav=0.25, aadha=0.5, paune=0.75, sawa=1.25, dedh=1.5, dhai=2.5, darjan=12.
   - Catalog items: Cheeni/Sugar (44/kg), Amul Butter (56/pack), Aashirvaad Atta (45/kg), Fortune Sunflower Oil (135/L), Toor Dal (160/kg), Tata Salt (28/kg), Maggi Noodles (14/pack), Red Label Tea (140/pack).

OUTPUT FORMAT:
- voiceFeedback: Clean concise Roman Hinglish under 12 words for UI toast (e.g. "Sharma Ji ke 146 rupaye udhaar darj ho gaye.").
- ttsText: Natural Devanagari Hindi for speech synthesis (e.g. "शर्मा जी के 146 रुपये उधार दर्ज हो गए हैं।").
- voice_response_hi: identical to voiceFeedback.

JSON Schema:
{
  "intent": "TRANSACTION" | "QUERY" | "CLARIFICATION_NEEDED" | "UNDO_LAST" | "RESTOCK" | "EXPENSE" | "UPDATE_ITEM",
  "confidence": number,
  "clarification_question_hi": string | null,
  "voice_response_hi": string,
  "voiceFeedback": string,
  "ttsText": string,
  "actions": [
    {
      "customer_name": string,
      "transaction_type": "UDHAAR" | "JAMA" | "SPLIT" | "EXPENSE",
      "items": [{ "name": string, "qty": number, "unit": string, "unit_price": number, "total": number }],
      "total_amount": number,
      "split_details": { "paid_amount": number, "udhaar_amount": number, "payment_mode": string }
    }
  ],
  "restock_items": [{ "name": string, "qty": number, "unit": string }],
  "expense_details": { "title": string, "amount": number, "category": string },
  "item_update": { "action": "UPDATE_PRICE" | "CREATE_ITEM", "name": string, "unitPrice": number, "unit": string, "stock": number, "category": string },
  "query_answer_hi": string | null
}
`;

    for (const modelName of modelsToTry) {
      try {
        const is25 = modelName.includes("2.5");
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 350,
            ...(is25 ? ({ thinkingConfig: { thinkingBudget: 0 } } as any) : {}),
          },
        });

        const prompt = `${systemInstruction}\n\nMerchant Spoke: "${transcript}"\nOutput JSON:`;

        const generatePromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 4500)
        );

        const result: any = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response.text();
        const parsed: VoiceProcessResponse = JSON.parse(responseText);

        // Normalize voiceFeedback and ttsText
        if (!parsed.voiceFeedback && parsed.voice_response_hi) {
          parsed.voiceFeedback = parsed.voice_response_hi;
        }
        if (!parsed.voice_response_hi && parsed.voiceFeedback) {
          parsed.voice_response_hi = parsed.voiceFeedback;
        }
        if (!parsed.ttsText) {
          parsed.ttsText = parsed.voiceFeedback || parsed.voice_response_hi;
        }

        return NextResponse.json(parsed);
      } catch (geminiError: any) {
        console.warn(`Gemini API attempt with ${modelName} error:`, geminiError.message);
      }
    }
  } else {
    console.error("GEMINI_API_KEY environment variable is missing.");
    return NextResponse.json({
      intent: "CLARIFICATION_NEEDED",
      confidence: 0,
      clarification_question_hi: "GEMINI_API_KEY is missing in Vercel settings. Please add it to your environment variables.",
      voiceFeedback: "Gemini API key configure nahi hai, Vercel settings check karein.",
      voice_response_hi: "Gemini API key configure nahi hai, Vercel settings check karein.",
      ttsText: "जेमिनी एपीआई की कॉन्फ़िगर नहीं है, वर्सेल सेटिंग्स चेक करें।",
      actions: [],
      query_answer_hi: "Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY in Vercel Project Settings > Environment Variables.",
    } as VoiceProcessResponse);
  }

  // Fallback parser handling UNDO_LAST, Conversational Analytics, and Transactions
  const parsedResponse = parseBilingualLocally(transcript, customers, inventory, transactions);
  return NextResponse.json(parsedResponse);
}

// Convert customer names to natural Devanagari Hindi for TTS voice pronunciation
function toHindiCustomerName(name: string): string {
  const map: Record<string, string> = {
    "Sharma Ji": "शर्मा जी",
    "Ankit": "अंकित",
    "Rahul Verma": "राहुल वर्मा",
    "Rahul": "राहुल",
    "Sunita Devi": "सुनीता देवी",
    "Sunita": "सुनीता",
    "Gupta General Store": "गुप्ता जी",
    "Gupta": "गुप्ता जी",
    "Priya Singh": "प्रिया सिंह",
    "Priya": "प्रिया",
    "Ramesh Kumar": "रमेश कुमार",
    "Ramesh": "रमेश",
    "Walk-in Customer": "ग्राहक",
  };
  return map[name] || name;
}

// Robust Bilingual Parser (Devanagari Hindi + Roman Hinglish)
function parseBilingualLocally(
  transcript: string,
  customers: Customer[],
  inventory: InventoryItem[],
  transactions: Transaction[]
): VoiceProcessResponse {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. UNDO_LAST INTENT
  const isUndo =
    lower.includes("cancel") ||
    lower.includes("undo") ||
    lower.includes("pichli entry") ||
    lower.includes("last entry") ||
    lower.includes("hata do") ||
    lower.includes("delete") ||
    text.includes("कैंसिल") ||
    text.includes("हटाओ") ||
    text.includes("पिछली एंट्री") ||
    text.includes("गलत लिख दिया") ||
    text.includes("रद्द करो");

  if (isUndo && (lower.includes("entry") || lower.includes("last") || lower.includes("pichli") || lower.includes("undo") || text.includes("एंट्री") || text.includes("पिछली") || text.includes("हटाओ"))) {
    return {
      intent: "UNDO_LAST",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: "Pichli entry cancel kar di gayi hai.",
      voice_response_hi: "Pichli entry cancel kar di gayi hai.",
      ttsText: "पिछली एंट्री कैंसिल कर दी गई है।",
      actions: [],
      query_answer_hi: "The most recent transaction has been cancelled and reversed.",
    };
  }

  // Helper for parsing spoken Indian quantities and fractional units
  const parseIndianQty = (valStr?: string, defaultQty: number = 1): number => {
    if (!valStr) return defaultQty;
    const s = valStr.trim().toLowerCase();

    // Indian Fractions
    if (s === "paav" || s === "pao" || s === "pav" || s === "पाव") return 0.25;
    if (s === "aadha" || s === "adha" || s === "आधा") return 0.5;
    if (s === "paune" || s === "pauna" || s === "पौने") return 0.75;
    if (s === "sawa" || s === "सवा") return 1.25;
    if (s === "dedh" || s === "deedh" || s === "डेढ़") return 1.5;
    if (s === "dhai" || s === "dhaai" || s === "ढाई") return 2.5;
    if (s.includes("aadha darjan") || s.includes("आधा दर्जन")) return 6;
    if (s.includes("darjan") || s.includes("दर्जन") || s === "doz" || s === "dozen") return 12;

    // Number words
    if (s === "ek" || s === "एक") return 1;
    if (s === "do" || s === "दो") return 2;
    if (s === "teen" || s === "तीन") return 3;
    if (s === "chaar" || s === "चार") return 4;
    if (s === "paanch" || s === "पांच") return 5;
    if (s === "chhah" || s === "छह") return 6;
    if (s === "saat" || s === "सात") return 7;
    if (s === "aath" || s === "आठ") return 8;
    if (s === "nau" || s === "नौ") return 9;
    if (s === "dus" || s === "दस") return 10;
    if (s === "pandrah" || s === "पंद्रह") return 15;
    if (s === "bees" || s === "बीस") return 20;
    if (s === "pachees" || s === "पच्चीस") return 25;
    if (s === "pachaas" || s === "पचास") return 50;

    const parsedNum = parseFloat(s);
    return isNaN(parsedNum) ? defaultQty : parsedNum;
  };

  const qtyPattern = "(\\d+(?:\\.\\d+)?|पाव|आधा|पौने|सवा|डेढ़|ढाई|दर्जन|paav|pao|aadha|adha|paune|sawa|dedh|dhai|darjan|एक|दो|तीन|चार|पांच|दस|बीस|पचास|ek|do|teen|chaar|paanch|dus|bees)";

  const extractItemQty = (targetRegex: string, fallbackQty: number = 1): number => {
    const m = text.match(new RegExp(targetRegex, "i"));
    if (!m || !m[1]) return fallbackQty;
    return parseIndianQty(m[1], fallbackQty);
  };

  // 2. RESTOCK INTENT
  const isRestock =
    lower.includes("stock mein add") ||
    lower.includes("stock me add") ||
    lower.includes("restock") ||
    lower.includes("stock badhao") ||
    lower.includes("maal aaya") ||
    lower.includes("stock me daal") ||
    text.includes("स्टॉक में जोड़ो") ||
    text.includes("स्टॉक बढ़ाओ") ||
    text.includes("स्टॉक में ऐड") ||
    text.includes("माल आया");

  if (isRestock) {
    const restockItems: { name: string; qty: number; unit: string }[] = [];

    // Aashirvaad Atta
    if (text.includes("आटा") || lower.includes("aata") || lower.includes("atta")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:आटा|aata|atta))`, 20);
      restockItems.push({ name: "Aashirvaad Atta", qty: q, unit: "kg" });
    }

    // Amul Butter
    if (text.includes("बटर") || text.includes("मक्खन") || lower.includes("butter") || lower.includes("makhan")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack|packet)?\\s*(?:अमूल\\s*)?(?:बटर|मक्खन|butter|makhan))`, 10);
      restockItems.push({ name: "Amul Butter", qty: q, unit: "pack" });
    }

    // Cheeni / Sugar
    if (text.includes("चीनी") || lower.includes("cheeni") || lower.includes("sugar")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:चीनी|cheeni|sugar))`, 25);
      restockItems.push({ name: "Cheeni / Sugar", qty: q, unit: "kg" });
    }

    // Fortune Sunflower Oil
    if (text.includes("तेल") || lower.includes("tel") || lower.includes("oil")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:लीटर|liter|litre|l)?\\s*(?:तेल|tel|oil))`, 15);
      restockItems.push({ name: "Fortune Sunflower Oil", qty: q, unit: "L" });
    }

    // Toor Dal
    if (text.includes("दाल") || lower.includes("dal") || lower.includes("toor")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:दाल|dal|toor))`, 10);
      restockItems.push({ name: "Toor Dal", qty: q, unit: "kg" });
    }

    // Tata Salt
    if (text.includes("नमक") || lower.includes("salt") || lower.includes("namak")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:नमक|salt|namak))`, 20);
      restockItems.push({ name: "Tata Salt", qty: q, unit: "kg" });
    }

    // Maggi Noodles
    if (text.includes("मैगी") || text.includes("नूडल्स") || lower.includes("maggi") || lower.includes("noodles")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack)?\\s*(?:मैगी|maggi|noodles))`, 24);
      restockItems.push({ name: "Maggi Noodles", qty: q, unit: "pack" });
    }

    // Red Label Tea
    if (text.includes("चाय") || lower.includes("chai") || lower.includes("tea")) {
      const q = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack)?\\s*(?:चाय|chai|tea))`, 12);
      restockItems.push({ name: "Red Label Tea", qty: q, unit: "pack" });
    }

    if (restockItems.length > 0) {
      const spokenSummary = restockItems.map((r) => `${r.qty} ${r.unit} ${r.name}`).join(" aur ");
      const hinglishResp = `${spokenSummary} stock mein add ho gaya hai.`.slice(0, 80);
      return {
        intent: "RESTOCK",
        confidence: 0.98,
        clarification_question_hi: null,
        voiceFeedback: hinglishResp,
        voice_response_hi: hinglishResp,
        ttsText: "स्टॉक में सामान सफलतापूर्वक जोड़ दिया गया है।",
        actions: [],
        restock_items: restockItems,
        query_answer_hi: `Successfully restocked ${restockItems.length} products in inventory:\n${restockItems.map((r) => `• ${r.name}: +${r.qty} ${r.unit}`).join("\n")}`,
      };
    }
  }

  // 3. EXPENSE INTENT (Daily Store Expense Tracker)
  const isExpense =
    lower.includes("kharch") ||
    lower.includes("kharcha") ||
    lower.includes("bijli ka bill") ||
    lower.includes("bijli bill") ||
    lower.includes("chai pani") ||
    lower.includes("chai nashta") ||
    lower.includes("rent") ||
    text.includes("खर्च") ||
    text.includes("खर्चा") ||
    text.includes("बिजली बिल") ||
    text.includes("किराया");

  if (isExpense) {
    const amtMatch = text.match(/\b(\d+)\b/);
    const amt = amtMatch ? parseInt(amtMatch[1], 10) : 120;
    let title = "Store Expense";
    let category = "General";

    if (lower.includes("bijli") || text.includes("बिजली")) {
      title = "Electricity Bill";
      category = "Utilities";
    } else if (lower.includes("chai") || text.includes("चाय")) {
      title = "Tea & Refreshments";
      category = "Refreshments";
    } else if (lower.includes("rent") || text.includes("किराया")) {
      title = "Shop Rent";
      category = "Rent";
    } else if (lower.includes("safai") || text.includes("सफाई")) {
      title = "Shop Cleaning";
      category = "Maintenance";
    }

    const hindiTitle =
      title === "Electricity Bill"
        ? "बिजली बिल"
        : title === "Tea & Refreshments"
        ? "चाय नाश्ता"
        : title === "Shop Rent"
        ? "दुकान किराया"
        : "दुकान खर्च";

    const hinglishResp = `${title} ke ${amt} rupaye kharch darj ho gaye.`;
    return {
      intent: "EXPENSE",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: hinglishResp,
      voice_response_hi: hinglishResp,
      ttsText: `${hindiTitle} के ${amt} रुपये खर्च दर्ज हो गए हैं।`,
      expense_details: { title, amount: amt, category },
      actions: [
        {
          customer_name: `Store Expense: ${title}`,
          transaction_type: "EXPENSE",
          items: [{ name: title, qty: 1, unit: "unit", unit_price: amt, total: amt }],
          total_amount: amt,
        },
      ],
      query_answer_hi: `Recorded store expense: ₹${amt} for ${title} (${category}).`,
    };
  }

  // 4. UPDATE_ITEM INTENT (Catalog Price Update & New SKU Creation)
  const isRateChange =
    (lower.includes("rate") || lower.includes("bhav") || text.includes("रेट") || text.includes("भाव")) &&
    (lower.includes("kar do") || lower.includes("karo") || lower.includes("badal") || text.includes("कर दो"));

  const isNewItem =
    lower.includes("naya item") ||
    lower.includes("new item") ||
    lower.includes("item add") ||
    text.includes("नया आइटम") ||
    text.includes("आइटम जोड़ो");

  if (isRateChange || isNewItem) {
    const amtMatch = text.match(/\b(\d+)\b/);
    const rate = amtMatch ? parseInt(amtMatch[1], 10) : 46;

    if (isNewItem) {
      let itemName = "Raju Namkeen";
      if (lower.includes("raju") || text.includes("राजू")) itemName = "Raju Namkeen";
      else if (lower.includes("parle") || text.includes("पारले")) itemName = "Parle-G Biscuit";
      else if (lower.includes("surf") || text.includes("सर्फ")) itemName = "Surf Excel";

      return {
        intent: "UPDATE_ITEM",
        confidence: 0.95,
        clarification_question_hi: null,
        voiceFeedback: `${itemName} ${rate} rupaye packet inventory mein add ho gaya hai.`,
        voice_response_hi: `${itemName} ${rate} rupaye packet inventory mein add ho gaya hai.`,
        ttsText: `${itemName} ${rate} रुपये प्रति पैकेट इन्वेंट्री में जोड़ दिया गया है।`,
        actions: [],
        item_update: {
          action: "CREATE_ITEM",
          name: itemName,
          unitPrice: rate,
          unit: "pack",
          stock: 24,
          category: "Packaged Foods",
        },
        query_answer_hi: `Created new catalog SKU "${itemName}" at ₹${rate}/pack with 24 units initial stock.`,
      };
    } else {
      let itemName = "Cheeni / Sugar";
      let unit = "kg";
      if (lower.includes("aata") || text.includes("आटा")) {
        itemName = "Aashirvaad Atta";
        unit = "kg";
      } else if (lower.includes("tel") || text.includes("तेल")) {
        itemName = "Fortune Sunflower Oil";
        unit = "L";
      } else if (lower.includes("butter") || text.includes("बटर")) {
        itemName = "Amul Butter";
        unit = "pack";
      } else if (lower.includes("dal") || text.includes("दाल")) {
        itemName = "Toor Dal";
        unit = "kg";
      }

      const hindiItemName =
        itemName === "Cheeni / Sugar"
          ? "चीनी"
          : itemName === "Aashirvaad Atta"
          ? "आटा"
          : itemName === "Fortune Sunflower Oil"
          ? "तेल"
          : itemName;

      return {
        intent: "UPDATE_ITEM",
        confidence: 0.95,
        clarification_question_hi: null,
        voiceFeedback: `${itemName} ka rate ${rate} rupaye per ${unit} update ho gaya hai.`,
        voice_response_hi: `${itemName} ka rate ${rate} rupaye per ${unit} update ho gaya hai.`,
        ttsText: `${hindiItemName} का रेट ${rate} रुपये प्रति ${unit} अपडेट हो गया है।`,
        actions: [],
        item_update: {
          action: "UPDATE_PRICE",
          name: itemName,
          unitPrice: rate,
          unit,
        },
        query_answer_hi: `Catalog price for ${itemName} updated to ₹${rate}/${unit}.`,
      };
    }
  }

  // 2. CONVERSATIONAL BUSINESS ANALYTICS (QUERY INTENT)
  // 2A. Highest Debtor ("Sabse zyada udhaar kiska baaki hai?")
  if (
    lower.includes("sabse zyada") ||
    lower.includes("highest udhaar") ||
    lower.includes("max udhaar") ||
    lower.includes("sabse bada udhaar") ||
    text.includes("सबसे ज्यादा उधार") ||
    text.includes("सबसे बड़ा उधार")
  ) {
    const overdue = [...customers].filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance);
    if (overdue.length > 0) {
      const top = overdue[0];
      const hName = toHindiCustomerName(top.name);
      return {
        intent: "QUERY",
        confidence: 0.98,
        clarification_question_hi: null,
        voiceFeedback: `${top.name} ke sabse zyada ${top.balance} rupaye baaki hain.`,
        voice_response_hi: `${top.name} ke sabse zyada ${top.balance} rupaye baaki hain.`,
        ttsText: `${hName} के सबसे ज्यादा ${top.balance} रुपये बाकी हैं।`,
        actions: [],
        query_answer_hi: `Highest pending credit is ${top.name} with ₹${top.balance.toLocaleString("en-IN")} outstanding.`,
        insight_data: {
          type: "DEBTOR",
          title: "Highest Pending Udhaar",
          metrics: { name: top.name, amount: top.balance },
        },
      };
    } else {
      return {
        intent: "QUERY",
        confidence: 0.95,
        clarification_question_hi: null,
        voiceFeedback: "Kisi bhi grahak ka udhaar baaki nahi hai.",
        voice_response_hi: "Kisi bhi grahak ka udhaar baaki nahi hai.",
        ttsText: "किसी भी ग्राहक का उधार बाकी नहीं है।",
        actions: [],
        query_answer_hi: "All customer accounts are settled. No pending credit balances.",
      };
    }
  }

  // 2B. Low Stock Query ("Kaun sa samaan kam hai?")
  if (
    lower.includes("kaun sa samaan") ||
    lower.includes("samaan kam") ||
    lower.includes("stock kam") ||
    lower.includes("low stock") ||
    lower.includes("kya khatam") ||
    text.includes("कौन सा सामान कम") ||
    text.includes("स्टॉक कम") ||
    text.includes("सामान कम है")
  ) {
    const lowStock = inventory.filter((i) => i.stock <= 5);
    if (lowStock.length > 0) {
      const names = lowStock.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(", ");
      const spokenNames = lowStock.map((i) => i.name).slice(0, 3).join(" aur ");
      return {
        intent: "QUERY",
        confidence: 0.98,
        clarification_question_hi: null,
        voiceFeedback: `${spokenNames} ka stock 5 se kam bacha hai.`,
        voice_response_hi: `${spokenNames} ka stock 5 se kam bacha hai.`,
        ttsText: `${lowStock.length} सामानों का स्टॉक 5 से कम बचा हुआ है।`,
        actions: [],
        query_answer_hi: `${lowStock.length} items are running low on stock:\n${names}`,
        insight_data: {
          type: "INVENTORY",
          title: "Low Stock Alert",
          metrics: { count: lowStock.length, items: lowStock.map((i) => i.name) },
        },
      };
    } else {
      return {
        intent: "QUERY",
        confidence: 0.95,
        clarification_question_hi: null,
        voiceFeedback: "Sabhi samaan ka stock paryapt hai.",
        voice_response_hi: "Sabhi samaan ka stock paryapt hai.",
        ttsText: "सभी सामानों का स्टॉक पर्याप्त है।",
        actions: [],
        query_answer_hi: "All products currently have healthy inventory levels (> 5 units).",
      };
    }
  }

  // 2C. Day Summary ("Aaj ka hisaab batao")
  if (
    lower.includes("aaj ka hisaab") ||
    lower.includes("today summary") ||
    lower.includes("aaj ki bikri") ||
    lower.includes("day summary") ||
    text.includes("आज का हिसाब") ||
    text.includes("आज की बिक्री") ||
    text.includes("आज का हिसाब बताओ")
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTxs = transactions.filter(
      (t) => new Date(t.timestamp).getTime() >= todayStart.getTime()
    );

    const todaySales = todayTxs
      .filter((t) => t.type === "UDHAAR")
      .reduce((acc, t) => acc + t.totalAmount, 0);

    const todayJama = todayTxs
      .filter((t) => t.type === "JAMA")
      .reduce((acc, t) => acc + t.totalAmount, 0);

    const totalUdhaar = customers.reduce(
      (acc, c) => acc + (c.balance > 0 ? c.balance : 0),
      0
    );

    return {
      intent: "QUERY",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: `Aaj ki bikri ${todaySales} rupaye aur jama ${todayJama} rupaye hai.`,
      voice_response_hi: `Aaj ki bikri ${todaySales} rupaye aur jama ${todayJama} rupaye hai.`,
      ttsText: `आज की कुल बिक्री ${todaySales} रुपये और जमा ${todayJama} रुपये है।`,
      actions: [],
      query_answer_hi: `Today's Ledger Summary:\n• Today's Revenue: ₹${todaySales.toLocaleString("en-IN")}\n• Collected Today: ₹${todayJama.toLocaleString("en-IN")}\n• Total Pending Credit: ₹${totalUdhaar.toLocaleString("en-IN")}`,
      insight_data: {
        type: "SUMMARY",
        title: "Daily Ledger Summary",
        metrics: { sales: todaySales, collected: todayJama, pendingUdhaar: totalUdhaar },
      },
    };
  }

  // 2D. General Udhaar Query ("Aaj kiska udhaar baaki hai?")
  const isGeneralQuery =
    lower.includes("kiska udhaar") ||
    lower.includes("baaki hai") ||
    lower.includes("udhar baaki") ||
    lower.includes("kitna baaki") ||
    lower.includes("pending") ||
    text.includes("किसका उधार") ||
    text.includes("कितना बाकी") ||
    text.includes("बाकी है") ||
    text.includes("किस-किस का");

  if (isGeneralQuery) {
    for (const c of customers) {
      const first = c.name.toLowerCase().split(" ")[0];
      if (lower.includes(first) || text.includes(c.name)) {
        const hName = toHindiCustomerName(c.name);
        return {
          intent: "QUERY",
          confidence: 0.95,
          clarification_question_hi: null,
          voiceFeedback: `${c.name} ke ${c.balance} rupaye baaki hain.`,
          voice_response_hi: `${c.name} ke ${c.balance} rupaye baaki hain.`,
          ttsText: `${hName} के ${c.balance} रुपये बाकी हैं।`,
          actions: [],
          query_answer_hi: `Total pending credit for ${c.name} is ₹${c.balance}.`,
        };
      }
    }

    const overdue = customers.filter((c) => c.balance > 0);
    const totalBaaki = overdue.reduce((acc, c) => acc + c.balance, 0);
    const summaryList = overdue.map((c) => `${c.name}: ₹${c.balance}`).join(", ");

    return {
      intent: "QUERY",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: `${overdue.length} grahakon ke kul ${totalBaaki} rupaye baaki hain.`,
      voice_response_hi: `${overdue.length} grahakon ke kul ${totalBaaki} rupaye baaki hain.`,
      ttsText: `${overdue.length} ग्राहकों के कुल ${totalBaaki} रुपये बाकी हैं।`,
      actions: [],
      query_answer_hi: `Total ₹${totalBaaki.toLocaleString("en-IN")} pending across ${overdue.length} customer accounts:\n${summaryList}`,
    };
  }

  // 3. Resolve Customer Name (Devanagari + Roman)
  let customerName = "Walk-in Customer";

  if (text.includes("अंकित") || lower.includes("ankit")) {
    customerName = "Ankit";
  } else if (text.includes("शर्मा") || lower.includes("sharma")) {
    customerName = "Sharma Ji";
  } else if (text.includes("राहुल") || lower.includes("rahul")) {
    customerName = "Rahul Verma";
  } else if (text.includes("सुनीता") || lower.includes("sunita")) {
    customerName = "Sunita Devi";
  } else if (text.includes("गुप्ता") || lower.includes("gupta")) {
    customerName = "Gupta General Store";
  } else if (text.includes("प्रिया") || lower.includes("priya")) {
    customerName = "Priya Singh";
  } else if (text.includes("रमेश") || lower.includes("ramesh")) {
    customerName = "Ramesh Kumar";
  } else {
    const hindiNameMatch = text.match(/^([^\s]+)\s+(?:को|के|ने|का)/);
    if (hindiNameMatch && hindiNameMatch[1]) {
      customerName = hindiNameMatch[1];
    } else {
      const romanNameMatch = lower.match(/^([a-z\s]+?)\s+(?:ke|ko|ne|ka)\b/i);
      if (romanNameMatch && romanNameMatch[1]) {
        customerName = romanNameMatch[1]
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }
  }

  const isSplit =
    (lower.includes("udhaar") || lower.includes("udhar") || text.includes("उधार") || lower.includes("baaki") || text.includes("बाकी")) &&
    (lower.includes("jama") || lower.includes("upi") || lower.includes("cash") || text.includes("जमा") || text.includes("चुकाए") || text.includes("दिए"));

  // Check pure bill split payment without grocery items (e.g. "Rahul ka 500 ka bill bana, 300 UPI se aur 200 udhaar likh de")
  if (isSplit && !text.includes("चीनी") && !text.includes("बटर") && !text.includes("आटा") && !text.includes("तेल") && !lower.includes("cheeni") && !lower.includes("aata")) {
    const nums = (text.match(/\d+/g) || []).map((n) => parseInt(n, 10));
    let paidAmt = 300;
    let udhaarAmt = 200;
    let totalBill = 500;

    if (nums.length >= 3) {
      totalBill = nums[0];
      paidAmt = nums[1];
      udhaarAmt = nums[2];
    } else if (nums.length === 2) {
      paidAmt = nums[0];
      udhaarAmt = nums[1];
      totalBill = paidAmt + udhaarAmt;
    }

    const hindiCust = toHindiCustomerName(customerName);
    const paymentMode = lower.includes("upi") || text.includes("यूपीआई") ? "UPI" : "Cash";
    const hinglishResp = `${customerName} ke ${paidAmt} jama aur ${udhaarAmt} udhaar darj ho gaye.`;
    const devanagariResp = `${hindiCust} के ${paidAmt} रुपये जमा और ${udhaarAmt} रुपये उधार दर्ज हो गए हैं।`;

    return {
      intent: "TRANSACTION",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: hinglishResp,
      voice_response_hi: hinglishResp,
      ttsText: devanagariResp,
      actions: [
        {
          customer_name: customerName,
          transaction_type: "SPLIT",
          items: [],
          total_amount: totalBill,
          split_details: {
            paid_amount: paidAmt,
            udhaar_amount: udhaarAmt,
            payment_mode: paymentMode,
          },
        },
      ],
      query_answer_hi: `Split Payment for ${customerName}: ₹${paidAmt} paid via ${paymentMode} + ₹${udhaarAmt} pending credit (Total: ₹${totalBill}).`,
    };
  }

  const isJama =
    text.includes("जमा") ||
    text.includes("चुकाए") ||
    text.includes("दिए") ||
    lower.includes("jama") ||
    lower.includes("diye") ||
    lower.includes("paid");

  // Pure JAMA transaction (e.g., "Rahul ke 500 rupaye jama")
  if (isJama && !text.includes("चीनी") && !text.includes("बटर") && !text.includes("आटा") && !text.includes("तेल") && !lower.includes("cheeni") && !lower.includes("aata")) {
    const amtMatch = text.match(/\b(\d+)\b/);
    const amt = amtMatch ? parseInt(amtMatch[1], 10) : 500;
    const hindiCust = toHindiCustomerName(customerName);
    const hinglishResp = `${customerName} ke ${amt} rupaye jama darj ho gaye.`;
    return {
      intent: "TRANSACTION",
      confidence: 0.95,
      clarification_question_hi: null,
      voiceFeedback: hinglishResp,
      voice_response_hi: hinglishResp,
      ttsText: `${hindiCust} के ${amt} रुपये जमा दर्ज हो गए हैं।`,
      actions: [
        {
          customer_name: customerName,
          transaction_type: "JAMA",
          items: [],
          total_amount: amt,
        },
      ],
      query_answer_hi: null,
    };
  }

  // 4. Match Catalog Items (Devanagari & Roman with Indian Fractional Quantities)
  const items: VoiceActionItem[] = [];
  let totalAmount = 0;

  // Cheeni / Sugar (₹44/kg)
  if (text.includes("चीनी") || lower.includes("cheeni") || lower.includes("chini") || lower.includes("sugar")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:चीनी|cheeni|chini|sugar))`, 1);
    const price = 44;
    const total = Math.round(qty * price);
    items.push({ name: "Cheeni / Sugar", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Amul Butter (₹56/pack)
  if (text.includes("बटर") || text.includes("मक्खन") || lower.includes("butter") || lower.includes("makhan")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack|packet)?\\s*(?:अमूल\\s*)?(?:बटर|मक्खन|butter|makhan))`, 1);
    const price = 56;
    const total = Math.round(qty * price);
    items.push({ name: "Amul Butter", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  // Aashirvaad Atta (₹45/kg)
  if (text.includes("आटा") || lower.includes("aata") || lower.includes("atta")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:आटा|aata|atta))`, 2);
    const price = 45;
    const total = Math.round(qty * price);
    items.push({ name: "Aashirvaad Atta", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Fortune Sunflower Oil (₹135/L)
  if (text.includes("तेल") || lower.includes("tel") || lower.includes("oil") || lower.includes("fortune")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:लीटर|liter|litre|l)?\\s*(?:तेल|tel|oil))`, 1);
    const price = 135;
    const total = Math.round(qty * price);
    items.push({ name: "Fortune Sunflower Oil", qty, unit: "L", unit_price: price, total });
    totalAmount += total;
  }

  // Toor Dal (₹160/kg)
  if (text.includes("दाल") || lower.includes("dal") || lower.includes("daal") || lower.includes("toor")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:दाल|dal|daal|toor))`, 1);
    const price = 160;
    const total = Math.round(qty * price);
    items.push({ name: "Toor Dal", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Tata Salt (₹28/kg)
  if (text.includes("नमक") || lower.includes("salt") || lower.includes("namak")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:किलो|kg|kilo)?\\s*(?:नमक|salt|namak))`, 1);
    const price = 28;
    const total = Math.round(qty * price);
    items.push({ name: "Tata Salt", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Maggi Noodles (₹14/pack)
  if (text.includes("मैगी") || text.includes("नूडल्स") || lower.includes("maggi") || lower.includes("noodles")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack)?\\s*(?:मैगी|maggi|noodles))`, 1);
    const price = 14;
    const total = Math.round(qty * price);
    items.push({ name: "Maggi Noodles", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  // Red Label Tea (₹140/pack)
  if (text.includes("चाय") || lower.includes("chai") || lower.includes("tea")) {
    const qty = extractItemQty(`(?:${qtyPattern}\\s*(?:पैकेट|pack)?\\s*(?:चाय|chai|tea))`, 1);
    const price = 140;
    const total = Math.round(qty * price);
    items.push({ name: "Red Label Tea", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  if (items.length === 0) {
    return {
      intent: "CLARIFICATION_NEEDED",
      confidence: 0.4,
      clarification_question_hi: "Could not identify items or amount. Please repeat customer name and items clearly.",
      voiceFeedback: "Samaan ya rashi samajh nahi aayi, kripya dobara bolein.",
      voice_response_hi: "Samaan ya rashi samajh nahi aayi, kripya dobara bolein.",
      ttsText: "सामान या राशि समझ नहीं आई, कृपया दोबारा बोलें।",
      actions: [],
      query_answer_hi: null,
    };
  }

  const hindiCust = toHindiCustomerName(customerName);

  // If itemized split payment is requested (e.g. "Ankit ke 2 kilo cheeni me se 50 jama aur baaki udhaar")
  if (isSplit) {
    const paidMatch =
      text.match(/(\d+)\s*(?:रुपये|rupaye|rs|₹)?\s*(?:upi|cash|jama|जमा|चुकाए|दिए)/i) ||
      text.match(/(?:upi|cash|jama|जमा)\s*(?:se|me)?\s*(\d+)/i) ||
      text.match(/me se\s*(\d+)/i);
    const paidAmt = paidMatch ? parseInt(paidMatch[1], 10) : 50;
    const udhaarAmt = Math.max(0, totalAmount - paidAmt);
    const paymentMode = lower.includes("upi") || text.includes("यूपीआई") ? "UPI" : "Cash";
    const hinglishResp = `${customerName} ke ${paidAmt} jama aur ${udhaarAmt} udhaar darj ho gaye.`;
    const devanagariResp = `${hindiCust} के ${paidAmt} रुपये जमा और ${udhaarAmt} रुपये उधार दर्ज हो गए हैं।`;

    return {
      intent: "TRANSACTION",
      confidence: 0.98,
      clarification_question_hi: null,
      voiceFeedback: hinglishResp,
      voice_response_hi: hinglishResp,
      ttsText: devanagariResp,
      actions: [
        {
          customer_name: customerName,
          transaction_type: "SPLIT",
          items,
          total_amount: totalAmount,
          split_details: {
            paid_amount: paidAmt,
            udhaar_amount: udhaarAmt,
            payment_mode: paymentMode,
          },
        },
      ],
      query_answer_hi: `Itemized Split Payment for ${customerName}: ₹${paidAmt} settled + ₹${udhaarAmt} credit (Total: ₹${totalAmount}).`,
    };
  }

  const voiceFeedback = `${customerName} ke ${totalAmount} rupaye udhaar darj ho gaye.`;
  const ttsText = `${hindiCust} के ${totalAmount} रुपये उधार दर्ज हो गए हैं।`;

  return {
    intent: "TRANSACTION",
    confidence: 0.95,
    clarification_question_hi: null,
    voiceFeedback,
    voice_response_hi: voiceFeedback,
    ttsText,
    actions: [
      {
        customer_name: customerName,
        transaction_type: "UDHAAR",
        items,
        total_amount: totalAmount,
      },
    ],
    query_answer_hi: null,
  };
}
