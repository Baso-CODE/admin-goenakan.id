export interface CrmMessageTemplateItem {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  shortcut?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

export const PRESET_TEMPLATE_CATEGORIES = [
  "Salam",
  "Pemesanan",
  "Katalog",
  "Pembayaran",
  "Follow Up",
  "Komplain",
  "Umum",
];
