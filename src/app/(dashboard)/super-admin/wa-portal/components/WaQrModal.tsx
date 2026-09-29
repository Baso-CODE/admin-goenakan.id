"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WaSession } from "@/types/waPortal.type";
import { CheckCircle2, Loader2, QrCode, RefreshCw, Smartphone, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface WaQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WaSession | null;
  onPairedSuccess: () => void;
}

export function WaQrModal({
  isOpen,
  onClose,
  session,
  onPairedSuccess,
}: WaQrModalProps) {
  const [qrKey, setQrKey] = useState(Date.now());
  const [status, setStatus] = useState<string>(session?.status || "SCAN_QR_CODE");
  const [isChecking, setIsChecking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger manual refresh QR code
  const handleRefreshQr = () => {
    setIsImageLoading(true);
    setHasError(false);
    setQrKey(Date.now());
  };

  // Restart session to recover from FAILED state
  const handleRestart = async () => {
    if (!session?.id) return;
    try {
      setIsRestarting(true);
      setHasError(false);
      setIsImageLoading(true);
      const res = await fetch(`/api/wa/sessions/${session.id}/restart`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal me-restart session");
      toast.info("Session sedang dimulai ulang oleh server. Menyiapkan engine browser...");
      setStatus("STARTING");
    } catch (err: any) {
      toast.error("Gagal me-restart session: " + err.message);
      setIsImageLoading(false);
    } finally {
      setIsRestarting(false);
    }
  };

  // Clean recreate session (wipe corrupt lockfiles)
  const handleRecreate = async () => {
    if (!session?.id) return;
    try {
      setIsRestarting(true);
      setHasError(false);
      setIsImageLoading(true);
      await fetch(`/api/wa/sessions/${session.id}`, { method: "DELETE" });
      const res = await fetch("/api/wa/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal membuat ulang session");
      toast.info("Session dibersihkan & dibuat ulang secara fresh. Menunggu engine browser...");
      setStatus("STARTING");
      onPairedSuccess();
    } catch (err: any) {
      toast.error("Gagal membuat ulang session: " + err.message);
      setIsImageLoading(false);
    } finally {
      setIsRestarting(false);
    }
  };

  // Auto refresh QR image every 15s so the token never expires while scanning
  useEffect(() => {
    if (!isOpen || status !== "SCAN_QR_CODE") return;
    const qrTimer = setInterval(() => {
      setQrKey(Date.now());
    }, 15000);
    return () => clearInterval(qrTimer);
  }, [isOpen, status]);

  useEffect(() => {
    if (!isOpen || !session?.id) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    setIsImageLoading(true);
    setHasError(false);
    setStatus(session?.status || "SCAN_QR_CODE");
    setQrKey(Date.now());

    // Polling function
    const checkStatus = async () => {
      try {
        setIsChecking(true);
        const res = await fetch(`/api/wa/sessions/${session.id}/status`);
        if (!res.ok) return;

        const data = await res.json();
        const currentStatus = data?.status || data?.data?.status;
        if (currentStatus) {
          setStatus(currentStatus);

          if (currentStatus === "WORKING") {
            toast.success(`WhatsApp session "${session.name}" berhasil terhubung! 🎉`);
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            onPairedSuccess();
            onClose();
          } else if (currentStatus === "SCAN_QR_CODE") {
            setHasError(false);
          }
        }
      } catch (err) {
        // Silent fail on transient poll errors
      } finally {
        setIsChecking(false);
      }
    };

    // Immediate check
    checkStatus();

    // 3-second polling interval
    pollTimerRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, session?.id, session?.name, session?.status, onClose, onPairedSuccess]);

  if (!session) return null;

  const qrImageUrl = `/api/wa/sessions/${session.id}/qr?t=${qrKey}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white p-6">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-stone-900">
            Hubungkan WhatsApp ({session.name})
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 max-w-sm mx-auto">
            Buka aplikasi WhatsApp di ponsel Anda &gt; <strong>Perangkat Tertaut (Linked Devices)</strong> &gt; scan kode QR di bawah.
          </DialogDescription>
        </DialogHeader>

        {/* ── QR Code Frame ── */}
        <div className="flex flex-col items-center justify-center my-4 p-4 border rounded-xl bg-stone-50/70 relative">
          <div className="relative w-64 h-64 bg-white rounded-lg shadow-sm border p-3 flex items-center justify-center overflow-hidden">
            {status === "STARTING" ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-stone-800">Menyiapkan Engine WhatsApp Web...</p>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-[210px] leading-relaxed">
                    Browser headless sedang booting di server. Kode QR akan otomatis tampil begitu browser siap.
                  </p>
                </div>
              </div>
            ) : status === "FAILED" ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                <XCircle className="w-10 h-10 text-rose-500" />
                <p className="text-xs font-bold text-rose-700">Koneksi Engine Gagal (FAILED)</p>
                <p className="text-[11px] text-stone-500 max-w-[210px] leading-relaxed">
                  Browser kehabisan memori atau koneksi terputus. Klik "Mulai Ulang" di bawah.
                </p>
              </div>
            ) : hasError ? (
              <div className="text-center p-4">
                <p className="text-xs text-rose-500 font-semibold mb-2">
                  Gagal memuat QR Code. Pastikan session telah dimulai.
                </p>
                <Button size="sm" variant="outline" onClick={handleRefreshQr} className="text-xs h-8">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Coba Lagi
                </Button>
              </div>
            ) : (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="text-xs text-stone-500 font-medium">Menyiapkan kode QR...</span>
                  </div>
                )}
                <img
                  src={qrImageUrl}
                  alt={`Scan QR WhatsApp - ${session.name}`}
                  className={`w-full h-full object-contain select-none transition-opacity duration-200 ${
                    isImageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false);
                    setHasError(true);
                  }}
                />
              </>
            )}
          </div>

          {/* Failed Alert Banner */}
          {status === "FAILED" && (
            <div className="w-full bg-rose-50 border border-rose-200 rounded-lg p-3 text-center my-3 space-y-2">
              <p className="text-xs text-rose-700 font-medium">
                Sesi WhatsApp mengalami kegagalan engine. Anda dapat memulai ulang atau membuat sesi baru secara bersih.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={handleRestart}
                  disabled={isRestarting}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRestarting ? "animate-spin" : ""}`} />
                  {isRestarting ? "Memulai..." : "Mulai Ulang Sesi"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRecreate}
                  disabled={isRestarting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 shadow-xs"
                >
                  Buat Ulang Bersih
                </Button>
              </div>
            </div>
          )}

          {/* Connection Live Indicator */}
          <div className="flex items-center gap-2 mt-3 text-xs">
            {status === "WORKING" ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Terhubung!
              </span>
            ) : status === "FAILED" ? (
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                <XCircle className="w-4 h-4 text-rose-500" /> Sesi Gagal (FAILED)
              </span>
            ) : status === "STARTING" ? (
              <span className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Memulai engine browser di server...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-stone-600 bg-white px-3 py-1 rounded-full border shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Menunggu scan QR (diperbarui otomatis)...</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Instructions Footer ── */}
        <div className="space-y-2 border-t pt-3 text-[11px] text-stone-500">
          <div className="flex items-center justify-between">
            <span>Kode QR tidak merespons?</span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                disabled={isRestarting}
                className="text-xs text-rose-600 h-7 px-2 hover:bg-rose-50"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRestarting ? "animate-spin" : ""}`} /> Restart
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefreshQr}
                className="text-xs text-indigo-600 h-7 px-2 hover:bg-indigo-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh QR
              </Button>
            </div>
          </div>
          <p className="text-stone-400">
            *Pastikan ponsel dan server memiliki koneksi internet stabil saat melakukan scanning.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
