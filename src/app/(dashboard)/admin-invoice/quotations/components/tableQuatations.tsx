"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; // 🔥 IMPORT PROGRESS SHADCN
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Eye, FileText, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// === TYPES ===
type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string | null;
  status: string;
  totalAmount: string | number;
  client?: any;
  manualClientName?: string | null;
  manualClientCompany?: string | null;
  followUps: { name: string; date: string }[];
  _count: { followUps: number };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  take: number;
  total: number;
  totalPage: number;
};

// === UTILS ===
const formatCurrency = (amount: string | number) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "default";
    case "SENT":
      return "secondary";
    case "FOLLOW_UP":
      return "outline";
    case "DRAFT":
      return "secondary";
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusClassName = (status: string) => {
  if (status === "FOLLOW_UP")
    return "text-orange-600 border-orange-200 bg-orange-50";
  if (status === "SENT") return "text-blue-600 border-blue-200 bg-blue-50";
  return "";
};

const getClientName = (quo: Quotation) => {
  if (quo.manualClientName) return quo.manualClientName;
  if (quo.client?.b2b) return quo.client.b2b.companyName;
  if (quo.client?.b2c) {
    const prefix = quo.client.b2c.prefix ? `${quo.client.b2c.prefix}. ` : "";
    return `${prefix}${quo.client.b2c.name}`;
  }
  return "Unknown Client";
};

// 🔥 FUNGSI BARU UNTUK RENDER UI PROGRESS FOLLOW UP SEPERTI GAMBAR 🔥
const renderFollowUpProgress = (
  followUps: { name: string; date: string }[],
  status: string,
) => {
  // Jika masih draft, belum bisa di-follow up
  if (status === "DRAFT") {
    return (
      <span className="text-[10px] text-muted-foreground italic">
        Belum dikirim
      </span>
    );
  }

  const maxFU = 3; // Target standar 3 kali follow up
  const completedCount = Math.min(followUps.length, maxFU);
  const progressPercentage = (completedCount / maxFU) * 100;

  return (
    <div className="flex flex-col gap-2 min-w-42 text-left">
      {/* Progress Bar Shadcn */}
      <Progress
        value={progressPercentage}
        className="h-2 w-full bg-slate-100 [&>div]:bg-blue-600"
      />

      {/* List Follow Up */}
      <div className="flex flex-col gap-1 text-[10px] text-muted-foreground mt-1">
        {[0, 1, 2].map((index) => {
          const fu = followUps[index];
          const isCompleted = !!fu;

          return (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-green-500" : "bg-slate-300"}`}
              />
              <span className={isCompleted ? "text-green-600 font-medium" : ""}>
                FU{index + 1}:
                {isCompleted
                  ? format(new Date(fu.date), "dd MMM yyyy", {
                      locale: idLocale,
                    })
                  : "Not scheduled"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Text */}
      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
        {completedCount}/{maxFU} follow-ups completed
      </div>
    </div>
  );
};

export default function QuotationsTable() {
  const { fetchApi, status } = useApi();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // === FETCH DATA ===
  const fetchQuotations = useCallback(async () => {
    // 🛑 Jangan jalan jika sesi belum siap
    if (status === "loading" || status === "unauthenticated") return;

    setLoading(true);
    try {
      // Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      // ✨ 3. Gunakan fetchApi (Otomatis handle Token & Base URL)
      const res = await fetchApi(`/quotations?${params}`);

      if (!res.ok) throw new Error("Failed to fetch quotations");

      const result = await res.json();
      setQuotations(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data penawaran");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header (Tetap Sama) */}
      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        {/* ... (Kode Header Anda sebelumnya) ... */}
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Quotations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Kelola penawaran harga, follow-up, dan persetujuan client.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Link href="/admin-invoice/quotations/add">
              <Button className="h-9 gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4" />
                Buat Penawaran
              </Button>
            </Link>
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No QUO / Client..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter (Tetap Sama) */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="hidden md:flex items-center gap-2 mr-1 h-9 bg-white px-3 border rounded-md shadow-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium">Filter</span>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-48">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Status Penawaran
            </span>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent (Terkirim)</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="ACCEPTED">Accepted (Deal)</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table Data */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-200">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-28">Tanggal</TableHead>
                  <TableHead className="w-36">Quotation No</TableHead>
                  <TableHead className="min-w-40">Client</TableHead>

                  {/* 🔥 HEADER PROGRESS 🔥 */}
                  <TableHead className="w-48">Follow-Up Progress</TableHead>

                  <TableHead className="text-right w-32">Total Nilai</TableHead>
                  <TableHead className="text-center w-28">Status</TableHead>
                  <TableHead className="text-center w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-16 w-40" />
                      </TableCell>
                      {/* Skeleton Progress */}
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-40 text-center text-muted-foreground">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quo) => (
                    <TableRow key={quo.id} className="hover:bg-muted/5">
                      <TableCell className="text-sm">
                        <span className="font-medium text-gray-700">
                          {format(new Date(quo.date), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium text-blue-600">
                        {quo.quotationNumber}
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-gray-800">
                        {getClientName(quo)}
                      </TableCell>

                      {/* 🔥 CELL PROGRESS FOLLOW UP 🔥 */}
                      <TableCell>
                        {renderFollowUpProgress(
                          quo.followUps || [],
                          quo.status,
                        )}
                      </TableCell>

                      <TableCell className="text-right text-xs font-semibold text-gray-900">
                        {formatCurrency(quo.totalAmount)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(quo.status) as any}
                          className={`text-[10px] h-5 px-2 capitalize shadow-none ${getStatusClassName(quo.status)}`}>
                          {quo.status.replace("_", " ").toLowerCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Link
                          href={`/admin-invoice/quotations/detail/${quo.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="text-xs text-muted-foreground">
            Halaman <strong>{meta.page}</strong> dari
            <strong>{meta.totalPage}</strong> • Total
            <strong>{meta.total}</strong> Data
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 text-xs">
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
