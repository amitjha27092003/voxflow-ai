export interface StoreProfile {
  storeName: string;
  ownerName: string;
  address: string;
  timings: string;
  upiId: string;
  phone: string;
}

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
  type: "UDHAAR" | "JAMA" | "EXPENSE" | "SPLIT";
  items: LedgerItem[];
  totalAmount: number;
  timestamp: string; // ISO string
  rawVoiceTranscript?: string;
  splitDetails?: {
    paidAmount: number;
    udhaarAmount: number;
    paymentMode?: string;
  };
  expenseCategory?: string;
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
  transaction_type: "UDHAAR" | "JAMA" | "EXPENSE" | "SPLIT";
  items: VoiceActionItem[];
  total_amount: number;
  split_details?: {
    paid_amount: number;
    udhaar_amount: number;
    payment_mode?: string;
  };
}

export interface RestockItem {
  name: string;
  qty: number;
  unit: string;
}

export interface ItemUpdateDetails {
  action: "UPDATE_PRICE" | "CREATE_ITEM";
  name: string;
  unitPrice: number;
  unit?: string;
  stock?: number;
  category?: string;
}

export interface ExpenseDetails {
  title: string;
  amount: number;
  category?: string;
}

export interface StoreUpdateDetails {
  storeName?: string;
  ownerName?: string;
  address?: string;
  timings?: string;
  upiId?: string;
  phone?: string;
}

export interface VoiceProcessResponse {
  intent: "TRANSACTION" | "QUERY" | "CLARIFICATION_NEEDED" | "UNDO_LAST" | "RESTOCK" | "EXPENSE" | "UPDATE_ITEM" | "UPDATE_STORE";
  confidence: number;
  clarification_question_hi: string | null;
  voice_response_hi: string;
  voiceFeedback?: string; // Clean Roman Hinglish for on-screen UI toast
  ttsText?: string; // Natural Devanagari Hindi script specifically for TTS audio engine
  actions: VoiceAction[];
  restock_items?: RestockItem[];
  expense_details?: ExpenseDetails;
  item_update?: ItemUpdateDetails;
  store_update?: StoreUpdateDetails;
  query_answer_hi: string | null;
  insight_data?: {
    type?: "DEBTOR" | "INVENTORY" | "SUMMARY";
    title?: string;
    metrics?: Record<string, any>;
  };
}
