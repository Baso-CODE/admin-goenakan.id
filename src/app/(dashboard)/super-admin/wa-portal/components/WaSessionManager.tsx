"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { WaSession } from "@/types/waPortal.type";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Square,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WaQrModal } from "./WaQrModal";

interface WaSessionManagerProps {
  sessions: WaSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function WaSessionManager({
  sessions,
  activeSessionId,
  onSelectSession,
  onRefresh,
  isLoading = false,
}: WaSessionManagerProps) {
  const [qrModalSession, setQrModalSession] = useState<WaSession | null>(null);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({}); // { sessionId: actionType }

  const handleStartSession = async (session: WaSession) => {
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "start" }));
      const res = await fetch(`/api/wa/sessions/${session.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal memulai session");
      toast.success(`Session "${session.name}" berhasil dimulai.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleStopSession = async (session: WaSession) => {
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "stop" }));
      const res = await fetch(`/api/wa/sessions/${session.id}/stop`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menghentikan session");
      toast.info(`Session "${session.name}" dihentikan.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleRestartSession = async (session: WaSession) => {
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "restart" }));
      const res = await fetch(`/api/wa/sessions/${session.id}/restart`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal memulai ulang session");
      toast.success(`Session "${session.name}" sedang dimulai ulang. Menyiapkan engine browser...`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleRecreateSession = async (session: WaSession) => {
    if (!confirm(`Sesi "${session.name}" akan dibersihkan dari server dan dibuat ulang untuk memperbaiki error koneksi. Lanjutkan?`)) return;
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "recreate" }));
      await fetch(`/api/wa/sessions/${session.id}`, { method: "DELETE" });
      const res = await fetch("/api/wa/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal membuat ulang session");
      toast.success(`Session "${session.name}" berhasil dibersihkan dan dibuat ulang!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleLogoutSession = async (session: WaSession) => {
    if (!confirm(`Apakah Anda yakin ingin logout perangkat dari session "${session.name}"?`)) return;
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "logout" }));
      const res = await fetch(`/api/wa/sessions/${session.id}/logout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal logout session");
      toast.success(`Session "${session.name}" berhasil logout.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleDeleteSession = async (session: WaSession) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus session "${session.name}" secara permanen?`)) return;
    try {
      setActionLoading((prev) => ({ ...prev, [session.id]: "delete" }));
      const res = await fetch(`/api/wa/sessions/${session.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menghapus session");
      toast.success(`Session "${session.name}" berhasil dihapus.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[session.id];
        return copy;
      });
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      toast.error("Nama session tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch("/api/wa/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSessionName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal membuat session baru");

      toast.success(`Session "${newSessionName}" berhasil dibuat!`);
      setNewSessionName("");
      setIsNewSessionOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "WORKING":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
          </Badge>
        );
      case "SCAN_QR_CODE":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-200 gap-1 text-[11px] animate-pulse">
            <QrCode className="w-3 h-3 text-amber-600" /> Need QR Scan
          </Badge>
        );
      case "STARTING":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20 border-blue-200 gap-1 text-[11px]">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Starting...
          </Badge>
        );
      case "STOPPED":
        return (
          <Badge variant="outline" className="text-stone-500 gap-1 text-[11px]">
            <Square className="w-3 h-3" /> Stopped
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px]">
            <XCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Sessions Management Card ── */}
      <Card className="border-stone-200 shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b">
          <div>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              WhatsApp Sessions & Device Pairing
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-0.5">
              Kelola nomor WhatsApp yang aktif digunakan untuk mengirimkan pesan otomatis atau manual.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs h-8 text-stone-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewSessionOpen(true)}
              className="text-xs h-8 bg-stone-900 hover:bg-stone-800 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Buat Session Baru
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50">
                  <TableHead className="w-[200px] text-xs font-semibold">Nama Session</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Perangkat / Nomor WA</TableHead>
                  <TableHead className="w-[280px] text-right text-xs font-semibold">Aksi Kontrol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-xs text-stone-400">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                          <span>Memuat daftar session...</span>
                        </div>
                      ) : (
                        "Belum ada session WhatsApp terdaftar. Klik 'Buat Session Baru' untuk memulai."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => {
                    const isSessionActive = s.id === activeSessionId;
                    const isBusy = !!actionLoading[s.id];

                    return (
                      <TableRow
                        key={s.id}
                        className={isSessionActive ? "bg-emerald-50/20" : undefined}
                      >
                        <TableCell className="font-semibold text-xs text-stone-900">
                          <div className="flex items-center gap-2">
                            <span>{s.name}</span>
                            {isSessionActive && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{renderStatusBadge(s.status)}</TableCell>

                        <TableCell className="text-xs text-stone-600">
                          {s.me?.id ? (
                            <div className="font-mono text-xs">
                              {s.me.id.split("@")[0]}
                              {s.me.pushName && (
                                <span className="text-stone-400 ml-1">({s.me.pushName})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Belum tertaut</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Scan QR */}
                            {s.status !== "WORKING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQrModalSession(s)}
                                className={`h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold ${
                                  s.status === "STARTING" ? "border-blue-300 text-blue-700 hover:bg-blue-50" : ""
                                }`}
                              >
                                {s.status === "STARTING" ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-blue-600" /> Buka QR...
                                  </>
                                ) : (
                                  <>
                                    <QrCode className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Scan QR
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Tombol Start */}
                            {s.status === "STOPPED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartSession(s)}
                                disabled={isBusy}
                                className="h-7 text-xs"
                              >
                                <Play className="w-3 h-3 mr-1 text-emerald-600" /> Start
                              </Button>
                            )}

                            {/* Tombol Restart & Buat Ulang jika FAILED */}
                            {s.status === "FAILED" && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRestartSession(s)}
                                  disabled={isBusy}
                                  className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                                  title="Mulai ulang sesi WhatsApp"
                                >
                                  <RefreshCw className={`w-3 h-3 mr-1 ${isBusy ? "animate-spin" : ""}`} /> Restart
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRecreateSession(s)}
                                  disabled={isBusy}
                                  className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 font-medium"
                                  title="Bersihkan lock file dan buat ulang sesi secara fresh"
                                >
                                  Buat Ulang
                                </Button>
                              </div>
                            )}

                            {/* Tombol Stop */}
                            {(s.status === "WORKING" || s.status === "SCAN_QR_CODE") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStopSession(s)}
                                disabled={isBusy}
                                className="h-7 text-xs text-stone-600"
                              >
                                <Square className="w-3 h-3 mr-1 text-amber-600" /> Stop
                              </Button>
                            )}

                            {/* Tombol Logout */}
                            {s.status === "WORKING" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleLogoutSession(s)}
                                disabled={isBusy}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Putuskan koneksi perangkat"
                              >
                                <LogOut className="w-3 h-3 mr-1" /> Logout
                              </Button>
                            )}

                            {/* Tombol Set Active */}
                            {!isSessionActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSelectSession(s.id)}
                                className="h-7 text-xs text-stone-500 hover:text-stone-900"
                              >
                                Pilih
                              </Button>
                            )}

                            {/* Tombol Hapus Session */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSession(s)}
                              disabled={isBusy}
                              className="h-7 text-xs text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Hapus session secara permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog Buat Session Baru ── */}
      <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
        <DialogContent className="max-w-sm bg-white p-5">
          <form onSubmit={handleCreateSession}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-stone-900">
                Buat WhatsApp Session Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Masukkan nama pengenal untuk sesi baru (misal: "cs-utama", "sales-2").
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <Label htmlFor="session-name" className="text-xs font-semibold">
                Nama Session
              </Label>
              <Input
                id="session-name"
                placeholder="default / sales-team"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewSessionOpen(false)}
                className="text-xs h-8"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8 bg-stone-900 text-white hover:bg-stone-800"
              >
                Buat Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Live QR Scanner Modal ── */}
      <WaQrModal
        isOpen={!!qrModalSession}
        onClose={() => setQrModalSession(null)}
        session={qrModalSession}
        onPairedSuccess={onRefresh}
      />
    </div>
  );
}
