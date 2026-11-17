"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import {
  Building2,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CrmLeadItem } from "./LeadCardItem";

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

interface CrmChatDrawerProps {
  lead: CrmLeadItem | null;
  open: boolean;
  sessionId?: string;
  onClose: () => void;
  onLeadUpdated?: (updated: Partial<CrmLeadItem> & { id: string }) => void;
  csUsers: Array<{ id: string; name?: string | null; email?: string | null }>;
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

export function CrmChatDrawer({
  lead,
  open,
  sessionId,
  onClose,
  onLeadUpdated,
  csUsers,
}: CrmChatDrawerProps) {
  const { fetchApi } = useApi();

  const [activeTab, setActiveTab] = useState<"chat" | "info">("chat");

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notes state
  const [notes, setNotes] = useState<CrmNoteItem[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Labels state
  const [currentLabels, setCurrentLabels] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Sync internal state when lead changes
  useEffect(() => {
    if (lead) {
      setCurrentLabels(lead.labels || []);
    }
  }, [lead]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
          if (!silent) setTimeout(scrollToBottom, 100);
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [lead?.phoneNumber, sessionId]
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
    }
  }, [open, lead?.id, fetchMessages, fetchNotes]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || messageInput.trim();
    if (!text || !lead?.phoneNumber) return;

    const chatId = getChatId(lead.phoneNumber);

    // Optimistic UI update: instantly show bubble in drawer
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      body: text,
      text,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      status: "PENDING",
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput("");
    setTimeout(scrollToBottom, 50);

    // Update parent lead card lastMessage locally without re-fetching list
    onLeadUpdated?.({
      id: lead.id,
      lastMessage: text,
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
    if (!customTagInput.trim()) return;
    handleToggleLabel(customTagInput.trim());
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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-stone-50 border-stone-200"
      >
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

          {/* Quick Action: Buat Quotation ERP */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin-invoice/quotations?create=true&phone=${encodeURIComponent(
                lead.phoneNumber
              )}&name=${encodeURIComponent(name)}`}
              target="_blank"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                title="Buka form penawaran harga ERP baru"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat Quotation</span>
              </Button>
            </Link>
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

        {/* ── Tab Content 1: WhatsApp Chat ── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#e5ddd5]/30">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm space-y-1 ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-none"
                        }`}
                      >
                        {msg.hasMedia && (
                          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            <span>Lampiran Media</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed select-text">
                          {msg.body || msg.text || ""}
                        </p>
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

            {/* Quick Reply Bar & Input */}
            <div className="bg-white border-t border-stone-200 p-3 space-y-2 shrink-0">
              {/* Quick Action Tools */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 gap-1 shrink-0"
                    >
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>Template Balasan</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 p-2 space-y-1 text-xs">
                    <p className="font-bold text-stone-700 px-2 py-1 text-[11px]">
                      Pilih Pesan Cepat (Quick Reply)
                    </p>
                    {QUICK_REPLIES.map((qr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessageInput(qr.text)}
                        className="w-full text-left p-2 rounded hover:bg-stone-100 transition-colors text-stone-800 space-y-0.5"
                      >
                        <div className="font-semibold text-xs text-emerald-700">{qr.title}</div>
                        <p className="text-[10px] text-stone-500 line-clamp-2">{qr.text}</p>
                      </button>
                    ))}
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

              {/* Chat Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ketik pesan WhatsApp... (Enter untuk kirim)"
                  rows={2}
                  className="text-xs resize-none bg-stone-50/50"
                />
                <Button
                  type="submit"
                  disabled={isSending || !messageInput.trim()}
                  className="h-14 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── Tab Content 2: CRM & ERP Data ── */}
        {activeTab === "info" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
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
                      <SelectItem value="NEW" className="text-xs text-rose-600 font-semibold">
                        🔴 Prospek Baru (NEW)
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS" className="text-xs text-amber-600 font-semibold">
                        🟡 Sedang Follow Up (IN_PROGRESS)
                      </SelectItem>
                      <SelectItem value="QUOTATION_SENT" className="text-xs text-blue-600 font-semibold">
                        🔵 Penawaran Terkirim (QUOTATION)
                      </SelectItem>
                      <SelectItem value="WON" className="text-xs text-emerald-600 font-semibold">
                        🟢 Closing / Deal (WON)
                      </SelectItem>
                      <SelectItem value="LOST" className="text-xs text-stone-500 font-semibold">
                        ⚪ Batal / Tidak Tertarik (LOST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CS Assignment */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-stone-600">CS Penanggung Jawab</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select
                        value={lead.assignedToUserId || "unassigned"}
                        onValueChange={(val) => handleAssignLead(val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-xs text-stone-400">
                            -- Belum Ditugaskan --
                          </SelectItem>
                          {csUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-xs">
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!isAssigned && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleClaimLead}
                        className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      >
                        Klaim
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {lead.sourceCode && (
                <div className="text-[11px] text-amber-800 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sumber Iklan / Kampanye: <strong>{lead.sourceCode.label} ({lead.sourceCode.code})</strong></span>
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
                  <PopoverContent align="start" className="w-64 p-2 text-xs space-y-2">
                    <p className="font-bold text-stone-700 text-[11px]">Pilih Label Tersedia:</p>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_LABELS.map((p) => {
                        const active = currentLabels.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleToggleLabel(p)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              active
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {p} {active ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddCustomLabel} className="pt-2 border-t border-stone-100 flex gap-1">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Label kustom..."
                        className="h-7 text-xs"
                      />
                      <Button type="submit" size="sm" className="h-7 px-2 text-xs">
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
                      className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1 relative group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span className="font-semibold text-stone-700">
                          {note.user?.name || "Staf CS"}
                        </span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-stone-800 text-[11px] whitespace-pre-wrap">{note.content}</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-opacity"
                        title="Hapus catatan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
