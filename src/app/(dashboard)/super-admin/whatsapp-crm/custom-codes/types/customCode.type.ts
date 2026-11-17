export interface CustomCodeItem {
  id: string;
  code: string;
  label: string;
  type: "LEAD_SOURCE" | "CS_AGENT_CODE";
  channel?: string | null;
  leadUrlRef?: string | null;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    leads: number;
  };
}

export const MEDIA_CHANNELS = [
  { value: "Website / Katalog", label: "Website / Katalog Online" },
  { value: "Instagram Ads", label: "Instagram (Bio / Iklan)" },
  { value: "TikTok", label: "TikTok (Bio / Video)" },
  { value: "Facebook Ads", label: "Facebook Ads" },
  { value: "Packaging & Hangtag", label: "Packaging, Hangtag & QR Label" },
  { value: "Pameran / Event", label: "Pameran, Brosur & Event Offline" },
  { value: "Lainnya", label: "Saluran Lainnya" },
] as const;

export type MediaChannelType = (typeof MEDIA_CHANNELS)[number]["value"];
