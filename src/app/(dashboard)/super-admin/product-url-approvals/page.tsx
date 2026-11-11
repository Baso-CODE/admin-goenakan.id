"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = "ALL" | ApprovalStatus;

type ApprovalRequest = {
  id: string;
  productId: string;
  oldSlug: string;
  newSlug: string;
  reason: string | null;
  status: ApprovalStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  requestedBy: {
    id: string;
    name: string | null;
  };
  reviewedBy: {
    id: string;
    name: string | null;
  } | null;
};

type ApprovalResponse = ApprovalRequest[] | { data: ApprovalRequest[] };

const filters: StatusFilter[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const statusLabels: Record<ApprovalStatus, string> = {
  PENDING: "Menunggu Approval",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClass(status: ApprovalStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "REJECTED":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
}

export default function ProductUrlApprovalsPage() {
  const router = useRouter();
  const { fetchApi, status: apiStatus } = useApi();
  const { data: session, status: sessionStatus } = useSession();

  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const role = session?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  type ReviewAction = "approve" | "reject";

  type ReviewConfirmation = {
    request: ApprovalRequest;
    action: ReviewAction;
  };

  const [reviewConfirmation, setReviewConfirmation] =
    useState<ReviewConfirmation | null>(null);

  // Ambil ID notifikasi dari query string, jika ada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedId(params.get("requestId"));
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchApi("/product-url-approvals/requests", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil daftar approval");
      }

      const json = (await response.json()) as ApprovalResponse;

      const data = Array.isArray(json) ? json : json.data;

      if (!Array.isArray(data)) {
        throw new Error("Format respons approval tidak sesuai");
      }

      setRequests(data);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat approval",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    if (apiStatus !== "authenticated" || !isSuperAdmin) return;
    void loadRequests();
  }, [apiStatus, isSuperAdmin, loadRequests]);

  const visibleRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = filter === "ALL" || request.status === filter;

      const matchesSearch =
        !keyword ||
        [
          request.product?.name,
          request.oldSlug,
          request.newSlug,
          request.requestedBy?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, search]);

  const pendingCount = requests.filter(
    (item) => item.status === "PENDING",
  ).length;

  const openReviewConfirmation = (
    request: ApprovalRequest,
    action: "approve" | "reject",
  ) => {
    if (!isSuperAdmin || processingId) return;

    const reviewNote = reviewNotes[request.id]?.trim() ?? "";

    if (action === "reject" && !reviewNote) {
      toast.error("Isi alasan penolakan terlebih dahulu");
      return;
    }

    setReviewConfirmation({
      request,
      action,
    });
  };

  const handleReview = async () => {
    if (!reviewConfirmation || !isSuperAdmin || processingId) {
      return;
    }

    const { request, action } = reviewConfirmation;
    const reviewNote = reviewNotes[request.id]?.trim() ?? "";

    if (action === "reject" && !reviewNote) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setProcessingId(request.id);

    try {
      const response = await fetchApi(
        `/product-url-approvals/requests/${encodeURIComponent(request.id)}/${action}`,
        {
          method: "PATCH",
          body: JSON.stringify({ reviewNote }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(error.message || "Gagal memproses permintaan");
      }

      toast.success(
        action === "approve"
          ? "Perubahan URL berhasil disetujui"
          : "Permintaan perubahan URL berhasil ditolak",
      );

      setReviewConfirmation(null);

      await loadRequests();
    } catch (error) {
      console.error("Product URL approval error:", error);

      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setProcessingId(null);
    }
  };

  if (sessionStatus === "loading" || apiStatus === "loading") {
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
          Hanya Super Admin yang dapat mengelola approval URL produk.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full  space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Product URL Approval</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Tinjau permintaan perubahan URL produk sebelum diterapkan.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadRequests()}
          disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Request", value: requests.length },
          { label: "Pending", value: pendingCount },
          {
            label: "Approved",
            value: requests.filter((item) => item.status === "APPROVED").length,
          },
          {
            label: "Rejected",
            value: requests.filter((item) => item.status === "REJECTED").length,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* FILTER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}>
              {item === "ALL" ? "Semua" : statusLabels[item]}
            </Button>
          ))}
        </div>

        <Input
          className="w-full sm:max-w-64"
          placeholder="Cari produk atau slug..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* REQUESTS */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="font-medium">Tidak ada permintaan perubahan URL</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Permintaan yang sesuai filter akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((request) => (
            <div
              key={request.id}
              className={`rounded-xl border bg-card p-4 shadow-sm sm:p-6 ${
                selectedId === request.id ? "ring-2 ring-primary/60" : ""
              }`}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {request.product?.name ?? "Produk"}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Diajukan oleh {request.requestedBy?.name ?? "Admin"} •{" "}
                    {formatDate(request.createdAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(request.status)}`}>
                  {statusLabels[request.status]}
                </span>
              </div>

              {/* SLUG COMPARISON */}
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">URL Lama</p>
                  <p className="break-all text-sm font-medium">
                    /product/{request.oldSlug}
                  </p>
                </div>

                <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-muted-foreground md:rotate-0" />

                <div className="min-w-0 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">URL Baru</p>
                  <p className="break-all text-sm font-semibold">
                    /product/{request.newSlug}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mt-4">
                  <p className="text-xs font-semibold">Alasan Perubahan</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {request.reason}
                  </p>
                </div>
              )}

              {request.status === "PENDING" ? (
                <div className="mt-5 space-y-3 border-t pt-4">
                  <label
                    htmlFor={`review-${request.id}`}
                    className="text-sm font-medium">
                    Catatan Review
                  </label>

                  <textarea
                    id={`review-${request.id}`}
                    value={reviewNotes[request.id] ?? ""}
                    onChange={(event) =>
                      setReviewNotes((previous) => ({
                        ...previous,
                        [request.id]: event.target.value,
                      }))
                    }
                    maxLength={2000}
                    rows={2}
                    placeholder="Alasan persetujuan atau penolakan..."
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={processingId !== null}
                      onClick={() => openReviewConfirmation(request, "reject")}
                      className="border-destructive/40 text-destructive hover:text-destructive">
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>

                    <Button
                      disabled={processingId !== null}
                      onClick={() =>
                        openReviewConfirmation(request, "approve")
                      }>
                      {processingId === request.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Diproses oleh {request.reviewedBy?.name ?? "Super Admin"}
                    {request.reviewedAt &&
                      ` • ${formatDate(request.reviewedAt)}`}
                  </p>

                  {request.reviewNote && (
                    <p className="mt-2 text-sm">{request.reviewNote}</p>
                  )}

                  {request.status === "APPROVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        router.push("/super-admin/seo-redirect-tasks")
                      }>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      SEO Follow-up
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={reviewConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && !processingId) {
            setReviewConfirmation(null);
          }
        }}>
        <AlertDialogContent className="max-w-[440px] rounded-xl">
          <AlertDialogHeader>
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                reviewConfirmation?.action === "approve"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600"
              }`}>
              {reviewConfirmation?.action === "approve" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>

            <AlertDialogTitle className="text-xl">
              {reviewConfirmation?.action === "approve"
                ? "Setujui Perubahan URL?"
                : "Tolak Perubahan URL?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed">
              {reviewConfirmation?.action === "approve"
                ? "URL produk akan diperbarui setelah persetujuan. Sistem juga akan mencatat redirect dan membuat reminder pengecekan SEO."
                : "Permintaan perubahan URL akan ditolak. URL produk saat ini tidak akan berubah."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {reviewConfirmation && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Produk</p>

                <p className="mt-1 text-sm font-semibold">
                  {reviewConfirmation.request.product.name}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">URL Lama</p>

                <p className="break-all text-xs font-medium">
                  /product/{reviewConfirmation.request.oldSlug}
                </p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">URL Baru</p>

                <p className="break-all text-xs font-semibold text-primary">
                  /product/{reviewConfirmation.request.newSlug}
                </p>
              </div>

              {Boolean(reviewNotes[reviewConfirmation.request.id]?.trim()) && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Catatan Review
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {reviewNotes[reviewConfirmation.request.id]}
                  </p>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter className="mt-3 gap-2 sm:gap-0">
            <AlertDialogCancel disabled={processingId !== null}>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={processingId !== null}
              onClick={(event) => {
                // Cegah AlertDialog menutup sebelum API berhasil.
                event.preventDefault();
                void handleReview();
              }}
              className={
                reviewConfirmation?.action === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }>
              {processingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : reviewConfirmation?.action === "approve" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ya, Setujui
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Ya, Tolak
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
