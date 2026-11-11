"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import {
  ArrowRight,
  CheckCircle2,
  Link2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductUrlChangeFormProps {
  productId: string;
  currentSlug: string;
  productName?: string;
}

interface RequestError {
  message?: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function ProductUrlChangeForm({
  productId,
  currentSlug,
  productName,
}: ProductUrlChangeFormProps) {
  const { fetchApi } = useApi();

  const [newSlug, setNewSlug] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const normalizedNewSlug = normalizeSlug(newSlug);

  const canSubmit =
    Boolean(productId) &&
    Boolean(normalizedNewSlug) &&
    normalizedNewSlug.length <= 191 &&
    SLUG_PATTERN.test(normalizedNewSlug) &&
    normalizedNewSlug !== currentSlug &&
    reason.trim().length > 0 &&
    reason.trim().length <= 2000 &&
    !submitting &&
    !requested;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const response = await fetchApi(
        `/product-url-approvals/products/${encodeURIComponent(productId)}/requests`,
        {
          method: "POST",
          body: JSON.stringify({
            newSlug: normalizedNewSlug,
            reason: reason.trim(),
          }),
        },
      );

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as RequestError;

        throw new Error(
          error.message || "Gagal mengajukan perubahan URL produk",
        );
      }

      setRequested(true);

      toast.success("Permintaan perubahan URL berhasil dikirim ke Super Admin");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengajukan URL",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-foreground">
            Product URL Management
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Perubahan URL produk memerlukan persetujuan Super Admin untuk
            menjaga SEO.
          </p>
        </div>
      </div>

      {requested ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div>
              <p className="font-semibold">Permintaan berhasil dikirim</p>
              <p className="mt-1 text-sm text-muted-foreground">
                URL produk belum berubah. Permintaan sedang menunggu approval
                Super Admin.
              </p>
              <p className="mt-2 break-all text-xs font-medium">
                Slug diajukan: {normalizedNewSlug}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {productName && (
            <p className="text-sm font-medium text-foreground">
              Produk: {productName}
            </p>
          )}

          <div className="space-y-2">
            <Label>Slug Produk Saat Ini</Label>
            <Input value={currentSlug} readOnly className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">
              URL aktif tidak akan berubah sebelum permintaan disetujui.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-new-slug">Slug Baru</Label>

            <Input
              id="product-new-slug"
              value={newSlug}
              onChange={(e) => {
                setNewSlug(e.target.value);
              }}
              placeholder="contoh: tumbler-custom-premium"
              maxLength={191}
              required
            />

            {normalizedNewSlug && (
              <p className="break-all text-xs text-muted-foreground">
                Preview: /product/{normalizedNewSlug}
              </p>
            )}

            {normalizedNewSlug === currentSlug &&
              normalizedNewSlug.length > 0 && (
                <p className="text-xs text-destructive">
                  Slug baru harus berbeda dari slug saat ini.
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-url-reason">Alasan Perubahan</Label>

            <textarea
              id="product-url-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={2000}
              required
              placeholder="Jelaskan alasan perubahan URL produk..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Super Admin akan menerima notifikasi. Setelah disetujui, sistem
              mencatat redirect URL dan reminder pengecekan GA4/GSC.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                Ajukan Perubahan URL
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </section>
  );
}
