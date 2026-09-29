"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { WaMessage, WaSession } from "@/types/waPortal.type";
import { formatWaNumber } from "./WaMessageSender";
import {
  Ban,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WaMessageSchedulerProps {
  sessions: WaSession[];
  activeSessionId: string;
  onScheduled: () => void;
}

export function WaMessageScheduler({
  sessions,
  activeSessionId,
  onScheduled,
}: WaMessageSchedulerProps) {
  const [recipient, setRecipient] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedSession, setSelectedSession] = useState(activeSessionId || sessions[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedSession(activeSessionId);
    } else if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  const [scheduledList, setScheduledList] = useState<WaMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const normalizedPhone = recipient.trim() ? formatWaNumber(recipient.trim()) : "";

  const fetchScheduledMessages = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch("/api/wa/messages?status=PENDING&limit=50");
      if (!res.ok) return;
      const data = await res.json();
      const items: WaMessage[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setScheduledList(items.filter((m) => !!m.sendAt));
    } catch {
      // ignore
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchScheduledMessages();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
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
    if (!sendAt) {
      toast.error("Waktu jadwal kirim (Send At) wajib diisi");
      return;
    }

    const scheduledDate = new Date(sendAt);
    if (scheduledDate.getTime() <= Date.now()) {
      toast.error("Waktu jadwal kirim harus di masa depan");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        to: normalizedPhone,
        text: messageText.trim(),
        sendAt: scheduledDate.toISOString(),
      };
      if (selectedSession) {
        payload.sessionId = selectedSession;
      }
      if (mediaUrl.trim()) {
        payload.mediaUrl = mediaUrl.trim();
      }

      const res = await fetch("/api/wa/messages/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menjadwalkan pesan");

      toast.success(`Pesan berhasil dijadwalkan untuk ${scheduledDate.toLocaleString("id-ID")}!`);
      setRecipient("");
      setMessageText("");
      setSendAt("");
      setMediaUrl("");
      onScheduled();
      fetchScheduledMessages();
    } catch (err: any) {
      toast.error(err.message || "Gagal menjadwalkan pesan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMessage = async (msg: WaMessage) => {
    if (!confirm(`Batalkan pesan terjadwal ke +${msg.to}?`)) return;
    try {
      setCancellingId(msg.id);
      const res = await fetch(`/api/wa/messages/${msg.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal membatalkan pesan");

      toast.success("Pesan terjadwal berhasil dibatalkan.");
      fetchScheduledMessages();
      onScheduled();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Schedule Message Form Card ── */}
      <Card className="border-stone-200 shadow-2xs">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Jadwalkan Pesan WhatsApp
          </CardTitle>
          <CardDescription className="text-xs text-stone-500">
            Kirimkan pesan otomatis di tanggal dan jam tertentu di masa depan.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSchedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sched-session" className="text-xs font-semibold text-stone-700">
                  Session
                </Label>
                <Select
                  value={selectedSession || activeSessionId}
                  onValueChange={setSelectedSession}
                >
                  <SelectTrigger id="sched-session" className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Pilih Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="sched-recipient" className="text-xs font-semibold text-stone-700">
                    Nomor Tujuan
                  </Label>
                  {normalizedPhone && (
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                      +{normalizedPhone}
                    </span>
                  )}
                </div>
                <Input
                  id="sched-recipient"
                  placeholder="08123456789"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sched-date" className="text-xs font-semibold text-stone-700">
                  Waktu Kirim (Tanggal & Jam)
                </Label>
                <Input
                  id="sched-date"
                  type="datetime-local"
                  value={sendAt}
                  onChange={(e) => setSendAt(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sched-text" className="text-xs font-semibold text-stone-700">
                Isi Pesan
              </Label>
              <Textarea
                id="sched-text"
                placeholder="Tuliskan pesan yang ingin dikirimkan sesuai jadwal..."
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="text-xs resize-y"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sched-media" className="text-xs font-semibold text-stone-700">
                URL Lampiran Media (Opsional)
              </Label>
              <Input
                id="sched-media"
                placeholder="https://... (URL gambar/PDF)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end pt-2 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan Jadwal...
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Jadwalkan Pesan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Scheduled Queue Table ── */}
      <Card className="border-stone-200 shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              Antrean Pesan Terjadwal ({scheduledList.length})
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Daftar pesan yang sedang menunggu waktu eksekusi pengiriman.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchScheduledMessages}
            disabled={isLoadingList}
            className="text-xs h-7 text-stone-600"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingList ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50">
                  <TableHead className="w-[140px] text-xs font-semibold">Tujuan</TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold">Jadwal Kirim</TableHead>
                  <TableHead className="text-xs font-semibold">Isi Pesan</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold">Status</TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-xs text-stone-400">
                      {isLoadingList ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                          <span>Memuat antrean terjadwal...</span>
                        </div>
                      ) : (
                        "Tidak ada pesan yang sedang dijadwalkan."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  scheduledList.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs font-semibold text-stone-800">
                        +{m.to}
                      </TableCell>
                      <TableCell className="text-xs text-stone-600">
                        {m.sendAt ? new Date(m.sendAt).toLocaleString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-stone-600 max-w-[280px] truncate" title={m.text}>
                        {m.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancellingId === m.id}
                          onClick={() => handleCancelMessage(m)}
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          {cancellingId === m.id ? "..." : "Batal"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
