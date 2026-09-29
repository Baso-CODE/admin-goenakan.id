"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WaSession } from "@/types/waPortal.type";
import { Check, Info, Loader2, MessageSquare, Paperclip, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WaMessageSenderProps {
  sessions: WaSession[];
  activeSessionId: string;
  onMessageSent: () => void;
}

export function formatWaNumber(phone: string): string {
  // Strip all non-digit characters
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

export function WaMessageSender({
  sessions,
  activeSessionId,
  onMessageSent,
}: WaMessageSenderProps) {
  const [recipient, setRecipient] = useState("");
  const [messageText, setMessageText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedSession, setSelectedSession] = useState(activeSessionId || sessions[0]?.id || "");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedSession(activeSessionId);
    } else if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  const normalizedPhone = recipient.trim() ? formatWaNumber(recipient.trim()) : "";

  const handleInsertTag = (tag: string) => {
    setMessageText((prev) => `${prev} ${tag}`);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sessions.length === 0) {
      toast.error("Belum ada session WhatsApp. Buat session terlebih dahulu di tab Device & Sessions.");
      return;
    }
    if (!normalizedPhone || normalizedPhone.length < 9) {
      toast.error("Nomor penerima tidak valid (minimal 9 digit)");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Pesan teks tidak boleh kosong");
      return;
    }

    try {
      setIsSending(true);
      const payload: any = {
        to: normalizedPhone,
        text: messageText.trim(),
      };
      if (selectedSession) {
        payload.sessionId = selectedSession;
      }
      if (mediaUrl.trim()) {
        payload.mediaUrl = mediaUrl.trim();
      }

      const res = await fetch("/api/wa/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal mengirimkan pesan");

      toast.success(`Pesan berhasil masuk antrean untuk ${normalizedPhone}!`);
      setMessageText("");
      setRecipient("");
      setMediaUrl("");
      onMessageSent();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirimkan pesan WhatsApp");
    } finally {
      setIsSending(false);
    }
  };

  const isConnected = sessions.find((s) => s.id === (selectedSession || activeSessionId))?.status === "WORKING";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Left Column: Message Compose Form ── */}
      <div className="lg:col-span-8">
        <Card className="border-stone-200 shadow-2xs">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Kirim Pesan WhatsApp Langsung
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Kirimkan pesan personal, notifikasi order, atau broadcast langsung ke nomor pelanggan.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5">
            {!isConnected && (
              <div className="mb-5 p-3 rounded-lg border border-amber-200 bg-amber-50/70 flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Session WhatsApp belum terhubung</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Pastikan status session aktif adalah <strong>Connected</strong> di tab "Device & Sessions" sebelum mengirimkan pesan ke pelanggan.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              {/* Row 1: Session Selector & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="session-select" className="text-xs font-semibold text-stone-700">
                    Kirim Menggunakan Session
                  </Label>
                  <Select
                    value={selectedSession || activeSessionId}
                    onValueChange={setSelectedSession}
                  >
                    <SelectTrigger id="session-select" className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Pilih Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name} ({s.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="recipient" className="text-xs font-semibold text-stone-700">
                      Nomor Tujuan (HP / WhatsApp)
                    </Label>
                    {normalizedPhone && (
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                        Preview: +{normalizedPhone}
                      </span>
                    )}
                  </div>
                  <Input
                    id="recipient"
                    placeholder="08123456789 atau 628123456789"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[10px] text-stone-400">
                    Otomatis dikonversi ke format internasional (+62).
                  </p>
                </div>
              </div>

              {/* Row 2: Message Content */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message-text" className="text-xs font-semibold text-stone-700">
                    Isi Pesan Teks
                  </Label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {messageText.length} karakter
                  </span>
                </div>
                <Textarea
                  id="message-text"
                  placeholder="Halo Kak, terima kasih telah berbelanja di Goenakan.id..."
                  rows={6}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="text-xs leading-relaxed resize-y"
                  required
                />
              </div>

              {/* Template Tag Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                  Insert Tag:
                </span>
                {["{{name}}", "{{orderId}}", "{{total}}", "{{trackingNumber}}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="px-2 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[10px] font-mono font-medium text-stone-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Row 3: Optional Media Attachment */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="media-url" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3 text-stone-400" /> URL Lampiran Media (Opsional)
                </Label>
                <Input
                  id="media-url"
                  placeholder="https://res.cloudinary.com/.../receipt.pdf atau .jpg / .png"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="submit"
                  disabled={isSending}
                  className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Mengantrekan Pesan...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Kirim Pesan Sekarang
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Right Column: Tips & Guidelines ── */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-stone-200 bg-stone-50/50 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Panduan Anti-Ban
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-[11px] text-stone-600 leading-relaxed">
            <p>
              • Catha WA API dilengkapi dengan <strong>asynchronous jitter delay</strong> otomatis untuk melindungi akun WhatsApp Anda dari risiko blokir spam.
            </p>
            <p>
              • Hindari mengirim ratusan pesan serentak ke nomor yang belum pernah berinteraksi dengan akun bisnis Anda.
            </p>
            <p>
              • Pastikan pesan diawali salam yang personal dan relevan dengan transaksi pemesanan pelanggan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
