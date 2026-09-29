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
import { WaChatMessage, WaChatRoom, WaSession } from "@/types/waPortal.type";
import {
  Check,
  CheckCheck,
  ChevronUp,
  Clock,
  CornerDownLeft,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  MessageCircle,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  User,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useWaEvents } from "../hooks/useWaEvents";

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

        // Save into local memory cache
        messageCacheRef.current.set(chatId, sorted);

        // If user is currently looking at this room, update state smoothly
        if (selectedRoomRef.current?.id === chatId) {
          setMessages((prev) => {
            if (
              prev.length === sorted.length &&
              prev[prev.length - 1]?.id === sorted[sorted.length - 1]?.id &&
              prev[prev.length - 1]?.ack === sorted[sorted.length - 1]?.ack
            ) {
              return prev; // Identical, avoid re-render
            }
            return sorted;
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
          // Replace matching temporary optimistic message if present
          const tempIdx = prev.findIndex(
            (m) =>
              isTempMessageId(m.id) &&
              m.fromMe &&
              m.body === payload.body
          );
          let nextMessages: WaChatMessage[];
          if (tempIdx !== -1) {
            nextMessages = prev.map((m, idx) => (idx === tempIdx ? newMessage : m));
          } else {
            nextMessages = [...prev, newMessage];
          }
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

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => {
      return (
        r.name?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.lastMessage?.body?.toLowerCase().includes(q)
      );
    });
  }, [rooms, searchQuery]);

  const activeSessionObj = sessions.find((s) => s.id === selectedSessionId);
  const isSessionConnected = activeSessionObj?.status === "WORKING";

  return (
    <div className="space-y-4">
      {/* ── Top Bar: Session Switcher & Status ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              WhatsApp Live Chat Inbox
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
              Lihat riwayat obrolan dan balas pesan langsung dari nomor WhatsApp yang tertaut.
            </p>
          </div>
        </div>

        {/* Session Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="w-56">
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
            onClick={() => fetchChatRooms(selectedSessionId)}
            disabled={isRoomsLoading}
            className="h-8 text-xs text-stone-600"
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

      {/* ── Main Chat Interface: Dual Pane ── */}
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
                  <div className="p-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 shadow-2xs z-10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border">
                        {selectedRoom.picture ? (
                          <AvatarImage src={selectedRoom.picture} alt={selectedRoom.name} />
                        ) : null}
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {selectedRoom.isGroup ? <Users className="w-4 h-4" /> : selectedRoom.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          {selectedRoom.name}
                          {selectedRoom.isGroup && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              Grup
                            </Badge>
                          )}
                        </h3>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {selectedRoom.id.replace("@c.us", "").replace("@lid", "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
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
    </div>
  );
}
