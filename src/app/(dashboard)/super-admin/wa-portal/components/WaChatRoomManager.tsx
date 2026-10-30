"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WaChatMessage, WaChatRoom, WaLabel, WaPipelineStage, WaSession } from "@/types/waPortal.type";
import {
  Check,
  CheckCheck,
  ChevronUp,
  Clock,
  CornerDownLeft,
  DownloadCloud,
  FileText,
  Image as ImageIcon,
  Info,
  Kanban,
  Loader2,
  MessageCircle,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Smartphone,
  Tag,
  User,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useWaEvents } from "../hooks/useWaEvents";
import { WaContactStageSelector } from "./WaContactStageSelector";
import { WaContactLabelsTagger } from "./WaContactLabelsTagger";
import { WaPipelineKanban } from "./WaPipelineKanban";
import { WaPipelineSettingsDialog } from "./WaPipelineSettingsDialog";

const formatMessageTime = (unixTs: number) => {
  if (!unixTs) return "";
  const d = new Date(unixTs * 1000);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const formatRoomTime = (unixTs: number) => {
  if (!unixTs) return "";
  const msgDate = new Date(unixTs * 1000);
  const today = new Date();
  const isToday = msgDate.toDateString() === today.toDateString();

  if (isToday) {
    return msgDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  }

  return msgDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const renderAckIcon = (ack?: number) => {
  switch (ack) {
    case 1:
      return (
        <span title="Terkirim ke server" className="inline-flex ml-1">
          <Check className="w-3.5 h-3.5 text-stone-400" />
        </span>
      );
    case 2:
      return (
        <span title="Diterima perangkat" className="inline-flex ml-1">
          <CheckCheck className="w-3.5 h-3.5 text-stone-400" />
        </span>
      );
    case 3:
      return (
        <span title="Dibaca" className="inline-flex ml-1">
          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
        </span>
      );
    default:
      return (
        <span title="Pending" className="inline-flex ml-1">
          <Clock className="w-3 h-3 text-stone-400" />
        </span>
      );
  }
};

function normalizeJid(jid?: string | null): string {
  if (!jid) return "";
  return jid.replace(/@(c\.us|s\.whatsapp\.net|lid|g\.us)$/i, "").trim();
}

function isMatchingChat(
  roomJid: string,
  eventChatId?: string,
  eventFrom?: string,
  eventTo?: string
): boolean {
  if (!roomJid) return false;
  if (
    (eventChatId && roomJid === eventChatId) ||
    (eventFrom && roomJid === eventFrom) ||
    (eventTo && roomJid === eventTo)
  ) {
    return true;
  }
  const normRoom = normalizeJid(roomJid);
  if (!normRoom) return false;
  if (
    (eventChatId && normalizeJid(eventChatId) === normRoom) ||
    (eventFrom && normalizeJid(eventFrom) === normRoom) ||
    (eventTo && normalizeJid(eventTo) === normRoom)
  ) {
    return true;
  }
  return false;
}

function extractMessageId(id: any): string {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object") {
    return id._serialized || id.id || JSON.stringify(id);
  }
  return String(id);
}

function isTempMessageId(id: any): boolean {
  const str = extractMessageId(id);
  return str.startsWith("temp_");
}

interface WaMessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const WaMessageInput = React.memo(function WaMessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Ketik pesan...",
}: WaMessageInputProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled || isSubmitting) return;

    const toSend = text.trim();
    setText("");
    setIsSubmitting(true);
    try {
      await onSendMessage(toSend);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-white border-t border-stone-200 shrink-0 z-10">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative min-w-0">
          <Textarea
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled || isSubmitting}
            className="min-h-[40px] max-h-32 text-xs resize-none pr-3 py-2.5 bg-stone-50 border-stone-200"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || disabled || isSubmitting}
          className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
});

interface MessageBubbleProps {
  msg: WaChatMessage;
}

const MessageBubble = React.memo(function MessageBubble({ msg }: MessageBubbleProps) {
  const isMe = msg.fromMe;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-xl px-3 py-2 text-xs shadow-2xs relative ${
          isMe
            ? "bg-emerald-600 text-white rounded-br-xs"
            : "bg-white text-stone-900 border border-stone-200/80 rounded-bl-xs"
        }`}
      >
        {/* Media Attachment if present */}
        {msg.hasMedia && msg.media?.url && (
          <div className="mb-1.5 rounded-lg overflow-hidden border border-black/10 bg-black/5">
            {msg.media.mimetype?.startsWith("image/") ? (
              <img
                src={msg.media.url}
                alt="Media lampiran"
                className="max-h-48 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <a
                href={msg.media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 text-[11px] underline"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {msg.media.filename || "Unduh Dokumen"}
                </span>
              </a>
            )}
          </div>
        )}

        {/* Message Text Content */}
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {msg.body}
        </p>

        {/* Timestamp and Delivery Ack */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
            isMe ? "text-emerald-100" : "text-stone-400"
          }`}
        >
          <span>{formatMessageTime(msg.timestamp)}</span>
          {isMe && renderAckIcon(msg.ack)}
        </div>
      </div>
    </div>
  );
});

interface WaChatRoomManagerProps {
  sessions: WaSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  isDedicatedPage?: boolean;
}

export function WaChatRoomManager({
  sessions,
  activeSessionId,
  onSelectSession,
  isDedicatedPage = false,
}: WaChatRoomManagerProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    activeSessionId || sessions[0]?.id || ""
  );
  const [rooms, setRooms] = useState<WaChatRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRoom, setSelectedRoom] = useState<WaChatRoom | null>(null);
  const selectedRoomRef = useRef<WaChatRoom | null>(selectedRoom);
  selectedRoomRef.current = selectedRoom;

  // View Mode: Inbox chat vs Kanban pipeline board
  const [viewMode, setViewMode] = useState<"INBOX" | "KANBAN">("INBOX");
  const [stages, setStages] = useState<WaPipelineStage[]>([]);
  const [labels, setLabels] = useState<WaLabel[]>([]);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [messages, setMessages] = useState<WaChatMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const messageCacheRef = useRef<Map<string, WaChatMessage[]>>(new Map());

  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  // Lazy slice messages for instantaneous 60fps DOM rendering
  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) return messages;
    return messages.slice(messages.length - visibleCount);
  }, [messages, visibleCount]);

  const scrollToBottom = (behavior: "auto" | "smooth" = "auto") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (behavior === "smooth") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 120;
    isNearBottomRef.current = isAtBottom;
  };

  // Sync selected session when activeSessionId or sessions change
  useEffect(() => {
    if (activeSessionId) {
      setSelectedSessionId(activeSessionId);
    } else if (sessions.length > 0 && !selectedSessionId) {
      const working = sessions.find((s) => s.status === "WORKING");
      setSelectedSessionId(working ? working.id : sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  // Fetch chat rooms for the chosen session
  const fetchChatRooms = useCallback(
    async (sessionId: string, silent = false) => {
      if (!sessionId) return;
      try {
        if (!silent) setIsRoomsLoading(true);
        const res = await fetch(`/api/wa/chats?sessionId=${sessionId}&limit=100`);
        if (!res.ok) {
          setRooms([]);
          return;
        }
        const data = await res.json();
        const items: WaChatRoom[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setRooms(items);

        // Auto-select first room if none selected
        if (!selectedRoomRef.current && items.length > 0) {
          setSelectedRoom(items[0]);
        } else if (selectedRoomRef.current) {
          const updated = items.find((r) => r.id === selectedRoomRef.current?.id);
          if (updated) setSelectedRoom(updated);
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setIsRoomsLoading(false);
      }
    },
    []
  );

  // Fetch pipeline stages globally across company
  const fetchStages = useCallback(async () => {
    try {
      const url = selectedSessionId
        ? `/api/wa/pipeline/stages?sessionId=${encodeURIComponent(selectedSessionId)}`
        : `/api/wa/pipeline/stages`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.stages)) {
        setStages(data.stages);
      }
    } catch {
      // ignore
    }
  }, [selectedSessionId]);

  // Fetch labels globally across company
  const fetchLabels = useCallback(async () => {
    try {
      const url = selectedSessionId
        ? `/api/wa/labels?sessionId=${encodeURIComponent(selectedSessionId)}`
        : `/api/wa/labels`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.labels)) {
        setLabels(data.labels);
      }
    } catch {
      // ignore
    }
  }, [selectedSessionId]);

  useEffect(() => {
    fetchStages();
    fetchLabels();
  }, [fetchStages, fetchLabels]);

  // Handle stage selection for current active contact
  const handleSelectStage = useCallback(
    async (stageId: string | null) => {
      if (!selectedRoom) return;
      const contactId = selectedRoom.id;
      const targetStage = stageId ? stages.find((s) => s.id === stageId) || null : null;

      // 0ms optimistic update
      setSelectedRoom((prev) => (prev ? { ...prev, stage: targetStage } : null));
      setRooms((prev) =>
        prev.map((r) => (r.id === contactId ? { ...r, stage: targetStage } : r))
      );

      try {
        const res = await fetch(`/api/wa/contacts/${encodeURIComponent(contactId)}/stage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId, sessionId: selectedSessionId }),
        });
        if (!res.ok) throw new Error("Gagal memperbarui status stage");
        fetchStages();
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah stage");
        fetchChatRooms(selectedSessionId, true);
      }
    },
    [selectedRoom, stages, fetchStages, fetchChatRooms, selectedSessionId]
  );

  // Handle labels updating for current active contact
  const handleUpdateLabels = useCallback(
    async (labelIds: string[]) => {
      if (!selectedRoom) return;
      const contactId = selectedRoom.id;
      const targetLabels = labels.filter((l) => labelIds.includes(l.id));

      // 0ms optimistic update
      setSelectedRoom((prev) => (prev ? { ...prev, labels: targetLabels } : null));
      setRooms((prev) =>
        prev.map((r) => (r.id === contactId ? { ...r, labels: targetLabels } : r))
      );

      try {
        const res = await fetch(`/api/wa/contacts/${encodeURIComponent(contactId)}/labels`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelIds, sessionId: selectedSessionId }),
        });
        if (!res.ok) throw new Error("Gagal memperbarui label");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah label");
        fetchChatRooms(selectedSessionId, true);
      }
    },
    [selectedRoom, labels, fetchChatRooms, selectedSessionId]
  );

  // Handle inline creation of new label directly from tagger
  const handleCreateLabel = useCallback(
    async (name: string, color: string) => {
      if (!selectedSessionId) return;
      try {
        const res = await fetch("/api/wa/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            name,
            color,
          }),
        });
        if (!res.ok) throw new Error("Gagal membuat label");
        const data = await res.json();
        if (data?.label) {
          setLabels((prev) => [...prev, data.label]);
          toast.success(`Label "${name}" berhasil dibuat`);
          if (selectedRoom) {
            const currentIds = (selectedRoom.labels || []).map((l) => l.id);
            await handleUpdateLabels([...currentIds, data.label.id]);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat label");
      }
    },
    [selectedSessionId, selectedRoom, handleUpdateLabels]
  );

  // Fetch messages for the selected room with in-memory caching
  const fetchRoomMessages = useCallback(
    async (chatId: string, silent = false) => {
      if (!chatId || !selectedSessionId) return;
      try {
        if (!silent) setIsMessagesLoading(true);
        const res = await fetch(
          `/api/wa/chats/${encodeURIComponent(chatId)}/messages?sessionId=${selectedSessionId}&limit=100`
        );
        if (!res.ok) return;
        const data = await res.json();
        const items: WaChatMessage[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const normalized: WaChatMessage[] = items.map((m) => ({
          ...m,
          id: extractMessageId(m.id),
        }));
        const sorted = [...normalized].sort((a, b) => a.timestamp - b.timestamp);

        // Deduplicate messages by id or by exact (body + fromMe + timestamp within 4s)
        const seenIds = new Set<string>();
        const deduplicated: WaChatMessage[] = [];
        for (const m of sorted) {
          const mId = extractMessageId(m.id);
          if (!mId || seenIds.has(mId)) continue;

          const isDup = deduplicated.some(
            (d) =>
              d.fromMe === m.fromMe &&
              d.body === m.body &&
              Math.abs(d.timestamp - m.timestamp) <= 4
          );
          if (isDup) continue;

          seenIds.add(mId);
          deduplicated.push(m);
        }

        // Save into local memory cache
        messageCacheRef.current.set(chatId, deduplicated);

        // If user is currently looking at this room, update state smoothly
        if (selectedRoomRef.current?.id === chatId) {
          setMessages((prev) => {
            if (
              prev.length === deduplicated.length &&
              prev[prev.length - 1]?.id === deduplicated[deduplicated.length - 1]?.id &&
              prev[prev.length - 1]?.ack === deduplicated[deduplicated.length - 1]?.ack
            ) {
              return prev; // Identical, avoid re-render
            }
            return deduplicated;
          });
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setIsMessagesLoading(false);
      }
    },
    [selectedSessionId]
  );

  // Fetch rooms on session switch
  useEffect(() => {
    if (selectedSessionId) {
      setSelectedRoom(null);
      setMessages([]);
      messageCacheRef.current.clear();
      fetchChatRooms(selectedSessionId);
    }
  }, [selectedSessionId, fetchChatRooms]);

  // Seamless room selection: instant 0ms cache display + background sync
  useEffect(() => {
    if (!selectedRoom?.id) return;
    setVisibleCount(30);
    isNearBottomRef.current = true;

    const cached = messageCacheRef.current.get(selectedRoom.id);
    if (cached && cached.length > 0) {
      setMessages(cached);
      setIsMessagesLoading(false);
      fetchRoomMessages(selectedRoom.id, true);
    } else {
      setMessages([]);
      fetchRoomMessages(selectedRoom.id, false);
    }
  }, [selectedRoom?.id, fetchRoomMessages]);

  // Fallback background sync every 10 seconds for open room
  useEffect(() => {
    if (!selectedRoom?.id || !selectedSessionId) return;
    const interval = setInterval(() => {
      fetchRoomMessages(selectedRoom.id, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedRoom?.id, selectedSessionId, fetchRoomMessages]);

  // Auto-scroll inside message container only (never scrolls page window)
  useEffect(() => {
    if (messages.length === 0) return;
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    }
  }, [messages]);

  // Real-Time Server-Sent Events (SSE) listener
  useWaEvents(selectedSessionId, {
    onMessage: (payload) => {
      if (!payload) return;
      const curRoom = selectedRoomRef.current;
      const isForCurrentRoom =
        curRoom &&
        isMatchingChat(curRoom.id, payload.chatId, payload.from, payload.to);

      const payloadMsgId = extractMessageId(payload.id);

      // 1. If message belongs to currently open room, append immediately in 0ms
      if (isForCurrentRoom && curRoom) {
        const newMessage: WaChatMessage = {
          id: payloadMsgId,
          body: payload.body || "",
          timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
          from: payload.from,
          to: payload.to,
          fromMe: !!payload.fromMe,
          hasMedia: !!payload.hasMedia,
          media: payload.media || null,
          ack: payload.ack || 1,
          ackName: payload.ackName || "DELIVERED",
        };

        setMessages((prev) => {
          if (prev.some((m) => extractMessageId(m.id) === payloadMsgId)) return prev;

          // 1. Replace matching temporary optimistic message if present
          const tempIdx = prev.findIndex(
            (m) =>
              isTempMessageId(m.id) &&
              m.fromMe &&
              m.body === payload.body
          );
          if (tempIdx !== -1) {
            const nextMessages = prev.map((m, idx) => (idx === tempIdx ? newMessage : m));
            messageCacheRef.current.set(curRoom.id, nextMessages);
            return nextMessages;
          }

          // 2. Prevent duplicate bubble if an identical outbound message was recently rendered
          const isDuplicateOutbound = prev.some(
            (m) =>
              m.fromMe &&
              m.body === payload.body &&
              Math.abs((m.timestamp || 0) - (payload.timestamp || 0)) < 15
          );
          if (isDuplicateOutbound) {
            const nextMessages = prev.map((m) =>
              m.fromMe &&
              m.body === payload.body &&
              Math.abs((m.timestamp || 0) - (payload.timestamp || 0)) < 15
                ? { ...m, id: payloadMsgId, ack: payload.ack || m.ack || 1 }
                : m
            );
            messageCacheRef.current.set(curRoom.id, nextMessages);
            return nextMessages;
          }

          const nextMessages = [...prev, newMessage];
          messageCacheRef.current.set(curRoom.id, nextMessages);
          return nextMessages;
        });

        if (isNearBottomRef.current) {
          requestAnimationFrame(() => {
            scrollToBottom("smooth");
          });
        }
      } else {
        // Message is for another room: update cache if present
        const matchedRoomId =
          rooms.find((r) =>
            isMatchingChat(r.id, payload.chatId, payload.from, payload.to)
          )?.id || payload.chatId;

        if (matchedRoomId && messageCacheRef.current.has(matchedRoomId)) {
          const cached = messageCacheRef.current.get(matchedRoomId)!;
          if (!cached.some((m) => extractMessageId(m.id) === payloadMsgId)) {
            messageCacheRef.current.set(matchedRoomId, [
              ...cached,
              {
                id: payloadMsgId,
                body: payload.body || "",
                timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
                from: payload.from,
                to: payload.to,
                fromMe: !!payload.fromMe,
                hasMedia: !!payload.hasMedia,
                media: payload.media || null,
                ack: payload.ack || 1,
                ackName: payload.ackName || "DELIVERED",
              },
            ]);
          }
        }
      }

      // 2. Update room list preview & move room to top instantaneously (0ms)
      setRooms((prev) => {
        const roomIdx = prev.findIndex((r) =>
          isMatchingChat(r.id, payload.chatId, payload.from, payload.to)
        );
        if (roomIdx !== -1) {
          const isCurrentRoom =
            curRoom &&
            isMatchingChat(curRoom.id, payload.chatId, payload.from, payload.to);
          const updatedRoom: WaChatRoom = {
            ...prev[roomIdx],
            timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
            unreadCount:
              isCurrentRoom || payload.fromMe
                ? 0
                : (prev[roomIdx].unreadCount || 0) + 1,
            lastMessage: {
              id: payloadMsgId,
              body: payload.body || (payload.hasMedia ? "[Media / Dokumen]" : ""),
              timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
              fromMe: !!payload.fromMe,
              hasMedia: !!payload.hasMedia,
              ack: payload.ack,
            },
          };
          const copy = [...prev];
          copy.splice(roomIdx, 1);
          return [updatedRoom, ...copy];
        } else {
          const isGrp =
            !!payload.from?.includes("@g.us") ||
            !!payload.chatId?.includes("@g.us");
          const newRoom: WaChatRoom = {
            id: payload.chatId || payload.from || "",
            name:
              payload._data?.pushName ||
              payload.from?.replace(/@(c\.us|s\.whatsapp\.net|lid|g\.us)/, "") ||
              "Kontak WhatsApp",
            isGroup: isGrp,
            timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
            unreadCount: payload.fromMe ? 0 : 1,
            lastMessage: {
              id: payloadMsgId,
              body: payload.body || (payload.hasMedia ? "[Media / Dokumen]" : ""),
              timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
              fromMe: !!payload.fromMe,
              hasMedia: !!payload.hasMedia,
              ack: payload.ack,
            },
          };
          fetchChatRooms(selectedSessionId, true);
          return [newRoom, ...prev];
        }
      });
    },

    onMessageAck: (payload) => {
      if (!payload?.id) return;
      const targetId = extractMessageId(payload.id);
      setMessages((prev) =>
        prev.map((m) =>
          extractMessageId(m.id) === targetId
            ? { ...m, ack: payload.ack, ackName: payload.ackName }
            : m
        )
      );
      if (selectedRoomRef.current) {
        const cached = messageCacheRef.current.get(selectedRoomRef.current.id);
        if (cached) {
          messageCacheRef.current.set(
            selectedRoomRef.current.id,
            cached.map((m) =>
              extractMessageId(m.id) === targetId
                ? { ...m, ack: payload.ack, ackName: payload.ackName }
                : m
            )
          );
        }
      }
    },

    onContactUpdated: (payload) => {
      if (!payload?.contactId) return;
      const { contactId, stage, labels: updatedLabels } = payload;
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === contactId) {
            return {
              ...r,
              stage: stage !== undefined ? stage : r.stage,
              labels: updatedLabels !== undefined ? updatedLabels : r.labels,
            };
          }
          return r;
        })
      );
      if (selectedRoomRef.current?.id === contactId) {
        setSelectedRoom((prev) =>
          prev
            ? {
                ...prev,
                stage: stage !== undefined ? stage : prev.stage,
                labels: updatedLabels !== undefined ? updatedLabels : prev.labels,
              }
            : null
        );
      }
    },
  });

  // Handle Send Reply Message with instant 0ms optimistic UI update
  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || !selectedRoom || !selectedSessionId) return;

      const currentRoomId = selectedRoom.id;
      const tempId = "temp_" + Date.now();
      const optimisticMessage: WaChatMessage = {
        id: tempId,
        body: messageText,
        timestamp: Math.floor(Date.now() / 1000),
        from: selectedSessionId,
        to: currentRoomId,
        fromMe: true,
        hasMedia: false,
        ack: 0,
        ackName: "PENDING",
      };

      // 1. Immediately update active messages & in-memory cache (0ms)
      setMessages((prev) => {
        const next = [...prev, optimisticMessage];
        messageCacheRef.current.set(currentRoomId, next);
        return next;
      });

      // 2. Immediately update room list (move to top, set lastMessage) in 0ms
      setRooms((prev) => {
        const roomIdx = prev.findIndex((r) => r.id === currentRoomId);
        if (roomIdx === -1) return prev;
        const updatedRoom: WaChatRoom = {
          ...prev[roomIdx],
          timestamp: Math.floor(Date.now() / 1000),
          lastMessage: {
            id: tempId,
            body: messageText,
            timestamp: Math.floor(Date.now() / 1000),
            fromMe: true,
            hasMedia: false,
            ack: 0,
          },
        };
        const copy = [...prev];
        copy.splice(roomIdx, 1);
        return [updatedRoom, ...copy];
      });

      isNearBottomRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });

      try {
        setIsSending(true);
        const res = await fetch(`/api/wa/chats/${encodeURIComponent(currentRoomId)}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            text: messageText,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || data?.error || "Gagal mengirim pesan");

        const realId = extractMessageId(data?.data?.id) || tempId;

        // 3. Upgrade optimistic message with real server id & ack: 1 (SENT)
        setMessages((prev) => {
          const next = prev.map((m) =>
            extractMessageId(m.id) === tempId ? { ...m, id: realId, ack: 1, ackName: "SENT" } : m
          );
          messageCacheRef.current.set(currentRoomId, next);
          return next;
        });

        setRooms((prev) =>
          prev.map((r) =>
            r.id === currentRoomId && r.lastMessage && extractMessageId(r.lastMessage.id) === tempId
              ? { ...r, lastMessage: { ...r.lastMessage, id: realId, ack: 1 } }
              : r
          )
        );
      } catch (err: any) {
        toast.error(err.message);
        setMessages((prev) => {
          const next = prev.map((m) =>
            extractMessageId(m.id) === tempId ? { ...m, ackName: "FAILED" } : m
          );
          messageCacheRef.current.set(currentRoomId, next);
          return next;
        });
      } finally {
        setIsSending(false);
      }
    },
    [selectedRoom, selectedSessionId]
  );

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncHistory = async () => {
    if (!selectedSessionId) {
      toast.error("Pilih sesi WhatsApp terlebih dahulu");
      return;
    }
    try {
      setIsSyncing(true);
      const res = await fetch(
        `/api/wa/chats/sync?sessionId=${encodeURIComponent(selectedSessionId)}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Gagal menyinkronkan riwayat chat");
      }
      const { messagesSynced = 0, messagesSkipped = 0 } = data?.data || {};
      toast.success(
        `Sinkronisasi selesai! ${messagesSynced} pesan baru berhasil disimpan ke database (${messagesSkipped} sudah ada).`,
        { duration: 5000 }
      );
      await fetchChatRooms(selectedSessionId);
      if (selectedRoomRef.current) {
        await fetchRoomMessages(selectedRoomRef.current.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyinkronkan riwayat");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedStageFilter) {
      result = result.filter((r) => r.stage?.id === selectedStageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        return (
          r.name?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          (r.phoneNumber && r.phoneNumber.includes(q)) ||
          r.lastMessage?.body?.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [rooms, searchQuery, selectedStageFilter]);

  const activeSessionObj = sessions.find((s) => s.id === selectedSessionId);
  const isSessionConnected = activeSessionObj?.status === "WORKING";

  return (
    <div className="space-y-4">
      {/* ── Top Bar: Session Switcher, Mode Toggle & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              WhatsApp Conversational CRM
              {isSessionConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px]">
                  {activeSessionObj?.status || "Offline"}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              Kelola obrolan, perbarui tahapan prospek penjualan (pipeline), dan beri tag merchandise klien.
            </p>
          </div>
        </div>

        {/* Center/Right: View Switcher & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("INBOX")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === "INBOX"
                  ? "bg-white text-stone-900 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Inbox</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("KANBAN")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === "KANBAN"
                  ? "bg-white text-stone-900 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-primary" />
              <span>Pipeline Kanban</span>
            </button>
          </div>

          {/* Session Selector Dropdown */}
          <div className="w-48">
            <Select
              value={selectedSessionId}
              onValueChange={(val) => {
                setSelectedSessionId(val);
                onSelectSession(val);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50">
                <SelectValue placeholder="Pilih Akun WhatsApp" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-[10px] text-stone-400 ml-1.5">
                      ({s.phoneNumber || s.status})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 text-xs text-stone-700 bg-white hover:bg-stone-50 border-stone-300 gap-1.5 shrink-0"
            title="Kelola alur pipeline stages dan tag labels"
          >
            <Settings2 className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Atur Stage & Label</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncHistory}
            disabled={isSyncing || !isSessionConnected}
            className="h-8 text-xs text-stone-700 bg-white hover:bg-stone-50 border-stone-300 gap-1.5 shrink-0"
            title="Tarik seluruh riwayat obrolan dari WhatsApp ke database PostgreSQL"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <DownloadCloud className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>{isSyncing ? "Menyinkronkan..." : "Tarik Riwayat"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchChatRooms(selectedSessionId);
              fetchStages();
              fetchLabels();
            }}
            disabled={isRoomsLoading || isSyncing}
            className="h-8 text-xs text-stone-600 shrink-0"
            title="Segarkan daftar obrolan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRoomsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Warning if session is not connected */}
      {!isSessionConnected && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Sesi <strong>"{selectedSessionId || "default"}"</strong> belum terhubung ({activeSessionObj?.status || "OFFLINE"}). Buka tab <strong>Device & Sessions</strong> untuk melakukan scan QR agar pesan dapat disinkronkan.
          </span>
        </div>
      )}

      {/* ── Main View: Toggle between Inbox Dual Pane and Kanban Pipeline Board ── */}
      {viewMode === "KANBAN" ? (
        <div className={`min-h-0 ${isDedicatedPage ? "h-[calc(100vh-230px)] min-h-[460px]" : "h-[680px]"}`}>
          <WaPipelineKanban
            sessionId={selectedSessionId}
            onOpenChat={(roomId) => {
              setViewMode("INBOX");
              const target = rooms.find((r) => r.id === roomId);
              if (target) setSelectedRoom(target);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      ) : (
        <Card className="border-stone-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className={`grid grid-cols-1 md:grid-cols-12 min-h-0 ${isDedicatedPage ? "h-[calc(100vh-230px)] min-h-[460px]" : "h-[680px]"}`}>
              {/* ── LEFT PANE: Chat Room List (4 cols) ── */}
              <div className="md:col-span-4 border-r border-stone-200 flex flex-col h-full min-h-0 bg-stone-50/50">
                {/* Search Bar */}
                <div className="p-3 border-b border-stone-200 bg-white shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <Input
                      placeholder="Cari kontak atau pesan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-stone-50 border-stone-200"
                    />
                  </div>
                </div>

                {/* Stage Filter Scrollable Bar */}
                <div className="px-3 py-2 border-b border-stone-200 bg-white shrink-0 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedStageFilter(null)}
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedStageFilter === null
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Semua ({rooms.length})
                  </button>
                  {stages.map((st) => {
                    const countInStage = rooms.filter((r) => r.stage?.id === st.id).length;
                    const isFilterActive = selectedStageFilter === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          setSelectedStageFilter(isFilterActive ? null : st.id)
                        }
                        className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                          isFilterActive
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.color }}
                        />
                        <span>{st.name}</span>
                        <span className="opacity-70 text-[10px]">({countInStage})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Chat List Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100">
                  {isRoomsLoading && rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-stone-400">
                      <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
                      <span className="text-xs">Memuat obrolan WhatsApp...</span>
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-400">
                      {searchQuery ? "Tidak ditemukan obrolan yang cocok" : "Belum ada obrolan aktif pada akun ini."}
                    </div>
                  ) : (
                    filteredRooms.map((room) => {
                      const isSelected = selectedRoom?.id === room.id;
                      const contactInitial = room.name ? room.name.charAt(0).toUpperCase() : "?";

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setSelectedRoom(room)}
                          className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                            isSelected
                              ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                              : "hover:bg-stone-100/70"
                          }`}
                        >
                          <Avatar className="w-10 h-10 border shrink-0">
                            {room.picture ? (
                              <AvatarImage src={room.picture} alt={room.name} />
                            ) : null}
                            <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                              {room.isGroup ? <Users className="w-4 h-4" /> : contactInitial}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-xs text-stone-900 truncate">
                                {room.name}
                              </span>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {formatRoomTime(room.timestamp)}
                              </span>
                            </div>

                            {room.phoneNumber && room.phoneNumber !== room.name && (
                              <p className="text-[10px] text-stone-400 font-mono leading-none truncate mt-0.5">
                                {room.phoneNumber.startsWith("62")
                                  ? `+62 ${room.phoneNumber.slice(2)}`
                                  : room.phoneNumber}
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className="text-[11px] text-stone-500 truncate leading-tight">
                                {room.lastMessage?.fromMe && (
                                  <span className="font-medium text-stone-700">Anda: </span>
                                )}
                                {room.lastMessage?.body || "Obrolan dibuka"}
                              </p>
                              {room.unreadCount > 0 && (
                                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                  {room.unreadCount}
                                </span>
                              )}
                            </div>

                            {/* Stage & Labels Badges */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {room.stage && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    backgroundColor: `${room.stage.color}15`,
                                    color: room.stage.color,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: room.stage.color }}
                                  />
                                  <span className="truncate max-w-[90px]">{room.stage.name}</span>
                                </span>
                              )}
                              {room.labels?.slice(0, 2).map((l) => (
                                <span
                                  key={l.id}
                                  className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-medium bg-stone-100 text-stone-600 truncate max-w-[70px]"
                                >
                                  {l.name}
                                </span>
                              ))}
                              {room.labels && room.labels.length > 2 && (
                                <span className="text-[9px] text-stone-400">
                                  +{room.labels.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── RIGHT PANE: Active Conversation View (8 cols) ── */}
              <div className="md:col-span-8 flex flex-col h-full min-h-0 bg-[#f0f2f5] relative">
                {selectedRoom ? (
                  <>
                    {/* Conversation Header */}
                    <div className="p-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 shadow-2xs z-10 gap-2 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 border shrink-0">
                          {selectedRoom.picture ? (
                            <AvatarImage src={selectedRoom.picture} alt={selectedRoom.name} />
                          ) : null}
                          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                            {selectedRoom.isGroup ? <Users className="w-4 h-4" /> : selectedRoom.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-stone-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">{selectedRoom.name}</span>
                            {selectedRoom.isGroup && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                Grup
                              </Badge>
                            )}
                          </h3>
                          <p className="text-[10px] text-stone-400 font-mono truncate">
                            {selectedRoom.phoneNumber
                              ? (selectedRoom.phoneNumber.startsWith("62")
                                  ? `+62 ${selectedRoom.phoneNumber.slice(2)}`
                                  : selectedRoom.phoneNumber)
                              : selectedRoom.id.replace("@c.us", "").replace("@lid", "")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Lead Pipeline Stage Selector */}
                        <WaContactStageSelector
                          stages={stages}
                          currentStage={selectedRoom.stage}
                          onSelectStage={handleSelectStage}
                          disabled={!isSessionConnected}
                        />

                        {/* Custom Labels / Tags Popover */}
                        <WaContactLabelsTagger
                          availableLabels={labels}
                          currentLabels={selectedRoom.labels || []}
                          onUpdateLabels={handleUpdateLabels}
                          onCreateLabel={handleCreateLabel}
                          disabled={!isSessionConnected}
                        />

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchRoomMessages(selectedRoom.id)}
                          disabled={isMessagesLoading}
                          className="h-7 text-xs text-stone-600"
                          title="Segarkan pesan obrolan"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isMessagesLoading ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Messages Bubble Feed */}
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleMessagesScroll}
                      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 bg-repeat"
                      style={{
                        backgroundImage: `radial-gradient(circle, #e2e8f0 10%, transparent 11%)`,
                        backgroundSize: "20px 20px",
                      }}
                    >
                      {isMessagesLoading && messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400">
                          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                          <span className="text-xs">Memuat riwayat pesan...</span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-xs text-stone-400">
                          <MessageSquare className="w-8 h-8 mb-2 text-stone-300" />
                          <p>Belum ada riwayat pesan dalam obrolan ini.</p>
                        </div>
                      ) : (
                        <>
                          {/* Lazy load older messages button */}
                          {messages.length > visibleCount && (
                            <div className="flex justify-center py-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVisibleCount((prev) => prev + 30)}
                                className="text-[11px] h-7 px-3 bg-white/90 hover:bg-white text-stone-600 rounded-full shadow-2xs border-stone-200 gap-1.5"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                                Muat riwayat lebih lama ({messages.length - visibleCount} lagi)
                              </Button>
                            </div>
                          )}

                          {visibleMessages.map((msg, index) => (
                            <MessageBubble key={extractMessageId(msg.id) || index} msg={msg} />
                          ))}
                        </>
                      )}
                    </div>

                    {/* Message Input Bar (Isolated & Memoized for zero typing lag) */}
                    <WaMessageInput
                      onSendMessage={handleSendMessage}
                      disabled={!isSessionConnected || isSending}
                      placeholder={`Balas ke ${selectedRoom.name}... (Enter untuk kirim, Shift+Enter untuk baris baru)`}
                    />
                  </>
                ) : (
                  /* Empty Selection Placeholder */
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-stone-400">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                      <MessageSquare className="w-8 h-8 text-stone-400" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-700 mb-1">
                      Pilih Ruang Obrolan
                    </h4>
                    <p className="text-xs max-w-sm leading-relaxed">
                      Pilih salah satu kontak atau grup di panel kiri untuk membuka riwayat percakapan dan membalas pesan WhatsApp secara langsung.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Stages & Labels Customization Modal */}
      <WaPipelineSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        sessionId={selectedSessionId}
        onStagesChanged={() => {
          fetchStages();
          fetchChatRooms(selectedSessionId, true);
        }}
        onLabelsChanged={() => {
          fetchLabels();
          fetchChatRooms(selectedSessionId, true);
        }}
      />
    </div>
  );
}
