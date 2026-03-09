export interface OrderProduct {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customization: string;
  remarks: string;
  billedQuantity?: number;
  remainingQuantity?: number;
  billedAmount?: number;
  remainingBilledAmount?: number;
}

export interface OrderVendor {
  id: string;
  companyName: string;
  picName: string;
  picPhone: string;
  role: string;
}

export interface OrderInvoice {
  id: number;
  invoiceNumber: string | null;
  createdAt: string;
  dueDate: string | null;
  totalAmount: number;
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
  category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
}

export interface OrderDetail {
  id: string;
  poNumber: string;
  dateOrder: string;
  salesCategory: "SALES" | "SAMPLE";
  shippingAddress: string;
  totalAmount: number;
  createdAt: string;
  purchaseChannelName: string;
  clientInfo: {
    name: string;
    phone: string;
    email: string;
    type: string;
    picName: string;
    picPhone: string;
  };
  sales: {
    name: string;
    phone: string;
  };
  products: OrderProduct[];
  vendors: OrderVendor[];
  invoices: OrderInvoice[];
  sampleFollowUps: SampleFollowUp[];
}

export interface NoteCategory {
  id: string;
  name: string;
  templates: { id: string; title: string; content: string }[];
}

export interface InvoiceNote {
  categoryId: string;
  contents: string[];
}

export interface SplitItem {
  productId: string;
  quantity: number;
  maxQty: number;
  price: number;
}
export type SampleFollowUp = {
  id: string;
  name: string;
  date: string;
  isDone: boolean;
  createdAt: string;
};
