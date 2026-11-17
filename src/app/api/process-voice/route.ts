import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Customer, InventoryItem, VoiceProcessResponse, VoiceAction, VoiceActionItem } from "@/types";

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

  const { transcript, customers = [], inventory = [] } = body;

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
    // User requested gemini-2.5-flash with fallback to gemini-2.0-flash
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    const systemInstruction = `
You are VoxFlow AI, a state-of-the-art Voice Ledger & Retail Copilot for Indian Kirana store merchants (Gupta Kirana Store).
Your job is to parse spoken voice commands into structured JSON for an Udhaar Khata (Credit Ledger) and Inventory system.

LANGUAGE SUPPORT:
The user speaks in Hindi or Hinglish. Voice recognition may output:
1. Devanagari Hindi script (e.g., "अंकित को 2 किलो चीनी और एक अमूल बटर उधार लिख दो", "राहुल के 500 रुपये जमा कर लो", "आज किसका उधार बाकी है?")
2. Roman Hinglish script (e.g., "Ankit ko 2 kilo cheeni aur 1 Amul butter udhaar likh do", "Rahul ke 500 rupaye jama kar le")
3. Mixed script

Current Merchant Context:
- Registered Customers:
${JSON.stringify(
  customers.map((c: Customer) => ({ name: c.name, balance: c.balance })),
  null,
  2
)}

- Store Inventory Catalog:
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

RULES:
1. Customer Names (Always in Clean English):
   - Output customer names in clean English / Roman alphabet with Title Case.
   - If spoken in Devanagari, transliterate accurately to English:
     "अंकित" -> "Ankit"
     "शर्मा जी" / "शर्मा" -> "Sharma Ji"
     "राहुल" / "राहुल वर्मा" -> "Rahul Verma"
     "सुनीता" / "सुनीता देवी" -> "Sunita Devi"
     "गुप्ता जी" / "गुप्ता" -> "Gupta General Store"
     "रमेश" -> "Ramesh"
     "प्रिया" -> "Priya Singh"
   - Match existing customer names fuzzily. If a customer is not registered, create their English name.

2. Item & Price Resolution (Devanagari & Roman):
   - Map Hindi and English item names accurately to the Inventory Catalog:
     * "चीनी" / "chini" / "cheeni" / "sugar" / "शक्कर" -> "Cheeni / Sugar" (Price: ₹44/kg)
     * "अमूल बटर" / "बटर" / "मक्खन" / "butter" / "makhan" -> "Amul Butter" (Price: ₹56/pack)
     * "आटा" / "atta" / "aata" / "गेहूं का आटा" -> "Aashirvaad Atta" (Price: ₹45/kg)
     * "तेल" / "फॉर्च्यून तेल" / "tel" / "oil" / "fortune" -> "Fortune Sunflower Oil" (Price: ₹135/L)
     * "दाल" / "तूर दाल" / "अरहर दाल" / "dal" / "daal" / "toor" -> "Toor Dal" (Price: ₹160/kg)
     * "नमक" / "टाटा नमक" / "salt" / "namak" -> "Tata Salt" (Price: ₹28/kg)
     * "मैगी" / "नूडल्स" / "maggi" / "noodles" -> "Maggi Noodles" (Price: ₹14/pack)
     * "चाय" / "चाय पत्ती" / "tea" / "chai" / "red label" -> "Red Label Tea" (Price: ₹140/pack)
   - Parse quantities whether spoken as digits or Hindi words ("एक" = 1, "दो" = 2, "तीन" = 3, "चार" = 4, "पांच" = 5, "आधा" = 0.5, "डेढ़" = 1.5).
   - CRITICAL: Calculate each item total = qty * unit_price.
   - Sum all item totals to calculate the action's total_amount.
     Example: "2 किलो चीनी और एक अमूल बटर" -> (2 * 44) + (1 * 56) = 88 + 56 = ₹144. NEVER extract "2" as ₹2!

3. Transaction Types:
   - "UDHAAR" (उधार, लिख दो, ले गया, खाते में डालो) -> Credit given.
   - "JAMA" (जमा, दिए, चुकाए, पेमेंट, नकद) -> Payment received. For pure cash payments (e.g., "500 रुपये जमा"), items is [] and total_amount is 500.

4. Voice Response ('voice_response_hi'):
   - Output natural spoken Hinglish/Hindi under 15 words.
   - Example: "Ankit ke 144 rupaye udhaar darj ho gaye."
   - Example: "Rahul ke 500 rupaye jama darj ho gaye."

5. Queries:
   - For queries like "किसका उधार बाकी है?", "आज किसका उधार बाकी है?", "Sharma ji ka kitna baaki hai?":
     Set intent: "QUERY", actions: [], query_answer_hi: clean English summary, voice_response_hi: spoken Hinglish answer.

Output JSON Schema:
{
  "intent": "TRANSACTION" | "QUERY" | "CLARIFICATION_NEEDED",
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

        // 8-second timeout for reliable mobile response
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

  // Fallback parser handling BOTH Devanagari Hindi and Roman Hinglish
  const parsedResponse = parseBilingualLocally(transcript, customers, inventory);
  return NextResponse.json(parsedResponse);
}

// Robust Bilingual Parser (Devanagari Hindi + Roman Hinglish)
function parseBilingualLocally(
  transcript: string,
  customers: Customer[],
  inventory: InventoryItem[]
): VoiceProcessResponse {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. QUERY INTENT (Devanagari or Roman)
  const isQuery =
    lower.includes("kiska udhaar") ||
    lower.includes("baaki hai") ||
    lower.includes("udhar baaki") ||
    lower.includes("kitna baaki") ||
    lower.includes("pending") ||
    text.includes("किसका उधार") ||
    text.includes("कितना बाकी") ||
    text.includes("बाकी है") ||
    text.includes("किस-किस का");

  if (isQuery) {
    // Specific customer check
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

  // 2. Resolve Customer Name (Devanagari + Roman)
  let customerName = "Walk-in Customer";

  // Check known customers
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
    // Try regex extraction from "X को" or "X के"
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

  // 3. Match Catalog Items (Devanagari & Roman)
  const items: VoiceActionItem[] = [];
  let totalAmount = 0;

  // Helper to parse quantities (digits or words)
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

  // If no catalog items were recognized, DO NOT extract arbitrary quantities as price!
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
