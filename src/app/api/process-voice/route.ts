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
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    const systemInstruction = `
You are VoxFlow AI, a state-of-the-art Voice Ledger & Retail Copilot for Indian Kirana store merchants (Gupta Kirana Store).
Your job is to parse spoken voice commands into structured JSON for an Udhaar Khata (Credit Ledger) and Inventory system.

LANGUAGE SUPPORT:
User commands may be in:
1. Devanagari Hindi script (e.g. "अंकित को 2 किलो चीनी और एक अमूल बटर उधार लिख दो", "पिछली एंट्री कैंसिल कर दो", "आज का हिसाब बताओ", "सबसे ज्यादा उधार किसका बाकी है?")
2. Roman Hinglish script (e.g. "Ankit ko 2 kilo cheeni aur 1 Amul butter udhaar likh do", "pichli entry cancel kar do", "Aaj ka hisaab batao", "Sabse zyada udhaar kiska baaki hai?")
3. English or mixed script

Current Store State:
- Customers:
${JSON.stringify(
  customers.map((c: Customer) => ({ name: c.name, balance: c.balance })),
  null,
  2
)}

- Inventory:
${JSON.stringify(
  inventory.map((i: InventoryItem) => ({
    name: i.name,
    unitPrice: i.unitPrice,
    stock: i.stock,
    unit: i.unit,
  })),
  null,
  2
)}

- Recent Transactions Count: ${transactions.length}
${transactions.length > 0 ? `Most recent transaction: ${JSON.stringify(transactions[0])}` : ""}

INTENTS:
1. "UNDO_LAST":
   - Triggered when user asks to cancel, delete, undo, or reverse the last entry.
   - Phrases: "pichli entry cancel kar do", "last entry delete karo", "undo", "cancel last entry", "pichli entry hata do", "पिछली एंट्री कैंसिल कर दो", "पिछला हटाओ", "गलत लिख दिया".
   - Return intent: "UNDO_LAST", actions: [], voice_response_hi: "Pichli entry cancel kar di gayi hai.", query_answer_hi: "The most recent transaction has been cancelled and reversed."

2. "QUERY":
   - Triggered for analytical or ledger questions:
     * "Sabse zyada udhaar kiska baaki hai?" / "highest debtor": identify the customer with the highest positive balance.
     * "Kaun sa samaan kam hai?" / "low stock": list inventory items where stock <= 5 units.
     * "Aaj ka hisaab batao" / "today's summary": summarize total sales, collections, and total credit.
     * "Aaj kiska udhaar baaki hai?": list all customers with balance > 0.
     * Specific customer balance questions (e.g., "Sharma ji ka kitna baaki hai?").
   - Set intent: "QUERY", actions: [], query_answer_hi: detailed English summary, voice_response_hi: spoken Hinglish answer under 15 words.

3. "TRANSACTION":
   - Record UDHAAR (credit given) or JAMA (payment received).
   - Convert Devanagari customer names to clean English ("अंकित" -> "Ankit").
   - Map items accurately to inventory names:
     * चीनी / cheeni / sugar -> "Cheeni / Sugar" (₹44/kg)
     * अमूल बटर / butter -> "Amul Butter" (₹56/pack)
     * आटा / atta -> "Aashirvaad Atta" (₹45/kg)
     * तेल / tel / oil -> "Fortune Sunflower Oil" (₹135/L)
     * दाल / dal / toor -> "Toor Dal" (₹160/kg)
     * नमक / salt -> "Tata Salt" (₹28/kg)
     * मैगी / maggi -> "Maggi Noodles" (₹14/pack)
     * चाय / tea -> "Red Label Tea" (₹140/pack)
   - Compute exact totals: qty * unit_price. Sum all items for total_amount.
   - voice_response_hi: e.g. "Ankit ke 144 rupaye udhaar darj ho gaye."

4. "CLARIFICATION_NEEDED":
   - If audio is unclear or neither items nor amounts can be determined.

Output JSON Schema:
{
  "intent": "TRANSACTION" | "QUERY" | "CLARIFICATION_NEEDED" | "UNDO_LAST",
  "confidence": number,
  "clarification_question_hi": string | null,
  "voice_response_hi": string,
  "actions": [
    {
      "customer_name": string,
      "transaction_type": "UDHAAR" | "JAMA",
      "items": [
        {
          "name": string,
          "qty": number,
          "unit": string,
          "unit_price": number,
          "total": number
        }
      ],
      "total_amount": number
    }
  ],
  "query_answer_hi": string | null
}
`;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const prompt = `${systemInstruction}\n\nSpoken Merchant Voice Transcript: "${transcript}"\nGenerate the JSON output:`;

        const generatePromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 8000)
        );

        const result: any = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response.text();
        const parsed: VoiceProcessResponse = JSON.parse(responseText);
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
      voice_response_hi: "Gemini API key configure nahi hai, Vercel settings check karein.",
      actions: [],
      query_answer_hi: "Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY in Vercel Project Settings > Environment Variables.",
    } as VoiceProcessResponse);
  }

  // Fallback parser handling UNDO_LAST, Conversational Analytics, and Transactions
  const parsedResponse = parseBilingualLocally(transcript, customers, inventory, transactions);
  return NextResponse.json(parsedResponse);
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
      voice_response_hi: "Pichli entry cancel kar di gayi hai.",
      actions: [],
      query_answer_hi: "The most recent transaction has been cancelled and reversed.",
    };
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
      return {
        intent: "QUERY",
        confidence: 0.98,
        clarification_question_hi: null,
        voice_response_hi: `${top.name} ke sabse zyada ${top.balance} rupaye baaki hain.`,
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
        voice_response_hi: "Kisi bhi grahak ka udhaar baaki nahi hai.",
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
        voice_response_hi: `${spokenNames} ka stock 5 se kam bacha hai.`,
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
        voice_response_hi: "Sabhi samaan ka stock paryapt hai.",
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
      voice_response_hi: `Aaj ki bikri ${todaySales} rupaye aur jama ${todayJama} rupaye hai.`,
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
        return {
          intent: "QUERY",
          confidence: 0.95,
          clarification_question_hi: null,
          voice_response_hi: `${c.name} ke ${c.balance} rupaye baaki hain.`,
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
      voice_response_hi: `${overdue.length} grahakon ke kul ${totalBaaki} rupaye baaki hain.`,
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
    return {
      intent: "TRANSACTION",
      confidence: 0.95,
      clarification_question_hi: null,
      voice_response_hi: `${customerName} ke ${amt} rupaye jama darj ho gaye.`,
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

  // 4. Match Catalog Items (Devanagari & Roman)
  const items: VoiceActionItem[] = [];
  let totalAmount = 0;

  const getQty = (regexStr: string, defaultQty: number = 1): number => {
    const match = text.match(new RegExp(regexStr, "i"));
    if (!match) return defaultQty;
    const val = match[1]?.trim();
    if (val === "2" || val === "दो") return 2;
    if (val === "1" || val === "एक") return 1;
    if (val === "3" || val === "तीन") return 3;
    if (val === "4" || val === "चार") return 4;
    if (val === "5" || val === "पांच") return 5;
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultQty : num;
  };

  // Cheeni / Sugar (₹44/kg)
  if (text.includes("चीनी") || lower.includes("cheeni") || lower.includes("chini") || lower.includes("sugar")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:किलो|kg|kilo)?\\s*(?:चीनी|cheeni|chini|sugar))", 1);
    const price = 44;
    const total = qty * price;
    items.push({ name: "Cheeni / Sugar", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Amul Butter (₹56/pack)
  if (text.includes("बटर") || text.includes("मक्खन") || lower.includes("butter") || lower.includes("makhan")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:पैकेट|pack|packet)?\\s*(?:अमूल\\s*)?(?:बटर|मक्खन|butter|makhan))", 1);
    const price = 56;
    const total = qty * price;
    items.push({ name: "Amul Butter", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  // Aashirvaad Atta (₹45/kg)
  if (text.includes("आटा") || lower.includes("aata") || lower.includes("atta")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:किलो|kg|kilo)?\\s*(?:आटा|aata|atta))", 2);
    const price = 45;
    const total = qty * price;
    items.push({ name: "Aashirvaad Atta", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Fortune Sunflower Oil (₹135/L)
  if (text.includes("तेल") || lower.includes("tel") || lower.includes("oil") || lower.includes("fortune")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:लीटर|liter|litre|l)?\\s*(?:तेल|tel|oil))", 1);
    const price = 135;
    const total = qty * price;
    items.push({ name: "Fortune Sunflower Oil", qty, unit: "L", unit_price: price, total });
    totalAmount += total;
  }

  // Toor Dal (₹160/kg)
  if (text.includes("दाल") || lower.includes("dal") || lower.includes("daal") || lower.includes("toor")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:किलो|kg|kilo)?\\s*(?:दाल|dal|daal|toor))", 1);
    const price = 160;
    const total = qty * price;
    items.push({ name: "Toor Dal", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Tata Salt (₹28/kg)
  if (text.includes("नमक") || lower.includes("salt") || lower.includes("namak")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:किलो|kg|kilo)?\\s*(?:नमक|salt|namak))", 1);
    const price = 28;
    const total = qty * price;
    items.push({ name: "Tata Salt", qty, unit: "kg", unit_price: price, total });
    totalAmount += total;
  }

  // Maggi Noodles (₹14/pack)
  if (text.includes("मैगी") || text.includes("नूडल्स") || lower.includes("maggi") || lower.includes("noodles")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:पैकेट|pack)?\\s*(?:मैगी|maggi|noodles))", 1);
    const price = 14;
    const total = qty * price;
    items.push({ name: "Maggi Noodles", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  // Red Label Tea (₹140/pack)
  if (text.includes("चाय") || lower.includes("chai") || lower.includes("tea")) {
    const qty = getQty("(?:(\\d+|एक|दो|तीन|चार|पांच)\\s*(?:पैकेट|pack)?\\s*(?:चाय|chai|tea))", 1);
    const price = 140;
    const total = qty * price;
    items.push({ name: "Red Label Tea", qty, unit: "pack", unit_price: price, total });
    totalAmount += total;
  }

  if (items.length === 0) {
    return {
      intent: "CLARIFICATION_NEEDED",
      confidence: 0.4,
      clarification_question_hi: "Could not identify items or amount. Please repeat customer name and items clearly.",
      voice_response_hi: "Samaan ya rashi samajh nahi aayi, kripya dobara bolein.",
      actions: [],
      query_answer_hi: null,
    };
  }

  const voice_response_hi = `${customerName} ke ${totalAmount} rupaye udhaar darj ho gaye.`;

  return {
    intent: "TRANSACTION",
    confidence: 0.95,
    clarification_question_hi: null,
    voice_response_hi,
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
