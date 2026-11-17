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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  DownloadCloud,
  Filter,
  Inbox,
  Loader2,
  Save,
  ShieldAlert,
  Smartphone,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface WaSessionItem {
  id: string;
  name: string;
  status: string;
  phoneNumber?: string | null;
  me?: {
    id?: string;
    pushName?: string;
  } | null;
}

interface CrmSettingsData {
  id: string;
  leadReceiverSessionId?: string | null;
  leadReceiverPhone?: string | null;
  ignoreGroups: boolean;
  ignoreBroadcasts: boolean;
  defaultAssignMethod: "MANUAL" | "CLAIM" | "STICKY_CUSTOMER" | "ROUND_ROBIN";
  slaThresholdMinutes: number;
  blacklistedNumbers?: string | null;
}

export default function WhatsAppCrmSettingsPage() {
  const { fetchApi } = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [sessions, setSessions] = useState<WaSessionItem[]>([]);
  const [settings, setSettings] = useState<CrmSettingsData>({
    id: "default",
    leadReceiverSessionId: "",
    leadReceiverPhone: "",
    ignoreGroups: true,
    ignoreBroadcasts: true,
    defaultAssignMethod: "CLAIM",
    slaThresholdMinutes: 15,
    blacklistedNumbers: "",
  });

  // Load available sessions & existing settings
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch available sessions from WAHA / Catha proxy
      let fetchedSessions: WaSessionItem[] = [];
      try {
        const sessionRes = await fetch("/api/wa/sessions");
        if (sessionRes.ok) {
          const sessionJson = await sessionRes.json();
          fetchedSessions = Array.isArray(sessionJson)
            ? sessionJson
            : Array.isArray(sessionJson.data)
            ? sessionJson.data
            : [];
        }
      } catch {
        // Fallback to backend /crm/settings/sessions
        const backendSessionRes = await fetchApi("/crm/settings/sessions");
        if (backendSessionRes.ok) {
          const sJson = await backendSessionRes.json();
          fetchedSessions = Array.isArray(sJson.data) ? sJson.data : [];
        }
      }
      setSessions(fetchedSessions);

      // 2. Fetch current CRM settings
      const settingsRes = await fetchApi("/crm/settings");
      if (settingsRes.ok) {
        const sJson = await settingsRes.json();
        if (sJson.data) {
          setSettings({
            id: sJson.data.id || "default",
            leadReceiverSessionId: sJson.data.leadReceiverSessionId || "",
            leadReceiverPhone: sJson.data.leadReceiverPhone || "",
            ignoreGroups: sJson.data.ignoreGroups ?? true,
            ignoreBroadcasts: sJson.data.ignoreBroadcasts ?? true,
            defaultAssignMethod: sJson.data.defaultAssignMethod || "CLAIM",
            slaThresholdMinutes: sJson.data.slaThresholdMinutes || 15,
            blacklistedNumbers: sJson.data.blacklistedNumbers || "",
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // Cari nomor telepon sesi yang dipilih jika ada
      const selectedSession = sessions.find((s) => s.id === settings.leadReceiverSessionId);
      const phone = selectedSession?.phoneNumber || selectedSession?.me?.id || settings.leadReceiverPhone || null;

      const payload = {
        ...settings,
        leadReceiverPhone: phone,
      };

      const res = await fetchApi("/crm/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal menyimpan pengaturan");
      }

      toast.success("Pengaturan CRM berhasil disimpan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Manual Sync
  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);

      // Attempt 1: backend direct sync
      const res = await fetchApi("/crm/leads/sync-from-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: settings.leadReceiverSessionId }),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || "Sinkronisasi leads berhasil!");
        return;
      }

      // Attempt 2: client proxy fallback
      const chatsUrl = settings.leadReceiverSessionId
        ? `/api/wa/chats?sessionId=${encodeURIComponent(settings.leadReceiverSessionId)}&limit=100`
        : `/api/wa/chats?limit=100`;

      const chatsRes = await fetch(chatsUrl);
      if (!chatsRes.ok) {
        throw new Error("Gagal mengambil percakapan dari server WhatsApp");
      }
      const chatsJson = await chatsRes.json();
      const chats = Array.isArray(chatsJson) ? chatsJson : chatsJson.data || [];

      const batchRes = await fetchApi("/crm/leads/batch-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chats }),
      });

      if (batchRes.ok) {
        const batchJson = await batchRes.json();
        toast.success(batchJson.message || "Leads berhasil disinkronkan!");
      } else {
        throw new Error("Gagal menyimpan data leads ke database");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi data dari WhatsApp");
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedSessionObj = sessions.find((s) => s.id === settings.leadReceiverSessionId);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/whatsapp-crm">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-stone-500 hover:text-stone-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <Sliders className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Pengaturan WhatsApp CRM
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Konfigurasi Inti
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tentukan nomor WhatsApp penerima leads, filter percakapan masuk, dan aturan penugasan CS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/super-admin/whatsapp-crm">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-stone-500" />
              <span>Kembali ke Inbox</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs">Memuat data konfigurasi...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* ── Card 1: Akun WhatsApp Penerima Leads ── */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-stone-900">
                      Akun WhatsApp Penerima Leads
                    </CardTitle>
                    <CardDescription className="text-xs text-stone-500 mt-0.5">
                      Pilih sesi WhatsApp yang digunakan untuk menangkap prospek dan pesan pelanggan baru.
                    </CardDescription>
                  </div>
                </div>

                {selectedSessionObj && (
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-medium ${
                      selectedSessionObj.status === "WORKING"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    Status: {selectedSessionObj.status}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-700">
                  Sesi WhatsApp Aktif
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={settings.leadReceiverSessionId || "none"}
                      onValueChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          leadReceiverSessionId: val === "none" ? "" : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full text-xs bg-stone-50/50">
                        <SelectValue placeholder="Pilih sesi WhatsApp yang terhubung..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-stone-400">
                          -- Belum Dipilih (Tidak Menerima Leads) --
                        </SelectItem>
                        {sessions.map((sess) => (
                          <SelectItem key={sess.id} value={sess.id} className="text-xs">
                            {sess.name || sess.id} {sess.phoneNumber ? `(${sess.phoneNumber})` : ""}{" "}
                            [{sess.status}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={isSyncing || !settings.leadReceiverSessionId}
                    className="h-9 px-3 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
                    title="Tarik chat dan kontak sekarang dari sesi ini"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? "animate-bounce" : ""}`} />
                    <span>{isSyncing ? "Menyinkronkan..." : "Tarik Leads Sekarang"}</span>
                  </Button>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Semua pesan yang masuk ke nomor ini akan otomatis dinormalisasi, dicocokkan nama kontaknya (Combine Contact Name), dan ditampilkan di menu Inbox & Leads.
                </p>
              </div>

              {selectedSessionObj && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 text-xs text-stone-600 flex flex-wrap gap-4 items-center">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">ID Sesi:</span>
                    <span className="font-mono font-medium">{selectedSessionObj.id}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Nomor HP:</span>
                    <span className="font-mono font-medium">{selectedSessionObj.phoneNumber || "-"}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Nama Profil WA:</span>
                    <span className="font-medium">{selectedSessionObj.me?.pushName || selectedSessionObj.name || "-"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card 2: Filter & Aturan Ingestion ── */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">
                    Filter & Aturan Ingestion Pesan
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500 mt-0.5">
                    Saring pesan WhatsApp agar inbox CRM tetap bersih dan hanya berfokus pada prospek pelanggan asli.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Toggle Abaikan Grup */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50/50 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="ignoreGroups" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Abaikan Percakapan Grup WhatsApp
                  </Label>
                  <p className="text-[11px] text-stone-500">
                    Hanya proses chat pribadi (1-on-1). Obrolan dari grup WhatsApp (<code>@g.us</code>) tidak akan dimasukkan ke Inbox Leads.
                  </p>
                </div>
                <Switch
                  id="ignoreGroups"
                  checked={settings.ignoreGroups}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, ignoreGroups: checked }))
                  }
                />
              </div>

              {/* Toggle Abaikan Broadcast */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50/50 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="ignoreBroadcasts" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Abaikan Status & Broadcast WhatsApp
                  </Label>
                  <p className="text-[11px] text-stone-500">
                    Mencegah pembaruan status dan pesan broadcast luar agar tidak memicu pembuatan lead baru.
                  </p>
                </div>
                <Switch
                  id="ignoreBroadcasts"
                  checked={settings.ignoreBroadcasts}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, ignoreBroadcasts: checked }))
                  }
                />
              </div>

              {/* Blacklist Nomor */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="blacklist" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
                  <span>Daftar Nomor Blacklist / Internal Tim</span>
                </Label>
                <Textarea
                  id="blacklist"
                  rows={3}
                  value={settings.blacklistedNumbers || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, blacklistedNumbers: e.target.value }))
                  }
                  placeholder="Contoh: 628123456789, 628987654321 (pisahkan dengan koma atau baris baru)"
                  className="text-xs font-mono bg-stone-50/50"
                />
                <p className="text-[11px] text-stone-500">
                  Nomor internal karyawan atau vendor yang ada di daftar ini tidak akan pernah disimpan sebagai prospek/lead.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 3: Logika Penugasan & SLA ── */}
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">
                    Logika Penugasan Agen CS & SLA
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500 mt-0.5">
                    Aturan penanganan saat pesan masuk tidak membawa kode CS khusus.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode Penugasan */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-700">
                    Metode Penugasan Default
                  </Label>
                  <Select
                    value={settings.defaultAssignMethod}
                    onValueChange={(val: any) =>
                      setSettings((prev) => ({ ...prev, defaultAssignMethod: val }))
                    }
                  >
                    <SelectTrigger className="text-xs bg-stone-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLAIM" className="text-xs">
                        Manual Claim (Pool Belum Ditugaskan)
                      </SelectItem>
                      <SelectItem value="STICKY_CUSTOMER" className="text-xs">
                        Sticky Customer (Pelanggan Lama ke CS Sebelumnya)
                      </SelectItem>
                      <SelectItem value="ROUND_ROBIN" className="text-xs">
                        Round Robin (Dibagikan Adil Bergiliran)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-stone-500">
                    Jika pelanggan masuk melalui Click-to-Chat dengan Kode CS tertentu (contoh: <code>CS-ANDI</code>), lead akan langsung ditugaskan ke CS tersebut secara otomatis.
                  </p>
                </div>

                {/* Target SLA */}
                <div className="space-y-2">
                  <Label htmlFor="sla" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Target Respon CS (SLA Alert)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="sla"
                      type="number"
                      min={1}
                      max={1440}
                      value={settings.slaThresholdMinutes}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          slaThresholdMinutes: Number(e.target.value) || 15,
                        }))
                      }
                      className="text-xs bg-stone-50/50 w-28"
                    />
                    <span className="text-xs text-stone-500">menit</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Peringatan visual akan muncul di inbox jika pesan baru belum direspons setelah melebihi batas waktu ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Save Action Bar ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/super-admin/whatsapp-crm">
              <Button type="button" variant="outline" className="text-xs h-9 px-4">
                Batal
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
