export interface CrmStatusConfigItem {
  id: string;
  key: string;
  label: string;
  color: string;
  orderIndex: number;
  isDefault: boolean;
  isWon: boolean;
  isLost: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    leads: number;
  };
}

export const PRESET_STATUS_COLORS = [
  { name: "Blue (Biru)", hex: "#2563eb" },
  { name: "Amber (Kuning / Oranye)", hex: "#d97706" },
  { name: "Purple (Ungu)", hex: "#9333ea" },
  { name: "Emerald (Hijau Deal)", hex: "#059669" },
  { name: "Rose (Merah Batal)", hex: "#e11d48" },
  { name: "Indigo (Nila)", hex: "#4f46e5" },
  { name: "Sky (Biru Muda)", hex: "#0284c7" },
  { name: "Orange (Jingga)", hex: "#ea580c" },
  { name: "Teal (Toska)", hex: "#0d9488" },
  { name: "Stone (Abu-abu)", hex: "#4b5563" },
];

export const DEFAULT_STATUS_FALLBACKS: Record<string, { label: string; color: string }> = {
  NEW: { label: "Lead Baru", color: "#2563eb" },
  IN_PROGRESS: { label: "Follow Up", color: "#d97706" },
  QUOTATION_SENT: { label: "Quotation Terkirim", color: "#9333ea" },
  WON: { label: "Deal / SPK Terbit", color: "#059669" },
  LOST: { label: "Batal / Lost", color: "#e11d48" },
  CLOSED: { label: "Selesai", color: "#4b5563" },
};
