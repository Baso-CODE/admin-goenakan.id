"use client";

import { CheckCircle2, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";

type MatchTarget =
  | {
      targetType: "lead";
      targetId: number;
    }
  | {
      targetType: "quotation";
      targetId: string;
    }
  | {
      targetType: "order";
      targetId: string;
    };

type WhatsappCodeMatcherProps = MatchTarget & {
  initialCode?: string | null;
  onSuccess?: () => void;
};

type MatchResult = {
  code: string;
  leadId: number | null;
  quotationId: string | null;
  orderId: string | null;
  matchedAt: string | null;
  matchedById: string | null;
};

const CODE_PATTERN = /^GK-[A-HJ-KM-NP-Z2-9]{5}$/;

export function WhatsappCodeMatcher({
  targetType,
  targetId,
  initialCode,
  onSuccess,
}: WhatsappCodeMatcherProps) {
  const { fetchApi, status } = useApi();

  const [code, setCode] = useState(initialCode ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [matchedResult, setMatchedResult] = useState<MatchResult | null>(null);

  const normalizedCode = code.trim().toUpperCase();

  const isValidCode = CODE_PATTERN.test(normalizedCode);

  const handleMatch = async () => {
    if (status !== "authenticated") {
      toast.error("Silakan login terlebih dahulu.");
      return;
    }

    if (!isValidCode) {
      toast.error("Format kode WA tidak valid. Contoh: GK-7F3K2");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const body =
        targetType === "lead"
          ? {
              code: normalizedCode,
              leadId: targetId,
            }
          : targetType === "quotation"
            ? {
                code: normalizedCode,
                quotationId: targetId,
              }
            : {
                code: normalizedCode,
                orderId: targetId,
              };

      const response = await fetchApi(
        `/tracking/whatsapp-click/match/${targetType}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ??
            `Gagal mencocokkan kode WA (HTTP ${response.status})`,
        );
      }

      const matched = result?.data as MatchResult | undefined;

      if (!matched) {
        throw new Error("Respons pencocokan tidak valid.");
      }

      setMatchedResult(matched);

      toast.success("Kode WhatsApp berhasil dicocokkan.");

      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mencocokkan kode.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-slate-600" />

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            WhatsApp Attribution
          </h3>

          <p className="text-xs text-slate-500">
            Cocokkan kode WhatsApp dengan data ini.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`wa-code-${targetType}-${targetId}`}
          className="text-xs font-medium text-slate-600">
          Kode WhatsApp
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`wa-code-${targetType}-${targetId}`}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="GK-7F3K2"
            maxLength={8}
            disabled={isSubmitting || Boolean(matchedResult)}
            className="font-mono uppercase"
          />

          <Button
            type="button"
            onClick={handleMatch}
            disabled={
              !isValidCode ||
              isSubmitting ||
              Boolean(matchedResult) ||
              status !== "authenticated"
            }
            className="shrink-0">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : matchedResult ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Dicocokkan
              </>
            ) : (
              "Cocokkan Kode"
            )}
          </Button>
        </div>

        {code.trim().length > 0 && !isValidCode && (
          <p className="text-xs text-red-600">
            Gunakan format GK-XXXXX, misalnya GK-7F3K2.
          </p>
        )}
      </div>

      {matchedResult && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />

            <p className="text-sm font-semibold">Kode berhasil dicocokkan</p>
          </div>

          <div className="mt-2 space-y-1 text-xs text-green-800">
            <p>
              Kode:{" "}
              <span className="font-mono font-semibold">
                {matchedResult.code}
              </span>
            </p>

            {matchedResult.matchedAt && (
              <p>
                Dicocokkan:{" "}
                {new Date(matchedResult.matchedAt).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Kode GK-XXXXX diperoleh dari pesan WhatsApp customer. Untuk kode
        GK-L&lt;ID&gt;, gunakan ID Contact Message yang tertera pada referensi
        tersebut.
      </p>
    </div>
  );
}
