"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WaWebhookSubscription } from "@/types/waPortal.type";
import { Globe, Loader2, Plus, RefreshCw, Rss } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  { id: "message.incoming", label: "Pesan Masuk (Incoming Customer Messages)" },
  { id: "message.ack", label: "Delivery Receipts (Centang 1, Centang 2, Read)" },
  { id: "session.status", label: "Perubahan Status Koneksi Session WhatsApp" },
];

export function WaWebhookManager() {
  const [subscriptions, setSubscriptions] = useState<WaWebhookSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "message.incoming",
    "message.ack",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wa/webhooks/subscriptions");
      if (!res.ok) return;
      const data = await res.json();
      const items: WaWebhookSubscription[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setSubscriptions(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newUrl.startsWith("http")) {
      toast.error("URL webhook harus valid (diawali http:// atau https://)");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Pilih minimal 1 event untuk disubscribe");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/wa/webhooks/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          events: selectedEvents,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal mendaftarkan webhook subscription");

      toast.success("Webhook subscription berhasil didaftarkan!");
      setNewUrl("");
      setIsOpenDialog(false);
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-stone-200 shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b">
          <div>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Rss className="w-4 h-4 text-indigo-600" />
              Webhook Subscriptions (Inbound & Events)
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Relay otomatis untuk meneruskan pesan masuk dari pelanggan ke AI Chatbot Agent, CRM, atau sistem eksternal.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscriptions}
              disabled={isLoading}
              className="h-8 text-xs text-stone-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpenDialog(true)}
              className="h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Daftarkan Webhook Baru
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50">
                  <TableHead className="text-xs font-semibold">Callback URL</TableHead>
                  <TableHead className="text-xs font-semibold">Subscribed Events</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-xs text-stone-400">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                          <span>Memuat daftar webhook...</span>
                        </div>
                      ) : (
                        "Belum ada webhook subscription yang terdaftar."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs font-semibold text-stone-800">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-stone-400" />
                          <span>{sub.url}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sub.events?.map((ev) => (
                            <Badge
                              key={ev}
                              variant="outline"
                              className="text-[10px] bg-stone-50 text-stone-600 font-mono"
                            >
                              {ev}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          ACTIVE
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog Tambah Webhook ── */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="max-w-md bg-white p-5">
          <form onSubmit={handleCreateWebhook}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-stone-900">
                Daftarkan Webhook Subscription
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Catha WA API akan melakukan POST request ke URL tujuan setiap kali event terpilih terjadi.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url" className="text-xs font-semibold text-stone-700">
                  Target Endpoint URL
                </Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.my-crm.com/webhooks/whatsapp"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-700 block">
                  Pilih Events yang Di-subscribe
                </Label>
                <div className="space-y-2 border rounded-lg p-3 bg-stone-50/50">
                  {AVAILABLE_EVENTS.map((ev) => {
                    const isChecked = selectedEvents.includes(ev.id);
                    return (
                      <div key={ev.id} className="flex items-start gap-2 text-xs">
                        <Checkbox
                          id={ev.id}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleEvent(ev.id)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={ev.id}
                          className="text-[11px] leading-tight text-stone-700 cursor-pointer select-none"
                        >
                          <strong className="font-mono block text-stone-900">{ev.id}</strong>
                          <span className="text-stone-500">{ev.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpenDialog(false)}
                className="text-xs h-8"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs h-8 bg-stone-900 text-white hover:bg-stone-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Webhook"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
