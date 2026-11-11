"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApi } from "@/hooks/useApi";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ApprovalRequest = {
  id: string;
  productId: string;
  oldSlug: string;
  newSlug: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  reviewedBy: {
    id: string;
    name: string | null;
  } | null;
};

const SEO_CHECKLIST = [
  {
    id: "redirect",
    title: "HTTP 301/308 Redirect",
    description: "Pastikan URL lama diarahkan secara permanen ke URL baru.",
  },
  {
    id: "canonical",
    title: "Canonical URL",
    description: "Pastikan canonical halaman produk menunjuk ke URL baru.",
  },
  {
    id: "sitemap",
    title: "Sitemap & Internal Link",
    description: "Pastikan sitemap dan tautan internal menggunakan URL baru.",
  },
  {
    id: "gsc",
    title: "Google Search Console",
    description: "Inspeksi URL baru dan pantau indexing serta URL lama.",
  },
  {
    id: "ga4",
    title: "Google Analytics 4",
    description:
      "Periksa page_location, event, dan laporan yang memfilter URL produk.",
  },
  {
    id: "ads",
    title: "Google Ads",
    description: "Periksa URL tujuan iklan jika menggunakan link produk lama.",
  },
] as const;

type ChecklistId = (typeof SEO_CHECKLIST)[number]["id"];

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SeoRedirectTasksPage() {
  const { fetchApi, status: apiStatus } = useApi();
  const { data: session, status: sessionStatus } = useSession();

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Checklist ini hanya state sementara.
  // Belum tersimpan ke database.
  const [checked, setChecked] = useState<Record<string, ChecklistId[]>>({});

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchApi(
        "/product-url-approvals/requests?status=APPROVED",
        { cache: "no-store" },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Gagal mengambil daftar redirect");
      }

      const json = await response.json();

      const data: ApprovalRequest[] = Array.isArray(json) ? json : json.data;

      if (!Array.isArray(data)) {
        throw new Error("Format respons API tidak sesuai");
      }

      setRequests(data.filter((item) => item.status === "APPROVED"));
    } catch (error) {
      console.error("SEO Redirect Tasks:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengambil data SEO",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    if (apiStatus !== "authenticated" || !isSuperAdmin) {
      return;
    }

    void loadTasks();
  }, [apiStatus, isSuperAdmin, loadTasks]);

  const toggleChecklist = (
    requestId: string,
    itemId: ChecklistId,
    enabled: boolean,
  ) => {
    setChecked((previous) => {
      const current = previous[requestId] ?? [];

      return {
        ...previous,
        [requestId]: enabled
          ? [...new Set([...current, itemId])]
          : current.filter((id) => id !== itemId),
      };
    });
  };

  const completedCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          (checked[request.id]?.length ?? 0) === SEO_CHECKLIST.length,
      ).length,
    [requests, checked],
  );

  if (apiStatus === "loading" || sessionStatus === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="font-semibold">Akses Ditolak</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya tersedia untuk Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <SearchCheck className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">SEO Redirect Tasks</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Tindak lanjut SEO setelah perubahan URL produk disetujui.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void loadTasks()}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Approved URL Changes</p>
          <p className="mt-2 text-3xl font-bold">{requests.length}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Checklist Selesai (Sesi Ini)
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {completedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Checklist Belum Selesai (Sesi Ini)
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {requests.length - completedCount}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Checklist di halaman ini bersifat sementara dan akan ter-reset saat
        halaman dimuat ulang. Centang tidak mengubah status verifikasi redirect
        di database.
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <h2 className="font-semibold">
            Belum ada perubahan URL yang disetujui
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Setelah Super Admin menyetujui perubahan URL, pekerjaan SEO akan
            ditampilkan di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const selected = checked[request.id] ?? [];
            const total = SEO_CHECKLIST.length;
            const finished = selected.length;
            const complete = finished === total;

            return (
              <section
                key={request.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm">
                {/* PRODUCT HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {request.product?.name ?? "Produk"}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Approved: {formatDate(request.reviewedAt)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Oleh: {request.reviewedBy?.name ?? "Super Admin"}
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Approved
                  </span>
                </div>

                {/* URL COMPARISON */}
                <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      URL Lama
                    </p>
                    <p className="break-all text-sm font-medium">
                      {request.oldSlug}
                    </p>
                  </div>

                  <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-muted-foreground md:rotate-0" />

                  <div className="min-w-0 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      URL Baru
                    </p>
                    <p className="break-all text-sm font-semibold">
                      {request.newSlug}
                    </p>
                  </div>
                </div>

                {/* CHECKLIST */}
                <div className="border-t p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        SEO Verification Checklist
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        Periksa setiap langkah secara manual.
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        complete
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                      {finished}/{total} Checked
                    </span>
                  </div>

                  <div className="space-y-3">
                    {SEO_CHECKLIST.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={(value) =>
                            toggleChecklist(request.id, item.id, value === true)
                          }
                          className="mt-0.5"
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>

                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {complete && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      Checklist sesi ini selesai. Status verifikasi database
                      belum diperbarui.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
