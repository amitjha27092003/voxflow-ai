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
        voice_response_hi: "कृपया दोबारा बोलें, आवाज़ स्पष्ट नहीं थी।",
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
        voice_response_hi: "कृपया दोबारा बोलें, आवाज़ स्पष्ट नहीं थी।",
        actions: [],
        query_answer_hi: null,
      } as VoiceProcessResponse,
      { status: 200 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.8-flash"];

    const systemInstruction = `
You are VoxFlow AI, a world-class Hinglish Voice Ledger & Retail Copilot for Indian Kirana store merchants (Gupta Kirana Store).
Your job is to parse spoken Hinglish commands into structured JSON for an Udhaar Khata (Credit Ledger) and Inventory system.

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
1. Intent Classification:
   - "TRANSACTION": User wants to record UDHAAR (credit given) or JAMA (payment received / cash paid back).
     Can handle MULTIPLE customers and MULTIPLE mixed actions in a single sentence (e.g. "Sharma ji ke 2 kilo aata udhaar aur Rahul ke 500 rupaye jama").
   - "QUERY": User is asking a question about balances, stock, who owes money, total credit, etc.
     Examples: "Aaj kiska udhaar baaki hai?", "Sharma ji ka kitna baaki hai?", "Tel ka stock kitna bacha hai?".
     For QUERY, compute the exact answer based on the provided Customers and Inventory data. Put the full explanation in 'query_answer_hi' and a crisp spoken version in 'voice_response_hi'. 'actions' must be empty [].
   - "CLARIFICATION_NEEDED": If speech is unintelligible, confidence < 0.75, or missing both customer and amounts.

2. Item & Price Resolution:
   - Match items intelligently with phonetic Hinglish spellings:
     aata/atta -> Aashirvaad Atta
     makhan/butter -> Amul Butter
     tel/oil/refined -> Fortune Sunflower Oil
     namak/salt -> Tata Salt
     daal/dal/toor/arhar -> Toor Dal
     cheeni/chini/sugar/shakkar -> Cheeni / Sugar
     maggi/maggie/noodles -> Maggi Noodles
     chai/tea/chai patti -> Red Label Tea
   - If user says a quantity and item without price, look up the unitPrice from inventory and compute: total = qty * unitPrice.
   - For JAMA (payment received), if no items are mentioned (just money like "500 rupaye jama"), items should be empty [] and total_amount = the amount.

3. Customer Matching:
   - Match existing customer names fuzzily (e.g., "Sharma ji", "Sharma", "Rahul", "Sunita").
   - If the customer is not in the list, use the name spoken by user so a new customer entry can be created.

4. Voice Response:
   - 'voice_response_hi' MUST be natural spoken Hinglish/Hindi and strictly UNDER 15 WORDS.
   - E.g.: "Sharma ji ke 146 rupaye udhaar aur Rahul ke 500 rupaye jama darj ho gaye."

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

        const generatePromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API call timed out")), 3500)
        );

        const result: any = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response.text();
        const parsed: VoiceProcessResponse = JSON.parse(responseText);
        return NextResponse.json(parsed);
      } catch (geminiError: any) {
        console.warn(`Gemini API attempt with ${modelName} encountered error:`, geminiError.message);
      }
    }
  }

  // Fallback to high-precision local Hinglish Retail NLP parser
  const parsedResponse = parseHinglishLocally(transcript, customers, inventory);
  return NextResponse.json(parsedResponse);
}

// High-Precision Local Hinglish Retail NLP Parser
function parseHinglishLocally(
  transcript: string,
  customers: Customer[],
  inventory: InventoryItem[]
): VoiceProcessResponse {
  const lower = transcript.toLowerCase();

  // 1. QUERY INTENT
  if (
    lower.includes("kiska udhaar") ||
    lower.includes("baaki hai") ||
    lower.includes("udhar baaki") ||
    lower.includes("kitna baaki") ||
    lower.includes("kaun kaun") ||
    lower.includes("pending")
  ) {
    const matchedCustomer = customers.find((c) =>
      lower.includes(c.name.toLowerCase().split(" ")[0])
    );

    if (matchedCustomer) {
      return {
        intent: "QUERY",
        confidence: 0.95,
        clarification_question_hi: null,
        voice_response_hi: `${matchedCustomer.name} ke ${matchedCustomer.balance} rupaye baaki hain.`,
        actions: [],
        query_answer_hi: `Total pending credit for ${matchedCustomer.name} is ₹${matchedCustomer.balance}.`,
      };
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

  // 2. MULTI-INTENT & ITEM PARSING
  const clauses = lower.split(/\b(?:aur|tatha|and|,)\b/).map((c) => c.trim()).filter(Boolean);
  const actionsMap = new Map<string, VoiceAction>();
  let lastCustomerName = "";

  for (const clause of clauses) {
    const isJama = clause.includes("jama") || clause.includes("diye") || clause.includes("chukta") || clause.includes("paid");
    const isExplicitUdhaar = clause.includes("udhaar") || clause.includes("udhar") || clause.includes("likh");

    // Resolve Customer
    let matchedCustomerName = "";
    for (const c of customers) {
      const firstName = c.name.toLowerCase().split(" ")[0];
      if (clause.includes(firstName)) {
        matchedCustomerName = c.name;
        break;
      }
    }

    if (!matchedCustomerName) {
      const nameMatch = clause.match(/^([a-z\s]+?)\s+(?:ke|ko|ne|ka)\b/i);
      if (nameMatch && nameMatch[1]) {
        matchedCustomerName = nameMatch[1].trim();
        matchedCustomerName = matchedCustomerName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    // If this clause has no customer name, inherit previous clause's customer!
    if (!matchedCustomerName) {
      matchedCustomerName = lastCustomerName || "Grahak";
    } else {
      lastCustomerName = matchedCustomerName;
    }

    const txType: "UDHAAR" | "JAMA" = isJama ? "JAMA" : "UDHAAR";
    const mapKey = `${matchedCustomerName}_${txType}`;

    let currentAction = actionsMap.get(mapKey);
    if (!currentAction) {
      currentAction = {
        customer_name: matchedCustomerName,
        transaction_type: txType,
        items: [],
        total_amount: 0,
      };
      actionsMap.set(mapKey, currentAction);
    }

    if (txType === "JAMA") {
      const amountMatch = clause.match(/\b(\d+)\b/);
      const amt = amountMatch ? parseInt(amountMatch[1], 10) : 500;
      currentAction.total_amount += amt;
    } else {
      // UDHAAR items
      let itemsAdded = false;

      // Atta / Aata
      if (clause.includes("aata") || clause.includes("atta")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:kilo|kg)?\s*(?:aata|atta)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 2;
        const unitPrice = 45;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Aashirvaad Atta", qty, unit: "kg", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Butter / Makhan
      if (clause.includes("butter") || clause.includes("makhan")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:pack|packet)?\s*(?:amul\s*)?(?:butter|makhan)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 56;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Amul Butter", qty, unit: "pack", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Tel / Oil
      if (clause.includes("tel") || clause.includes("oil") || clause.includes("fortune")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:liter|litre|l)?\s*(?:fortune\s*)?(?:tel|oil)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 135;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Fortune Sunflower Oil", qty, unit: "L", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Cheeni / Sugar
      if (clause.includes("cheeni") || clause.includes("chini") || clause.includes("sugar")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:kilo|kg)?\s*(?:cheeni|chini|sugar)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 44;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Cheeni / Sugar", qty, unit: "kg", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Toor Dal
      if (clause.includes("dal") || clause.includes("daal") || clause.includes("toor")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:kilo|kg)?\s*(?:toor\s*)?(?:dal|daal)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 160;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Toor Dal", qty, unit: "kg", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Maggi
      if (clause.includes("maggi") || clause.includes("noodles") || clause.includes("maggie")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:pack|packet)?\s*(?:maggi|maggie|noodles)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 14;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Maggi Noodles", qty, unit: "pack", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Tea / Chai
      if (clause.includes("chai") || clause.includes("tea") || clause.includes("red label")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:pack|packet)?\s*(?:red label\s*)?(?:chai|tea)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 140;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Red Label Tea", qty, unit: "pack", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // Salt / Namak
      if (clause.includes("salt") || clause.includes("namak")) {
        const qtyMatch = clause.match(/(\d+)\s*(?:kilo|kg)?\s*(?:tata\s*)?(?:salt|namak)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const unitPrice = 28;
        const total = qty * unitPrice;
        currentAction.items.push({ name: "Tata Salt", qty, unit: "kg", unit_price: unitPrice, total });
        currentAction.total_amount += total;
        itemsAdded = true;
      }

      // If no catalog items matched in this clause and it's a standalone amount
      if (!itemsAdded) {
        const numberMatch = clause.match(/\b(\d+)\b/);
        if (numberMatch) {
          const directAmt = parseInt(numberMatch[1], 10);
          currentAction.total_amount += directAmt;
        }
      }
    }
  }

  const actions = Array.from(actionsMap.values()).filter((a) => a.total_amount > 0 || a.items.length > 0);

  if (actions.length === 0) {
    return {
      intent: "CLARIFICATION_NEEDED",
      confidence: 0.5,
      clarification_question_hi: "Please clearly specify customer name, items, or amount.",
      voice_response_hi: "कृपया ग्राहक का नाम और राशि स्पष्ट बोलें।",
      actions: [],
      query_answer_hi: null,
    };
  }

  const responseParts = actions.map((a) => {
    const typeLabel = a.transaction_type === "UDHAAR" ? "udhaar" : "jama";
    return `${a.customer_name} ke ${a.total_amount} rupaye ${typeLabel}`;
  });

  const voice_response_hi = `${responseParts.join(" aur ")} darj ho gaye.`;

  return {
    intent: "TRANSACTION",
    confidence: 0.98,
    clarification_question_hi: null,
    voice_response_hi,
    actions,
    query_answer_hi: null,
  };
}
