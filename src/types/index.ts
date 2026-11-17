export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive = Udhaar (pending from customer), Negative/Zero = Paid/Advance
  lastActivity?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  unit: string;
  category?: string;
  aliases?: string[];
}

export interface LedgerItem {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: "UDHAAR" | "JAMA";
  items: LedgerItem[];
  totalAmount: number;
  timestamp: string; // ISO string
  rawVoiceTranscript?: string;
}

export interface VoiceActionItem {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface VoiceAction {
  customer_name: string;
  transaction_type: "UDHAAR" | "JAMA";
  items: VoiceActionItem[];
  total_amount: number;
}

export interface VoiceProcessResponse {
  intent: "TRANSACTION" | "QUERY" | "CLARIFICATION_NEEDED";
  confidence: number;
  clarification_question_hi: string | null;
  voice_response_hi: string;
  actions: VoiceAction[];
  query_answer_hi: string | null;
}
