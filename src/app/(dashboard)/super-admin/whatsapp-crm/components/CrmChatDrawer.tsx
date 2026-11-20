"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  KeyRound,
  Loader2,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  User,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CrmLeadItem } from "./LeadCardItem";
import { parseWhatsappClickAttribution } from "../types/crmAttribution.type";
import { CrmStatusConfigItem, DEFAULT_STATUS_FALLBACKS } from "../types/crmStatus.type";
import { CrmLabelConfigItem } from "../types/crmLabel.type";
import { CrmMessageTemplateItem } from "../types/crmTemplate.type";
import { QuickAddStatusDialog } from "./QuickAddStatusDialog";

// Lazy-load Emoji Picker to prevent SSR lag
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="w-[320px] h-[360px] flex flex-col items-center justify-center bg-white rounded-xl shadow-lg border border-stone-200 text-stone-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
      <span className="text-xs">Memuat emoji...</span>
    </div>
  ),
});

interface CrmNoteItem {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface PendingAttachment {
  file: File;
  dataUrl: string;
  name: string;
  sizeFormatted: string;
  isImage: boolean;
  mimetype: string;
  sendAsDocument: boolean;
}

interface CrmChatDrawerProps {
  lead: CrmLeadItem | null;
  open: boolean;
  sessionId?: string;
  onClose: () => void;
  onLeadUpdated?: (updated: Partial<CrmLeadItem> & { id: string }) => void;
  csUsers: Array<{ id: string; name?: string | null; email?: string | null }>;
  statuses?: CrmStatusConfigItem[];
  onStatusCreated?: (newStatus: CrmStatusConfigItem, targetLeadId?: string | null) => void;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadAttachment(url: string, filename?: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "lampiran";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err: any) {
    toast.error("Gagal mengunduh file: " + (err.message || "Unknown error"));
  }
}

function processAttachmentFile(file: File, forceAsDocument = false): Promise<PendingAttachment | null> {
  return new Promise((resolve) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error(`Ukuran file melebihi batas maksimal 10 MB (${formatFileSize(file.size)})`);
      resolve(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        file,
        dataUrl: reader.result as string,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        isImage,
        mimetype: file.type || (isImage ? "image/jpeg" : "application/octet-stream"),
        sendAsDocument: forceAsDocument || !isImage,
      });
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file");
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

const PRESET_LABELS = [
  "B2B Corporate",
  "Repeat Order",
  "Sample Request",
  "Komunitas / Event",
  "Urgent Deadline",
  "Pricelist Info",
  "Custom Printing",
  "Vendor",
];

const QUICK_REPLIES = [
  {
    title: "Salam & Sambutan",
    text: "Halo Kak! Terima kasih telah menghubungi Goenakan.id. Ada yang bisa kami bantu untuk kebutuhan seragam atau merchandise custom Anda?",
  },
  {
    title: "Format Pemesanan Custom",
    text: "Untuk estimasi harga dan konsultasi desain, mohon dibantu informasi berikut ya Kak:\n1. Jenis Produk (Kaos/Polo/Kemeja/Jaket/Merch):\n2. Jumlah Qty (Pcs):\n3. Target Deadline Acara:\n4. Apakah sudah ada file logo/desain?",
  },
  {
    title: "Katalog & Pricelist",
    text: "Halo Kak, katalog pilihan bahan dan portofolio produk Goenakan.id dapat dilihat di tautan berikut: https://goenakan.id/catalog. Jika ada model yang disukai, silakan kirimkan referensinya ke sini ya!",
  },
  {
    title: "Rekening Pembayaran Resmi",
    text: "Berikut rekening pembayaran resmi Goenakan.id:\nBank BCA: 123-456-7890\na/n PT Goenakan Kreasi Nusantara\n\nMohon mengirimkan bukti transfer setelah pembayaran dilakukan ya Kak. Terima kasih! 🙏",
  },
];

const getChatId = (phone: string) => {
  let cleaned = phone.replace(/@c\.us$/i, "").replace(/@g\.us$/i, "").replace(/\D/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return `${cleaned}@c.us`;
};

// Safe helper to extract real media url from various WAHA / Baileys message structures
const getMediaInfo = (msg: any) => {
  const mediaUrl =
    msg.media?.url ||
    msg.mediaUrl ||
    (msg.media?.data
      ? msg.media.data.startsWith("data:")
        ? msg.media.data
        : `data:${msg.media.mimetype || "image/jpeg"};base64,${msg.media.data}`
      : null);

  const hasMedia = !!msg.hasMedia || !!mediaUrl;
  const isDoc =
    msg.media?.mimetype?.startsWith("application/") ||
    msg.media?.mimetype?.includes("pdf") ||
    msg.media?.mimetype?.includes("document") ||
    !!msg.media?.filename?.match(/\.(pdf|docx?|xlsx?|txt|zip)$/i);

  const isImage =
    !isDoc &&
    (msg.media?.mimetype?.startsWith("image/") ||
      mediaUrl?.startsWith("data:image/") ||
      !!mediaUrl?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ||
      (!isDoc && hasMedia));

  return {
    hasMedia,
    mediaUrl,
    isImage,
    isDoc,
    filename: msg.media?.filename || msg.mediaFilename || (isImage ? "gambar.jpg" : "dokumen"),
    mimetype: msg.media?.mimetype || (isImage ? "image/jpeg" : "application/octet-stream"),
  };
};

export function CrmChatDrawer({
  lead,
  open,
  sessionId,
  onClose,
  onLeadUpdated,
  csUsers,
  statuses,
  onStatusCreated,
}: CrmChatDrawerProps) {
  const { fetchApi } = useApi();
  const { data: session } = useSession();

  const currentUserId = session?.user?.id;
  const currentUserRole = String(session?.user?.role || "").toUpperCase();
  const isSupervisorOrAdmin = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "MANAGER"].includes(currentUserRole);
  const canAssignLead = isSupervisorOrAdmin || ((session?.user as any)?.permissions || []).includes("assign_crm_leads");

  // Chat Lock Protection state
  const [isSupervisorOverride, setIsSupervisorOverride] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [supervisorPinInput, setSupervisorPinInput] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Reset override whenever opened lead changes
  useEffect(() => {
    setIsSupervisorOverride(false);
    setIsPinDialogOpen(false);
    setSupervisorPinInput("");
  }, [lead?.id]);

  const assignedUserId = lead?.assignedToUserId;
  const assignedUser = lead?.assignedToUser || csUsers.find((u) => u.id === assignedUserId);
  const assignedCsName = assignedUser?.name || "CS Lain";
  const isAssignedToMe = Boolean(assignedUserId && currentUserId && assignedUserId === currentUserId);
  const isAssignedToOther = Boolean(assignedUserId && currentUserId && assignedUserId !== currentUserId);
  const isChatLocked = Boolean(isAssignedToOther && !isSupervisorOverride);

  const [activeTab, setActiveTab] = useState<"chat" | "info">("chat");

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Attachments & Emoji state
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename?: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Notes state
  const [notes, setNotes] = useState<CrmNoteItem[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Labels state
  const [currentLabels, setCurrentLabels] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [availableLabels, setAvailableLabels] = useState<CrmLabelConfigItem[]>([]);
  const [quickAddStatusOpen, setQuickAddStatusOpen] = useState(false);
  const [csSearchQuery, setCsSearchQuery] = useState("");
  const [csPopoverOpen, setCsPopoverOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [isAttachingCode, setIsAttachingCode] = useState(false);

  // Message templates (Quick Reply) state
  const [templates, setTemplates] = useState<CrmMessageTemplateItem[]>([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);

  // Slash (/) autocomplete state
  const [slashActive, setSlashActive] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashStartIndex, setSlashStartIndex] = useState<number>(-1);
  const [slashHighlightIndex, setSlashHighlightIndex] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const slashItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Combined templates list (from API or fallback)
  const availableTemplates: CrmMessageTemplateItem[] =
    templates.length > 0
      ? templates
      : QUICK_REPLIES.map((qr, idx) => ({
          id: String(idx),
          title: qr.title,
          content: qr.text,
          category: "Umum",
          shortcut: null,
          orderIndex: idx,
          createdAt: "",
        }));

  const filteredSlashTemplates = availableTemplates.filter((tpl) => {
    if (!slashQuery) return true;
    const q = slashQuery.toLowerCase();
    const shortcutClean = (tpl.shortcut || "").replace(/^\//, "").toLowerCase();
    return (
      shortcutClean.includes(q) ||
      tpl.title.toLowerCase().includes(q) ||
      (tpl.category && tpl.category.toLowerCase().includes(q)) ||
      tpl.content.toLowerCase().includes(q)
    );
  });

  // Handle message input change with slash autocomplete detection
  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursorPos);

    // Match slash shortcut at start of line or after whitespace: e.g. "/salam" or "halo /kat" or just "/"
    const match = textBefore.match(/(?:^|\s)\/([^\s/]*)$/);
    if (match) {
      const query = match[1];
      const matchIndex = match.index ?? 0;
      const slashIdx = matchIndex + (match[0].startsWith(" ") ? 1 : 0);
      setSlashActive(true);
      setSlashQuery(query);
      setSlashStartIndex(slashIdx);
      setSlashHighlightIndex(0);
    } else {
      setSlashActive(false);
      setSlashQuery("");
      setSlashStartIndex(-1);
    }
  };

  // Insert selected slash template into textarea
  const handleSelectSlashTemplate = (tpl: CrmMessageTemplateItem) => {
    const cursorPos = textareaRef.current?.selectionStart ?? messageInput.length;
    const startIdx = slashStartIndex >= 0 ? slashStartIndex : 0;
    const beforeSlash = messageInput.slice(0, startIdx);
    const afterCursor = messageInput.slice(cursorPos);
    const newText = beforeSlash + tpl.content + afterCursor;

    setMessageInput(newText);
    setSlashActive(false);
    setSlashQuery("");
    setSlashStartIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = beforeSlash.length + tpl.content.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 15);
  };

  // Scroll highlighted slash item into view
  useEffect(() => {
    if (slashActive && slashItemRefs.current[slashHighlightIndex]) {
      slashItemRefs.current[slashHighlightIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [slashHighlightIndex, slashActive]);

  // Click outside to dismiss slash autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setSlashActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCsUsers = csUsers.filter(
    (u) =>
      !csSearchQuery.trim() ||
      (u.name || "").toLowerCase().includes(csSearchQuery.trim().toLowerCase()) ||
      (u.email || "").toLowerCase().includes(csSearchQuery.trim().toLowerCase())
  );

  // Load configured labels from backend
  const loadAvailableLabels = useCallback(async () => {
    try {
      const res = await fetchApi("/crm/labels");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setAvailableLabels(json.data);
        }
      }
    } catch {
      // Ignore background label fetch failure
    }
  }, [fetchApi]);

  // Load message templates from backend
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetchApi("/crm/templates");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setTemplates(json.data);
        }
      }
    } catch {
      // Ignore background template fetch failure
    }
  }, [fetchApi]);

  useEffect(() => {
    if (open) {
      loadAvailableLabels();
      loadTemplates();
    }
  }, [open, loadAvailableLabels, loadTemplates]);

  // Sync internal state when lead changes
  useEffect(() => {
    if (lead) {
      setCurrentLabels(lead.labels || []);
    }
  }, [lead]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Fetch WhatsApp Messages for this selected chat ONLY
  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!lead?.phoneNumber) return;
      try {
        if (!silent) setIsLoadingMessages(true);
        const chatId = getChatId(lead.phoneNumber);
        const query = new URLSearchParams();
        if (sessionId) query.append("sessionId", sessionId);
        query.append("limit", "100");

        const res = await fetch(
          `/api/wa/chats/${encodeURIComponent(chatId)}/messages?${query.toString()}`
        );
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : [];
          // Sort ascending by timestamp so latest messages appear at bottom
          items.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(items);
          if (!silent) {
            setTimeout(() => scrollToBottom("instant"), 80);
          }

          // Otomatis deteksi & tautkan kode jika ada di riwayat 100 chat terakhir tapi lead belum tertaut
          if (lead?.id && !lead.whatsappClick && !lead.sourceCode) {
            for (const m of items) {
              const body = m.body || m.text || "";
              const dyn =
                body.match(/(?:Kode\s*(?:WA)?|Code|Ref)?\s*:?\s*(GK-[A-Za-z0-9_-]{3,12})/i) ||
                body.match(/\b(GK-[A-Za-z0-9_-]{3,12})\b/i);
              const stat = body.match(/(?:\[\s*)?(?:REF|CODE)\s*:\s*([A-Za-z0-9_-]+)(?:\s*\])?/i);
              const detected = dyn ? dyn[1].toUpperCase() : stat ? stat[1].toUpperCase() : null;
              if (detected) {
                fetchApi(`/crm/leads/${lead.id}/attach-code`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: detected }),
                })
                  .then((r) => r.json())
                  .then((json) => {
                    if (json.success && json.data) {
                      onLeadUpdated?.(json.data);
                      toast.success(`Jejak web (${detected}) otomatis terdeteksi & tertaut!`);
                    }
                  })
                  .catch(() => {});
                break;
              }
            }
          }
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [lead?.phoneNumber, sessionId, scrollToBottom]
  );

  // Fetch Internal Notes for this lead
  const fetchNotes = useCallback(async () => {
    if (!lead?.id) return;
    try {
      setIsLoadingNotes(true);
      const res = await fetchApi(`/crm/leads/${lead.id}/notes`);
      if (res.ok) {
        const json = await res.json();
        setNotes(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingNotes(false);
    }
  }, [lead?.id, fetchApi]);

  // Load chat and notes when drawer opens or lead changes
  useEffect(() => {
    if (open && lead?.id) {
      fetchMessages(false);
      fetchNotes();

      // Background silent auto-refresh every 6 seconds ONLY for this chat while drawer is open
      const timer = setInterval(() => {
        fetchMessages(true);
      }, 6000);

      return () => clearInterval(timer);
    } else {
      setIsDraggingFile(false);
      dragCounterRef.current = 0;
    }
  }, [open, lead?.id, fetchMessages, fetchNotes]);

  // Ensure scroll position remains at bottom when switching back to the "chat" tab
  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => {
        scrollToBottom("instant");
      }, 50);
    }
  }, [activeTab, scrollToBottom]);

  // Handle Emoji Selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageInput((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? messageInput.length;
    const end = textarea.selectionEnd ?? messageInput.length;
    const newText = messageInput.substring(0, start) + emoji + messageInput.substring(end);
    setMessageInput(newText);

    const nextPos = start + emoji.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  // Handle File Attachment Selection
  const handleSelectFile = useCallback(
    async (file: File, forceAsDocument = false) => {
      const processed = await processAttachmentFile(file, forceAsDocument);
      if (processed) {
        setPendingAttachment(processed);
        if (activeTab !== "chat") setActiveTab("chat");
        setTimeout(() => textareaRef.current?.focus(), 80);
      }
    },
    [activeTab]
  );

  // Drag and drop event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingFile(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const processed = await processAttachmentFile(file, false);
        if (processed) {
          setPendingAttachment(processed);
          if (activeTab !== "chat") setActiveTab("chat");
          setTimeout(() => textareaRef.current?.focus(), 80);
        }
      }
    },
    [activeTab]
  );

  // Handle Paste from Clipboard (allows pasting images)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleSelectFile(file, false);
          break;
        }
      }
    }
  };

  // Klaim chat ke akun saya (Lock to current CS)
  const handleClaimChat = async () => {
    if (!lead?.id) return;
    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengklaim chat");
      const json = await res.json();
      toast.success("Chat berhasil diklaim & dikunci ke akun Anda!");
      if (json.data) {
        onLeadUpdated?.(json.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengklaim chat");
    }
  };

  // Ambil alih chat (Takeover with optional supervisor PIN)
  const handleTakeoverChat = async (pin?: string) => {
    if (!lead?.id) return;
    try {
      setIsTakingOver(true);
      const res = await fetchApi(`/crm/leads/${lead.id}/takeover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengambil alih chat");
      }
      toast.success(json.message || "Chat berhasil diambil alih!");
      setIsPinDialogOpen(false);
      setSupervisorPinInput("");
      setIsSupervisorOverride(false);
      if (json.data) {
        onLeadUpdated?.(json.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil alih chat");
    } finally {
      setIsTakingOver(false);
    }
  };

  // Verifikasi PIN dan buka kunci sementara (Bypass)
  const handleVerifyPinAndUnlock = async () => {
    const pin = supervisorPinInput.trim();
    if (!pin) {
      toast.error("Masukkan kode supervisor");
      return;
    }
    try {
      setIsVerifyingPin(true);
      const res = await fetchApi("/crm/leads/verify-supervisor-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Kode supervisor salah");
      }
      toast.success("Otorisasi Supervisor Berhasil! Penguncian chat dibuka untuk sesi ini.");
      setIsSupervisorOverride(true);
      setIsPinDialogOpen(false);
      setSupervisorPinInput("");
    } catch (err: any) {
      toast.error(err.message || "Gagal memverifikasi kode");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Send message with optional attachment
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : messageInput.trim();
    if ((!text && !pendingAttachment) || !lead?.phoneNumber) return;

    if (isChatLocked) {
      toast.error(`Chat sedang dikunci oleh ${assignedCsName}. Buka dengan Kode Supervisor untuk membalas.`);
      return;
    }

    // Jika chat belum diklaim siapapun, otomatis klaim ke akun saat pesan dikirim
    if (!lead.assignedToUserId && currentUserId) {
      fetchApi(`/crm/leads/${lead.id}/claim`, { method: "POST" })
        .then((r) => r.json())
        .then((json) => {
          if (json.data) onLeadUpdated?.(json.data);
        })
        .catch(() => {});
    }

    const chatId = getChatId(lead.phoneNumber);
    const toSendAttachment = pendingAttachment;

    // Optimistic UI update: instantly show bubble in drawer
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: any = {
      id: tempId,
      body: text,
      text,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      status: "PENDING",
      hasMedia: !!toSendAttachment,
      media: toSendAttachment
        ? {
            url: toSendAttachment.dataUrl,
            filename: toSendAttachment.name,
            mimetype: toSendAttachment.mimetype,
          }
        : null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput("");
    setSlashActive(false);
    setSlashQuery("");
    setSlashStartIndex(-1);
    setPendingAttachment(null);
    setIsEmojiPickerOpen(false);
    setTimeout(() => scrollToBottom("smooth"), 50);

    // Update parent lead card lastMessage locally without re-fetching list
    onLeadUpdated?.({
      id: lead.id,
      lastMessage: text || (toSendAttachment?.isImage ? "[Gambar]" : "[Dokumen]"),
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    });

    try {
      setIsSending(true);
      const res = await fetch(`/api/wa/chats/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          text,
          mediaUrl: toSendAttachment?.dataUrl,
          mediaFilename: toSendAttachment?.name,
          asDocument: toSendAttachment?.sendAsDocument,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim pesan WhatsApp");
      }

      // Quietly refresh chat after 1.2s to capture server timestamp
      setTimeout(() => {
        fetchMessages(true);
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pesan");
      // Rollback optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Claim lead (in-place update)
  const handleClaimLead = async () => {
    if (!lead?.id) return;
    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengklaim lead");
      const json = await res.json();
      toast.success("Lead berhasil diklaim ke akun Anda!");
      if (json.data) {
        onLeadUpdated?.(json.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengklaim lead");
    }
  };

  // Reassign CS (in-place update)
  const handleAssignLead = async (userId: string) => {
    if (!lead?.id) return;
    const targetUser = csUsers.find((u) => u.id === userId);
    onLeadUpdated?.({
      id: lead.id,
      assignedToUserId: userId === "unassigned" ? null : userId,
      assignedToUser: targetUser || null,
    });

    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToUserId: userId === "unassigned" ? null : userId }),
      });
      if (!res.ok) throw new Error("Gagal mengubah penugasan lead");
      toast.success("Penugasan CS berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menugaskan lead");
    }
  };

  // Tautkan kode atribusi (GK-XXXXX / REF:XXX) ke lead
  const handleManualAttachCode = async (codeToAttach: string) => {
    if (!lead?.id || !codeToAttach.trim()) return;
    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/attach-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToAttach.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Kode pelacakan berhasil ditautkan!");
        if (data.data) {
          onLeadUpdated?.(data.data);
        }
      } else {
        toast.error(data.message || "Kode tidak ditemukan di database");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menautkan kode");
    }
  };

  // Update status (in-place update)
  const handleUpdateStatus = async (status: string) => {
    if (!lead?.id) return;
    onLeadUpdated?.({
      id: lead.id,
      status: status as any,
    });

    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status lead");
      toast.success("Status lead berhasil diubah!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status");
    }
  };

  // Toggle label (in-place update)
  const handleToggleLabel = async (labelName: string) => {
    if (!lead?.id) return;
    const exists = currentLabels.includes(labelName);
    const updated = exists
      ? currentLabels.filter((l) => l !== labelName)
      : [...currentLabels, labelName];

    setCurrentLabels(updated);
    onLeadUpdated?.({
      id: lead.id,
      labels: updated,
    });

    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/labels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: updated }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui label");
      toast.success("Label diperbarui");
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui label");
      setCurrentLabels(currentLabels); // rollback
    }
  };

  // Add custom label
  const handleAddCustomLabel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    handleToggleLabel(trimmed);
    setAvailableLabels((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [
        ...prev,
        {
          id: trimmed,
          name: trimmed,
          color: "#059669",
          orderIndex: (prev.length || 0) + 1,
          createdAt: new Date().toISOString(),
        },
      ];
    });
    setCustomTagInput("");
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !lead?.id) return;
    try {
      setIsAddingNote(true);
      const res = await fetchApi(`/crm/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteInput.trim() }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan catatan");
      const json = await res.json();
      toast.success("Catatan internal berhasil disimpan!");
      setNoteInput("");
      if (json.data) {
        setNotes((prev) => [json.data, ...prev]);
        onLeadUpdated?.({
          id: lead.id,
          notesCount: (lead.notesCount || 0) + 1,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan catatan");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!lead?.id || !confirm("Hapus catatan ini?")) return;
    try {
      const res = await fetchApi(`/crm/leads/${lead.id}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus catatan");
      toast.success("Catatan dihapus");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      onLeadUpdated?.({
        id: lead.id,
        notesCount: Math.max(0, (lead.notesCount || 1) - 1),
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus catatan");
    }
  };

  if (!lead) return null;

  const { name, formattedPhone } = lead.resolvedContact;
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const isAssigned = !!lead.assignedToUserId;

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent
          side="right"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-stone-50 border-stone-200 overflow-hidden"
        >
          {/* Drag-and-drop Visual Overlay */}
          {isDraggingFile && (
            <div className="absolute inset-0 z-50 bg-emerald-600/15 backdrop-blur-[2px] border-2 border-dashed border-emerald-500 rounded-lg flex flex-col items-center justify-center p-6 text-center pointer-events-none transition-all animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-md animate-bounce">
                <Paperclip className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-emerald-900">
                Lepaskan file di sini untuk melampirkan ke percakapan
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Maksimal 10 MB (Gambar atau Dokumen)
              </p>
            </div>
          )}
          {/* ── Top Header ── */}
          <div className="bg-white border-b border-stone-200 p-4 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-10 h-10 border border-stone-200 shrink-0 bg-emerald-50 text-emerald-800 font-bold text-sm">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-sm font-bold text-stone-900 truncate">
                    {name}
                  </SheetTitle>
                  {lead.customerProfile && (
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" />
                      <span>ERP Linked</span>
                    </Badge>
                  )}
                </div>
                <SheetDescription className="text-xs text-stone-500 font-mono mt-0.5">
                  {formattedPhone}
                </SheetDescription>
              </div>
            </div>

            {/* Chat Lock / CS Ownership Status Badge */}
            <div className="flex items-center gap-2 shrink-0">
              {isAssignedToMe && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ditangani Anda</span>
                </span>
              )}
              {isAssignedToOther && (
                isSupervisorOverride ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Otorisasi Supervisor Aktif</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                    title={`Percakapan dikunci oleh ${assignedCsName}`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Terkunci ({assignedCsName})</span>
                  </span>
                )
              )}
              {!assignedUserId && (
                <button
                  type="button"
                  onClick={handleClaimChat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  title="Klik untuk mengklaim dan mengunci percakapan ini ke akun Anda"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Klaim Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Tabs: Chat vs CRM Context ── */}
          <div className="bg-white border-b border-stone-200 px-4 pt-2 shrink-0">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
              <TabsList className="bg-stone-100 p-0.5 h-8">
                <TabsTrigger value="chat" className="text-xs h-7 gap-1.5 px-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Percakapan WhatsApp</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs h-7 gap-1.5 px-3">
                  <Info className="w-3.5 h-3.5" />
                  <span>Data & Catatan CRM</span>
                  {notes.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {notes.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* ── Tab Content 1: WhatsApp Chat (Kept in DOM with hidden to preserve scroll!) ── */}
          <div
            className={`flex-1 flex-col min-h-0 bg-[#e5ddd5]/30 ${
              activeTab === "chat" ? "flex" : "hidden"
            }`}
          >
            {/* Top Sticky Attribution Info Banner in Chat Tab */}
            {lead.whatsappClick && (() => {
              const attr = parseWhatsappClickAttribution(lead.whatsappClick);
              if (!attr) return null;
              return (
                <div className="px-4 py-2 bg-sky-50/95 border-b border-sky-200/90 flex items-center justify-between text-xs text-sky-950 shrink-0 shadow-2xs backdrop-blur-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">
                      Jejak Web: <strong className="text-sky-900">{attr.platform}</strong> ({attr.code}) • Halaman: <code className="bg-white px-1 py-0.5 rounded border border-sky-200 text-sky-800 font-mono text-[11px]">{attr.pagePath || "/"}</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("info")}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold underline shrink-0 cursor-pointer ml-2"
                  >
                    Detail Jejak →
                  </button>
                </div>
              );
            })()}

            {lead.sourceCode && !lead.whatsappClick && (
              <div className="px-4 py-2 bg-amber-50/95 border-b border-amber-200/90 flex items-center justify-between text-xs text-amber-950 shrink-0 shadow-2xs backdrop-blur-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">
                    Kampanye Iklan: <strong className="text-amber-900">{lead.sourceCode.label} ({lead.sourceCode.code})</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline shrink-0 cursor-pointer ml-2"
                >
                  Detail →
                </button>
              </div>
            )}

            {/* Top Banner when chat is locked to another CS */}
            {isAssignedToOther && (
              <div className="px-4 py-2 bg-amber-100 border-b border-amber-300 flex items-center justify-between text-xs text-amber-950 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">
                    <strong>Chat Terkunci:</strong> Percakapan ini sedang ditangani oleh <strong className="text-amber-900">{assignedCsName}</strong>
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-200/90 border-amber-300 text-amber-900 font-bold shrink-0">
                  Anti-Tabrakan Aktif
                </Badge>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {isLoadingMessages ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Memuat percakapan WhatsApp...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center text-stone-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">Belum ada riwayat pesan yang termuat untuk kontak ini.</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = !!msg.fromMe;
                  const time = msg.timestamp
                    ? new Date(msg.timestamp * 1000).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  const mediaInfo = getMediaInfo(msg);
                  const isPlaceholderBody =
                    !msg.body ||
                    msg.body.trim() === "[Media / Dokumen]" ||
                    msg.body.trim() === "[Media / Document]" ||
                    msg.body.trim() === "[Gambar]" ||
                    msg.body.trim() === "[Dokumen]";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm space-y-1.5 ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-none"
                        }`}
                      >
                        {/* Real Media Rendering */}
                        {mediaInfo.hasMedia && (
                          <div className="rounded-lg overflow-hidden border border-black/10 bg-black/5">
                            {mediaInfo.isImage && mediaInfo.mediaUrl ? (
                              <div
                                className="relative group cursor-pointer overflow-hidden rounded-md"
                                onClick={() =>
                                  setPreviewImage({
                                    url: mediaInfo.mediaUrl!,
                                    filename: mediaInfo.filename,
                                  })
                                }
                              >
                                <img
                                  src={mediaInfo.mediaUrl}
                                  alt={mediaInfo.filename}
                                  className="max-h-60 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-medium text-xs">
                                  <Eye className="w-4 h-4" />
                                  <span>Lihat Gambar</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 flex items-center justify-between gap-3 bg-stone-50 rounded-md border border-stone-200 text-stone-800">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded bg-stone-200 flex items-center justify-center shrink-0 text-stone-700">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="text-xs font-medium truncate max-w-[170px] sm:max-w-[200px]">
                                      {mediaInfo.filename}
                                    </p>
                                    <p className="text-[10px] text-stone-500 uppercase">
                                      {mediaInfo.mimetype?.split("/")[1] || "DOKUMEN"}
                                    </p>
                                  </div>
                                </div>
                                {mediaInfo.mediaUrl && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      downloadAttachment(mediaInfo.mediaUrl!, mediaInfo.filename)
                                    }
                                    className="h-7 px-2 text-[11px] shrink-0 text-stone-700 bg-white hover:bg-stone-100 border-stone-300 gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Real Message Text Content */}
                        {!isPlaceholderBody && (
                          <p className="whitespace-pre-wrap leading-relaxed select-text">
                            {msg.body || msg.text || ""}
                          </p>
                        )}

                        {/* Code Detection Chip inside Message Bubble */}
                        {(() => {
                          const body = msg.body || msg.text || "";
                          const dyn =
                            body.match(/(?:Kode\s*(?:WA)?|Code)\s*:\s*(GK-[A-HJ-KM-NP-Z0-9]{4,6})/i) ||
                            body.match(/\b(GK-[A-HJ-KM-NP-Z0-9]{5})\b/i);
                          const stat = body.match(/(?:\[\s*)?(?:REF|CODE)\s*:\s*([A-Za-z0-9_-]+)(?:\s*\])?/i);
                          const codeFound = dyn ? dyn[1].toUpperCase() : stat ? stat[1].toUpperCase() : null;
                          if (!codeFound) return null;

                          return (
                            <div
                              className={`mt-1.5 flex items-center justify-between gap-2 px-2 py-1 rounded-md text-[10px] font-medium border ${
                                isMe
                                  ? "bg-emerald-700/80 border-emerald-500 text-white"
                                  : "bg-sky-50 border-sky-200 text-sky-900"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-sky-600 shrink-0" />
                                <span>
                                  Kode Terdeteksi: <strong>{codeFound}</strong>
                                </span>
                              </div>
                              {!lead.whatsappClick && !lead.sourceCode && (
                                <button
                                  type="button"
                                  onClick={() => handleManualAttachCode(codeFound)}
                                  className="underline hover:text-sky-950 font-bold cursor-pointer shrink-0 ml-1"
                                  title="Tautkan kode ini ke data lead"
                                >
                                  Tautkan Jejak
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        <div
                          className={`text-[9px] flex items-center justify-end gap-1 ${
                            isMe ? "text-emerald-100" : "text-stone-400"
                          }`}
                        >
                          <span>{time}</span>
                          {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Bar, Attachment Preview & Input */}
            <div className="bg-white border-t border-stone-200 p-3 space-y-2 shrink-0">
              {isChatLocked ? (
                /* ── Lock Protection Card (Anti-Tabrakan Aktif) ── */
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-amber-950">
                          Percakapan Dikunci oleh CS Penanggung Jawab
                        </h4>
                        <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          Anti-Tabrakan Aktif
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Percakapan ini sedang ditangani oleh <strong className="text-amber-950 font-bold">{assignedCsName}</strong>. Penguncian aktif agar pelanggan tidak menerima balasan tumpang tindih dari beberapa CS sekaligus.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/70 flex-wrap">
                    {isSupervisorOrAdmin ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsSupervisorOverride(true)}
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-2xs font-semibold cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Akses Supervisor (Bypass Kunci)</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isTakingOver}
                          onClick={() => handleTakeoverChat()}
                          className="h-8 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 gap-1.5 font-semibold cursor-pointer"
                        >
                          {isTakingOver ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                          )}
                          <span>Alihkan Penugasan ke Saya</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsPinDialogOpen(true)}
                          className="h-8 text-xs bg-amber-700 hover:bg-amber-800 text-white gap-1.5 shadow-2xs font-semibold cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Buka Kunci dengan Kode Supervisor</span>
                        </Button>
                        <span className="text-[11px] text-amber-700 italic">
                          Minta kode 6-digit ke Supervisor jika perlu merespon darurat.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Supervisor Override Notification Banner */}
                  {isSupervisorOverride && (
                    <div className="px-3 py-1.5 bg-amber-100/90 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-100">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          <strong>Mode Supervisor Aktif:</strong> Anda dapat membalas chat milik {assignedCsName}.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSupervisorOverride(false)}
                        className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer ml-2 shrink-0"
                      >
                        Kunci Kembali
                      </button>
                    </div>
                  )}

                  {/* If unassigned, require claiming before chatting so multiple CS don't respond simultaneously */}
                  {!assignedUserId ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-center animate-in fade-in duration-150 shadow-2xs">
                      <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-xs">
                        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <span>Percakapan Ini Belum Diklaim (Antrean Bebas)</span>
                      </div>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                        Klaim chat ini ke akun Anda untuk menjadi CS penanggung jawab resmi dan mengunci akses balasan agar tidak terjadi tabrakan respon dengan CS lain.
                      </p>
                      <Button
                        type="button"
                        onClick={handleClaimChat}
                        className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-2xs font-bold cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Klaim & Kunci Chat ke Akun Saya</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Quick Action Tools */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 gap-1 shrink-0 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Template Balasan</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-84 p-2.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                          <p className="font-bold text-stone-700 text-[11px]">
                            Pilih Pesan Cepat (Quick Reply)
                          </p>
                          <Link
                            href="/super-admin/whatsapp-crm/settings?tab=templates"
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold"
                            title="Buka Pengaturan Template CRM"
                          >
                            Kelola →
                          </Link>
                        </div>

                        {/* Search Input for Templates */}
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={templateSearchQuery}
                            onChange={(e) => setTemplateSearchQuery(e.target.value)}
                            placeholder="Cari judul, shortcut (/), atau isi..."
                            className="w-full pl-6 pr-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-stone-400 placeholder:text-stone-400"
                          />
                        </div>

                        {/* Scrollable Templates List */}
                        <div className="max-h-64 overflow-y-auto space-y-1 pt-0.5">
                          {(templates.length > 0
                            ? templates
                            : QUICK_REPLIES.map((qr, idx) => ({
                                id: String(idx),
                                title: qr.title,
                                content: qr.text,
                                category: "Umum",
                                shortcut: null,
                                orderIndex: idx,
                                createdAt: "",
                              }))
                          )
                            .filter((tpl) => {
                              if (!templateSearchQuery.trim()) return true;
                              const q = templateSearchQuery.toLowerCase();
                              return (
                                tpl.title.toLowerCase().includes(q) ||
                                tpl.content.toLowerCase().includes(q) ||
                                (tpl.shortcut && tpl.shortcut.toLowerCase().includes(q))
                              );
                            })
                            .map((tpl) => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => {
                                  setMessageInput(tpl.content);
                                  setTemplatePopoverOpen(false);
                                }}
                                className="w-full text-left p-2 rounded hover:bg-stone-50 transition-colors text-stone-800 space-y-0.5 border border-transparent hover:border-stone-200 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-semibold text-xs text-emerald-700 truncate">
                                    {tpl.title}
                                  </span>
                                  {tpl.shortcut && (
                                    <span className="font-mono text-[9px] font-bold bg-stone-100 text-stone-500 px-1 py-0.2 rounded border border-stone-200 shrink-0">
                                      {tpl.shortcut}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                                  {tpl.content}
                                </p>
                              </button>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMessages(false)}
                      className="h-7 px-2 text-[11px] text-stone-500 gap-1 shrink-0"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingMessages ? "animate-spin" : ""}`} />
                      <span>Refresh Chat</span>
                    </Button>
                  </div>

                  {/* Pending Attachment Preview Box */}
                  {pendingAttachment && (
                    <div className="flex items-center justify-between gap-3 p-2 bg-stone-100 border border-stone-200 rounded-lg animate-in fade-in duration-150">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {pendingAttachment.isImage && !pendingAttachment.sendAsDocument ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                            <img
                              src={pendingAttachment.dataUrl}
                              alt={pendingAttachment.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-stone-200 flex items-center justify-center shrink-0 border border-stone-300 text-stone-600">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-medium text-stone-800 truncate max-w-[180px] sm:max-w-xs">
                            {pendingAttachment.name}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {pendingAttachment.sizeFormatted}
                            {pendingAttachment.isImage && (
                              <span className="ml-1 text-[9px] text-emerald-600 font-medium">
                                ({pendingAttachment.sendAsDocument ? "Kirim sbg Dokumen" : "Kirim sbg Gambar"})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {pendingAttachment.isImage && (
                          <div className="flex items-center bg-stone-200/90 p-0.5 rounded-md text-[10px]">
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAttachment((prev) =>
                                  prev ? { ...prev, sendAsDocument: false } : null
                                )
                              }
                              className={`px-2 py-0.5 rounded transition-all font-medium ${
                                !pendingAttachment.sendAsDocument
                                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                                  : "text-stone-600 hover:text-stone-900"
                              }`}
                            >
                              Gambar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAttachment((prev) =>
                                  prev ? { ...prev, sendAsDocument: true } : null
                                )
                              }
                              className={`px-2 py-0.5 rounded transition-all font-medium ${
                                pendingAttachment.sendAsDocument
                                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                                  : "text-stone-600 hover:text-stone-900"
                              }`}
                            >
                              Dokumen
                            </button>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingAttachment(null)}
                          className="h-7 w-7 p-0 text-stone-400 hover:text-stone-700 rounded-full shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Chat Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="relative flex items-end gap-1.5"
                  >
                    {/* Slash (/) Quick Reply Autocomplete Popup */}
                    {slashActive && (
                      <div
                        ref={slashMenuRef}
                        className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-white border border-stone-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-50 border-b border-stone-200 text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Template Pesan Cepat</span>
                            {slashQuery && (
                              <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                /{slashQuery}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-stone-400">
                            <span className="hidden sm:inline">Tekan</span>
                            <kbd className="px-1 py-0.5 bg-white border border-stone-200 rounded text-[9px] text-stone-600 font-mono">↑</kbd>
                            <kbd className="px-1 py-0.5 bg-white border border-stone-200 rounded text-[9px] text-stone-600 font-mono">↓</kbd>
                            <span className="hidden sm:inline">navigasi,</span>
                            <kbd className="px-1 py-0.5 bg-white border border-stone-200 rounded text-[9px] text-stone-600 font-mono">Enter</kbd>
                            <span className="hidden sm:inline">pilih,</span>
                            <kbd className="px-1 py-0.5 bg-white border border-stone-200 rounded text-[9px] text-stone-600 font-mono">Esc</kbd>
                            <span className="hidden sm:inline">batal</span>
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-1 divide-y divide-stone-100">
                          {filteredSlashTemplates.length === 0 ? (
                            <div className="py-5 px-3 text-center text-xs text-stone-400 space-y-1">
                              <p className="font-medium text-stone-600">Tidak ada template yang cocok dengan &quot;/{slashQuery}&quot;</p>
                              <p className="text-[10px] text-stone-400">
                                Ketik kata kunci lain atau buka{" "}
                                <Link
                                  href="/super-admin/whatsapp-crm/settings?tab=templates"
                                  className="text-emerald-600 hover:underline font-semibold"
                                >
                                  Pengaturan Template
                                </Link>
                              </p>
                            </div>
                          ) : (
                            filteredSlashTemplates.map((tpl, index) => {
                              const isSelected = index === slashHighlightIndex;
                              return (
                                <button
                                  key={tpl.id}
                                  ref={(el) => {
                                    slashItemRefs.current[index] = el;
                                  }}
                                  type="button"
                                  onMouseEnter={() => setSlashHighlightIndex(index)}
                                  onClick={() => handleSelectSlashTemplate(tpl)}
                                  className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer space-y-1 ${
                                    isSelected
                                      ? "bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-xs"
                                      : "hover:bg-stone-50 text-stone-800 border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-bold text-xs text-stone-800 truncate">
                                        {tpl.title}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 py-0 bg-stone-100 text-stone-600 border-stone-200 font-normal shrink-0"
                                      >
                                        {tpl.category || "Umum"}
                                      </Badge>
                                    </div>
                                    {tpl.shortcut && (
                                      <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                        {tpl.shortcut.startsWith("/") ? tpl.shortcut : `/${tpl.shortcut}`}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                                    {tpl.content}
                                  </p>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hidden Native File Inputs */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSelectFile(e.target.files[0], false);
                        }
                        e.target.value = "";
                      }}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSelectFile(e.target.files[0], true);
                        }
                        e.target.value = "";
                      }}
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                    />

                    {/* Emoji Picker Popover */}
                    <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`h-10 w-10 p-0 rounded-lg shrink-0 transition-colors ${
                            isEmojiPickerOpen
                              ? "text-emerald-600 bg-emerald-50"
                              : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                          }`}
                          title="Pilih Emoji"
                        >
                          <Smile className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="top"
                        sideOffset={8}
                        className="p-0 border border-stone-200 shadow-2xl rounded-2xl overflow-hidden w-auto z-50 bg-white"
                      >
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          autoFocusSearch={false}
                          theme={Theme.LIGHT}
                          emojiStyle={EmojiStyle.APPLE}
                          searchPlaceHolder="Cari emoji..."
                          width={320}
                          height={360}
                          lazyLoadEmojis={true}
                          previewConfig={{ showPreview: false }}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Attachment Menu (Paperclip) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg shrink-0"
                          title="Lampirkan File / Gambar"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-44 p-1 shadow-lg border-stone-200">
                        <DropdownMenuItem
                          onClick={() => imageInputRef.current?.click()}
                          className="flex items-center gap-2.5 text-xs py-2 cursor-pointer text-stone-700 hover:text-stone-900"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Foto & Gambar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => docInputRef.current?.click()}
                          className="flex items-center gap-2.5 text-xs py-2 cursor-pointer text-stone-700 hover:text-stone-900"
                        >
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Dokumen</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Input Textarea */}
                    <Textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={handleMessageInputChange}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (slashActive && filteredSlashTemplates.length > 0) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setSlashHighlightIndex((prev) => (prev + 1) % filteredSlashTemplates.length);
                            return;
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setSlashHighlightIndex((prev) => (prev - 1 + filteredSlashTemplates.length) % filteredSlashTemplates.length);
                            return;
                          }
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            const chosen = filteredSlashTemplates[slashHighlightIndex] || filteredSlashTemplates[0];
                            if (chosen) {
                              handleSelectSlashTemplate(chosen);
                            }
                            return;
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setSlashActive(false);
                            return;
                          }
                        }

                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ketik pesan WhatsApp... (Ketik / untuk template cepat)"
                      rows={2}
                      className="text-xs resize-none bg-stone-50/50 flex-1"
                    />

                    <Button
                      type="submit"
                      disabled={isSending || (!messageInput.trim() && !pendingAttachment)}
                      className="h-14 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Tab Content 2: CRM & ERP Data ── */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-5 bg-white ${
              activeTab === "info" ? "block" : "hidden"
            }`}
          >
            {/* Status & CS Assignment Bar */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lead Status */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-stone-600">Status Prospek</Label>
                  <Select
                    value={lead.status}
                    onValueChange={(val) => handleUpdateStatus(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses && statuses.length > 0 ? (
                        statuses.map((st) => (
                          <SelectItem key={st.id} value={st.key} className="text-xs font-semibold py-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: st.color }}
                              />
                              <span>{st.label}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        Object.entries(DEFAULT_STATUS_FALLBACKS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs font-semibold py-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: v.color }}
                              />
                              <span>{v.label}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                      <div className="pt-1 border-t border-stone-100 p-1">
                        <button
                          type="button"
                          onClick={() => setQuickAddStatusOpen(true)}
                          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded font-semibold cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Status Baru</span>
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* CS Assignment */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-stone-600">CS Penanggung Jawab</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      {canAssignLead ? (
                        <Popover open={csPopoverOpen} onOpenChange={setCsPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 w-full justify-between text-xs bg-white font-normal px-2.5 border-stone-200"
                            >
                              <span className="truncate">
                                {lead.assignedToUser?.name ||
                                  csUsers.find((u) => u.id === lead.assignedToUserId)?.name ||
                                  "-- Belum Ditugaskan --"}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0 ml-1" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-56 p-1 text-xs">
                            <div className="p-1 pb-1.5 border-b border-stone-100">
                              <div className="relative">
                                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                  type="text"
                                  value={csSearchQuery}
                                  onChange={(e) => setCsSearchQuery(e.target.value)}
                                  placeholder="Cari nama CS..."
                                  className="w-full pl-6 pr-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-stone-400 placeholder:text-stone-400"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleAssignLead("unassigned");
                                  setCsPopoverOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  !lead.assignedToUserId
                                    ? "bg-stone-100 font-bold text-stone-900"
                                    : "text-stone-500 hover:bg-stone-50"
                                }`}
                              >
                                <span>-- Belum Ditugaskan --</span>
                                {!lead.assignedToUserId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                              {filteredCsUsers.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    handleAssignLead(user.id);
                                    setCsPopoverOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                    lead.assignedToUserId === user.id
                                      ? "bg-stone-100 font-bold text-stone-900"
                                      : "text-stone-700 hover:bg-stone-50"
                                  }`}
                                >
                                  <span className="truncate">{user.name || user.email}</span>
                                  {lead.assignedToUserId === user.id && (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </button>
                              ))}
                              {filteredCsUsers.length === 0 && (
                                <div className="px-2 py-2 text-[11px] text-stone-400 italic text-center">
                                  CS tidak ditemukan
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className="h-8 w-full flex items-center px-2.5 rounded border border-stone-200 bg-stone-50 text-xs text-stone-700 font-medium">
                          <span className="truncate">
                            {lead.assignedToUser?.name ||
                              csUsers.find((u) => u.id === lead.assignedToUserId)?.name ||
                              "-- Belum Ditugaskan --"}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isAssigned ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleClaimLead}
                        className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-medium cursor-pointer"
                      >
                        Klaim Leads
                      </Button>
                    ) : canAssignLead ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignLead("unassigned")}
                        className="h-8 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0 cursor-pointer"
                        title="Lepas penugasan dan kembalikan ke antrean"
                      >
                        Lepas Leads
                      </Button>
                    ) : null}
                  </div>
                  {isAssigned && (
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                      <span>
                        Metode:{" "}
                        <strong className="text-stone-600">
                          {lead.assignmentMethod === "CLAIM"
                            ? "Klaim Mandiri"
                            : lead.assignmentMethod === "STICKY_CUSTOMER"
                            ? "Pelanggan Tetap (ERP)"
                            : lead.assignmentMethod === "ROUND_ROBIN"
                            ? "Auto-Route"
                            : "Manual"}
                        </strong>
                      </span>
                      {lead.assignedAt && (
                        <span>
                          {new Date(lead.assignedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {lead.sourceCode && (
                <div className="text-[11px] text-amber-800 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sumber Iklan / Kampanye: <strong>{lead.sourceCode.label} ({lead.sourceCode.code})</strong></span>
                </div>
              )}

              {/* Digital Footprint / Dynamic Website Click Attribution */}
              {lead.whatsappClick && (() => {
                const attr = parseWhatsappClickAttribution(lead.whatsappClick);
                if (!attr) return null;

                return (
                  <div className="p-3 bg-stone-50 border border-stone-200/90 rounded-lg space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-900 border-b border-stone-200/70 pb-1.5">
                      <div className="flex items-center gap-1.5 text-sky-700">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Atribusi Iklan & Jejak Web ({attr.code})</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${attr.badgeClass}`}>
                        {attr.platform}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Halaman Produk:</span>
                        <span className="font-mono font-medium text-stone-800 break-all">{attr.pagePath || "/"}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Tombol Diklik (CTA):</span>
                        <span className="font-medium text-stone-800">{attr.ctaName || "-"}</span>
                      </div>

                      {attr.campaign && (
                        <div>
                          <span className="text-stone-400 block text-[10px]">Kampanye (UTM):</span>
                          <span className="font-semibold text-emerald-700">{attr.campaign}</span>
                        </div>
                      )}

                      {attr.medium && (
                        <div>
                          <span className="text-stone-400 block text-[10px]">Media Iklan (Medium):</span>
                          <span className="text-stone-700">{attr.medium}</span>
                        </div>
                      )}

                      {attr.referrer && (
                        <div className="col-span-2">
                          <span className="text-stone-400 block text-[10px]">Link Asal (Referrer):</span>
                          <span className="text-stone-600 truncate block text-[10px]">{attr.referrer}</span>
                        </div>
                      )}

                      {attr.gaClientId && (
                        <div className="col-span-2 text-[10px] text-stone-400 font-mono">
                          GA Client ID: {attr.gaClientId}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Form Tautkan Kode Manual jika belum terdeteksi */}
              {!lead.whatsappClick && !lead.sourceCode && (
                <div className="p-3 bg-stone-50 border border-dashed border-stone-300 rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Globe className="w-3.5 h-3.5 text-stone-500" />
                      <span>Tautkan Kode Atribusi Manual</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Masukkan kode (contoh: GK-A1B2C atau REF:XXX)..."
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      className="h-7 text-xs bg-white uppercase font-mono"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && manualCodeInput.trim()) {
                          handleManualAttachCode(manualCodeInput.trim());
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isAttachingCode || !manualCodeInput.trim()}
                      onClick={() => handleManualAttachCode(manualCodeInput.trim())}
                      className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-medium"
                    >
                      {isAttachingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tautkan"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Jika pelanggan mengirim kode lewat chat tetapi belum tertaut otomatis, Anda dapat menautkannya langsung di sini.
                  </p>
                </div>
              )}
            </div>

            {/* Labels / Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Label & Kategori Prospek</span>
                </Label>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {currentLabels.map((lbl) => (
                  <Badge
                    key={lbl}
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors gap-1"
                    onClick={() => handleToggleLabel(lbl)}
                    title="Klik untuk menghapus label"
                  >
                    <span>{lbl}</span>
                    <span className="text-[10px]">×</span>
                  </Badge>
                ))}

                {/* Preset suggestions dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1">
                      <Plus className="w-3 h-3" />
                      <span>Tambah Label</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-68 p-2.5 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                      <p className="font-bold text-stone-700 text-[11px]">Pilih Label Tersedia:</p>
                      <Link
                        href="/super-admin/whatsapp-crm/settings?tab=labels"
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold"
                        title="Buka Pengaturan Label CRM"
                      >
                        Kelola →
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-44 overflow-y-auto pt-0.5">
                      {(availableLabels.length > 0
                        ? availableLabels
                        : PRESET_LABELS.map((p) => ({ id: p, name: p, color: "#059669" }))
                      ).map((lbl: any) => {
                        const name = typeof lbl === "string" ? lbl : lbl.name;
                        const color = typeof lbl === "object" ? lbl.color || "#059669" : "#059669";
                        const active = currentLabels.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleToggleLabel(name)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                              active
                                ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: active ? "#ffffff" : color }}
                            />
                            <span>{name}</span>
                            <span className="text-[9px] opacity-75">{active ? "✓" : "+"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddCustomLabel} className="pt-2 border-t border-stone-100 flex gap-1">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Ketik label baru..."
                        className="h-7 text-xs"
                      />
                      <Button type="submit" size="sm" className="h-7 px-2 text-xs bg-emerald-600 text-white">
                        +
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Customer ERP Summary */}
            {lead.customerProfile ? (
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <span>Profil Pelanggan ERP Terhubung</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300">
                    {lead.customerProfile.accountType}
                  </Badge>
                </div>
                <div className="text-stone-600 space-y-0.5 text-[11px]">
                  {lead.customerProfile.companyName && (
                    <p>Perusahaan: <strong>{lead.customerProfile.companyName}</strong></p>
                  )}
                  {lead.customerProfile.picName && (
                    <p>PIC: <strong>{lead.customerProfile.picName}</strong></p>
                  )}
                  {lead.customerProfile.user?.email && (
                    <p>Email: {lead.customerProfile.user.email}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-500 flex items-center justify-between">
                <span>Belum terhubung ke profil customer ERP.</span>
              </div>
            )}

            {/* Internal Follow-Up Notes */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Catatan Internal Tim (Privat)</span>
                </Label>
                <span className="text-[10px] text-stone-400">Tidak terlihat oleh customer WA</span>
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Tulis catatan tindak lanjut, spesifikasi pesanan, atau janji follow-up..."
                  rows={2}
                  className="text-xs bg-stone-50/50"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAddingNote || !noteInput.trim()}
                    className="h-7 px-3 text-xs bg-stone-800 hover:bg-stone-900 text-white gap-1"
                  >
                    {isAddingNote ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    <span>Simpan Catatan</span>
                  </Button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-2 pt-1">
                {isLoadingNotes ? (
                  <div className="py-4 text-center text-xs text-stone-400">Memuat catatan...</div>
                ) : notes.length === 0 ? (
                  <p className="text-[11px] text-stone-400 italic">Belum ada catatan internal untuk prospek ini.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400 gap-2">
                        <span className="font-semibold text-stone-700 truncate">
                          {note.user?.name || "Staf CS"}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[10px]">
                            {new Date(note.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                            title="Hapus catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-stone-800 text-[11px] whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Image Preview Lightbox Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-3 bg-stone-950/95 border-stone-800 text-white sm:rounded-xl [&_button[data-slot=dialog-close]]:text-stone-300 [&_button[data-slot=dialog-close]]:hover:text-white">
            <DialogTitle className="sr-only">Pratinjau Gambar</DialogTitle>
            <div className="flex flex-col items-center w-full">
              <div className="w-full flex items-center justify-between pb-2 mb-2 pr-12 border-b border-stone-800 text-xs text-stone-300">
                <span className="truncate max-w-[200px] sm:max-w-md font-medium">
                  {previewImage.filename || "Lampiran Gambar"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAttachment(previewImage.url, previewImage.filename)}
                  className="h-7 text-xs bg-stone-800 hover:bg-stone-700 border-stone-700 text-white gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Gambar</span>
                </Button>
              </div>
              <div className="p-1 max-h-[75vh] w-full flex items-center justify-center overflow-auto">
                <img
                  src={previewImage.url}
                  alt={previewImage.filename || "Pratinjau"}
                  className="max-h-[72vh] max-w-full object-contain rounded-md shadow-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Supervisor PIN Unlock Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white sm:rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-amber-700 mb-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-amber-700" />
              </div>
              <DialogTitle className="text-base font-bold text-stone-900">
                Otorisasi Kode Supervisor
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-stone-600 leading-relaxed">
              Percakapan ini sedang dikunci oleh <strong>{assignedCsName}</strong>. Masukkan PIN Supervisor 6-digit untuk membuka akses balasan sesi ini atau mengalihkan penugasan.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPinAndUnlock();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Kode PIN Supervisor</Label>
              <Input
                type="password"
                maxLength={10}
                placeholder="Contoh: 123456"
                value={supervisorPinInput}
                onChange={(e) => setSupervisorPinInput(e.target.value)}
                autoFocus
                className="font-mono text-center tracking-widest text-lg font-bold h-11"
              />
              <p className="text-[11px] text-stone-400">
                Default PIN pengujian: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-stone-700">123456</code>
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPinDialogOpen(false)}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isTakingOver || !supervisorPinInput.trim()}
                onClick={() => handleTakeoverChat(supervisorPinInput.trim())}
                className="text-xs gap-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 cursor-pointer"
              >
                {isTakingOver ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>Ambil Alih (Takeover)</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isVerifyingPin || !supervisorPinInput.trim()}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-2xs"
              >
                {isVerifyingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Buka Balasan Sesi Ini</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Add Status Dialog */}
      <QuickAddStatusDialog
        open={quickAddStatusOpen}
        onOpenChange={setQuickAddStatusOpen}
        targetLeadId={lead?.id}
        targetLeadName={lead?.displayName || lead?.waPushName || lead?.phoneNumber}
        onStatusCreated={(newStatus, targetLeadId) => {
          onStatusCreated?.(newStatus, targetLeadId);
          if (lead && targetLeadId === lead.id) {
            handleUpdateStatus(newStatus.key);
          }
        }}
      />
    </>
  );
}
