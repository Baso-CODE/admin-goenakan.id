"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WaMessage, WaTrial } from "@/types/waPortal.type";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  History,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WaAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
}

export function WaAuditDrawer({ isOpen, onClose, messageId }: WaAuditDrawerProps) {
  const [message, setMessage] = useState<WaMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !messageId) {
      setMessage(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/wa/messages/${messageId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Gagal memuat detail audit pesan");
        }
        const data = await res.json();
        setMessage(data?.data || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, messageId]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-white p-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <SheetTitle className="text-base font-bold text-stone-900">
              Audit Trail & Trial Logs
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-stone-500">
            Riwayat lengkap proses pengiriman pesan, percobaan ulang (retry), durasi, dan respons server.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Mengambil detail audit trail...</span>
          </div>
        ) : error ? (
          <div className="my-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4" /> Gagal memuat audit
            </div>
            <p>{error}</p>
          </div>
        ) : message ? (
          <div className="py-5 space-y-6">
            {/* ── Message Overview Card ── */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-900">
                  +{message.to}
                </span>
                <Badge
                  variant={message.status === "SENT" ? "default" : "secondary"}
                  className={`text-[10px] uppercase font-bold ${
                    message.status === "SENT"
                      ? "bg-emerald-600"
                      : message.status === "FAILED"
                      ? "bg-rose-600 text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {message.status}
                </Badge>
              </div>

              <div className="text-xs text-stone-700 bg-white p-3 rounded-lg border leading-relaxed">
                {message.text}
              </div>

              {message.mediaUrl && (
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-mono">{message.mediaUrl}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px] text-stone-500 font-mono">
                <div>
                  <span className="text-stone-400 block text-[10px]">Message ID:</span>
                  <span className="truncate block" title={message.id}>
                    {message.id}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Waktu Dibuat:</span>
                  <span>{new Date(message.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* ── Trials History Timeline ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                Percobaan Pengiriman (Trial Attempts)
              </h4>

              {(!message.trials || message.trials.length === 0) ? (
                <div className="p-4 text-center text-xs text-stone-400 border border-dashed rounded-lg">
                  Belum ada catatan percobaan atau pesan sedang dalam antrean.
                </div>
              ) : (
                <div className="space-y-3">
                  {message.trials.map((trial, index) => {
                    const isSuccess = trial.status === "SUCCESS" || (trial.httpStatus && trial.httpStatus < 300);

                    return (
                      <div
                        key={trial.id || index}
                        className="p-3.5 rounded-lg border bg-white shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSuccess ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span className="font-bold text-stone-800">
                              Attempt #{trial.attempt || index + 1}
                            </span>
                            <span className="text-stone-400 text-[10px]">
                              ({trial.status})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {trial.durationMs && (
                              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                {trial.durationMs}ms
                              </span>
                            )}
                            {trial.httpStatus && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  trial.httpStatus < 300
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                HTTP {trial.httpStatus}
                              </span>
                            )}
                          </div>
                        </div>

                        {trial.errorTrace && (
                          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono break-all leading-normal">
                            <strong>Error Trace:</strong> {trial.errorTrace}
                          </div>
                        )}

                        {/* Raw Payloads */}
                        {trial.responsePayload && (
                          <details className="text-[10px] font-mono text-stone-600 group">
                            <summary className="cursor-pointer text-indigo-600 font-semibold hover:underline">
                              Lihat Raw Response JSON
                            </summary>
                            <pre className="mt-1.5 p-2 bg-stone-900 text-emerald-400 rounded overflow-x-auto max-h-40 leading-tight">
                              {JSON.stringify(trial.responsePayload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
