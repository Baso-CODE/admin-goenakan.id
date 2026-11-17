export interface CrmLabelConfigItem {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  orderIndex: number;
  leadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export const PRESET_LABEL_COLORS = [
  { name: "Emerald", color: "#059669" },
  { name: "Blue", color: "#2563eb" },
  { name: "Purple", color: "#9333ea" },
  { name: "Amber", color: "#d97706" },
  { name: "Rose", color: "#e11d48" },
  { name: "Cyan", color: "#0891b2" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Teal", color: "#0d9488" },
  { name: "Orange", color: "#ea580c" },
  { name: "Stone", color: "#57534e" },
];
