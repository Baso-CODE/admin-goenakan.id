"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon,
  Eye,
  FileText,
  NotebookPen,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useCachedApi } from "@/hooks/useCachedApi";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDeleteDialog } from "../../components/confirmDeleteDialog";

//  UPDATE: Sesuaikan tipe data dengan kembalian API terbaru
type Invoice = {
  id: string;
  invoiceDate: string;
  invoiceNumber: string;
  dueDate: string | null;
  orderNumber: string; // Menggantikan poNumber
  clientName: string;
  totalAmount: number;
  currencyCode: string; // Tambahan properti mata uang
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED" | "DRAFT";
  category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
  method: string;
  totalItems: number;
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
//  UPDATE: Buat formatter menerima parameter currencyCode secara dinamis
const formatCurrency = (amount: number, currencyCode: string = "IDR") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
};

// Badge Colors Helper
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "PAID":
      return "default";
    case "UNPAID":
      return "secondary";
    case "OVERDUE":
      return "destructive";
    default:
      return "outline";
  }
};

export default function InvoicesPage() {
  const { fetchApi, status } = useApi();
  const queryClient = useQueryClient();

  // ==========================================
  // STATE DELETE INVOICE
  // ==========================================

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // FILTER STATE
  // ==========================================

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);

  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ==========================================
  // BUILD QUERY PARAMS
  // ==========================================

  const params = new URLSearchParams({
    page: String(page),
    take: "10",
  });

  const searchValue = String(debouncedSearch ?? "").trim();

  if (searchValue) {
    params.set("search", searchValue);
  }

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }

  if (categoryFilter !== "ALL") {
    params.set("category", categoryFilter);
  }

  if (startDate) {
    params.set("startDate", startDate);
  }

  if (endDate) {
    params.set("endDate", endDate);
  }

  const endpoint = `/invoices?${params.toString()}`;

  // ==========================================
  // TANSTACK QUERY - INVOICE LIST
  // ==========================================

  type InvoiceResponse = {
    data: Invoice[];
    meta: Meta;
  };

  const {
    data: invoiceResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
  } = useCachedApi<InvoiceResponse>(["invoices", "list", endpoint], endpoint, {
    staleTime: 5 * 60 * 1000,
  });

  // ==========================================
  // DATA UNTUK JSX
  // ==========================================

  const invoices: Invoice[] = invoiceResponse?.data ?? [];

  const meta: Meta | null = invoiceResponse?.meta ?? null;

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Gagal mengambil data invoice."
    : null;

  // ==========================================
  // CLOSE DELETE DIALOG
  // ==========================================

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return;

    setSelectedInvoice(null);
  };

  // ==========================================
  // DELETE INVOICE
  // ==========================================

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice || isDeleting || status !== "authenticated") {
      return;
    }

    if (selectedInvoice.status === "PAID") {
      toast.error("Invoice yang sudah dibayar tidak dapat dihapus.");
      return;
    }

    const invoiceId = selectedInvoice.id;

    try {
      setIsDeleting(true);

      const response = await fetchApi(`/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus invoice.");
      }

      toast.success(result.message || "Invoice berhasil dihapus.");

      // Tutup dialog setelah berhasil
      setSelectedInvoice(null);

      // ======================================
      // INVALIDASI CACHE
      // ======================================

      // Perbarui daftar invoice.
      await queryClient.invalidateQueries({
        queryKey: ["invoices"],
      });

      // Invoice berkaitan dengan data Order.
      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      // Invalidasi cache detail invoice.
      await queryClient.invalidateQueries({
        queryKey: ["invoice-detail", invoiceId],
      });

      // Jika invoice terakhir di halaman terhapus,
      // kembali ke halaman sebelumnya.
      if (invoices.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Delete invoice error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus invoice.",
      );
    } finally {
      setIsDeleting(false);
    }
  };
  // === RENDER ===
  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header */}
      <Card className="border-l-4 border-l-blue-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pantau tagihan, status pembayaran, dan riwayat transaksi.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* === TOMBOL MENUJU PAGE NOTES === */}
            <Link href="/admin-invoice/notes">
              <Button
                variant="outline"
                className="gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 w-full sm:w-auto cursor-pointer">
                <NotebookPen className="h-4 w-4" />
                Manage Notes
              </Button>
            </Link>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Invoice / Order..."
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

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end">
          {/* Group Filter Utama */}
          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-end">
            {/* 1. Search Invoice / PO */}
            <div className="flex flex-col gap-1.5 w-full sm:w-60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Search
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari Invoice / Order..."
                  className="pl-9 h-10 text-sm bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* 2. Filter Status */}
            <div className="flex flex-col gap-1.5 w-full sm:w-40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Status
              </span>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="h-10 text-sm bg-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Filter Kategori */}
            <div className="flex flex-col gap-1.5 w-full sm:w-44">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Kategori
              </span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="h-10 text-sm bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="FULL_PAYMENT">Full Payment</SelectItem>
                  <SelectItem value="DP">Down Payment</SelectItem>
                  <SelectItem value="INSTALLMENT">Cicilan</SelectItem>
                  <SelectItem value="REMAINING_BALANCE">Pelunasan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Filter Date Range (Updated Style) */}
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Start Date Picker */}
              <div className="flex flex-col gap-1.5 w-1/2 sm:w-36">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Start Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white",
                        !startDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(new Date(startDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate ? new Date(startDate) : undefined}
                      onSelect={(date) => {
                        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                        setStartDate(dateStr);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Picker */}
              <div className="flex flex-col gap-1.5 w-1/2 sm:w-36">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  End Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white",
                        !endDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(new Date(endDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate ? new Date(endDate) : undefined}
                      onSelect={(date) => {
                        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                        setEndDate(dateStr);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Data */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-30">Tanggal</TableHead>
                  <TableHead className="w-30">Invoice No</TableHead>
                  <TableHead className="w-37.5">Order / Sample No</TableHead>
                  <TableHead className="w-50">Client</TableHead>
                  <TableHead className="w-30">Kategori</TableHead>
                  <TableHead className="text-right w-37.5">
                    Total Tagihan
                  </TableHead>
                  <TableHead className="text-center w-25">Status</TableHead>
                  <TableHead className="text-center w-25">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton Rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-red-600">
                      Gagal memuat invoice: {error}
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-gray-300" />
                        <p>Tidak ada invoice yang ditemukan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/5">
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(inv.invoiceDate), "dd MMM yyyy", {
                              locale: idLocale,
                            })}
                          </span>
                          {inv.dueDate && (
                            <span className="text-[10px] text-muted-foreground">
                              Due:{" "}
                              {format(new Date(inv.dueDate), "dd MMM", {
                                locale: idLocale,
                              })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {/*  UPDATE: Memanggil data orderNumber terbaru */}
                        {inv.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {inv.clientName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal">
                          {inv.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {/*  UPDATE: Mengirimkan nominal beserta currencyCode-nya */}
                        {formatCurrency(inv.totalAmount, inv.currencyCode)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(inv.status) as any}
                          className="text-[10px] h-5 px-2 capitalize">
                          {inv.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* DETAIL INVOICE */}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            title="Detail Invoice">
                            <Link href={`/admin-invoice/invoices/${inv.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {/* DELETE INVOICE */}
                          {inv.status !== "PAID" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isDeleting}
                              onClick={() => setSelectedInvoice(inv)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Hapus Invoice">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
            Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{Math.max(1, meta.totalPage)}</strong>
            {" • "} Total <strong>{meta.total}</strong> Data
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious || loading || isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="h-8 text-xs">
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext || loading || isFetching}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}
      <ConfirmDeleteDialog
        isOpen={selectedInvoice !== null}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteInvoice}
        isLoading={isDeleting}
        title="Hapus Invoice?"
        description={`Apakah Anda yakin ingin menghapus invoice ${
          selectedInvoice?.invoiceNumber || `INV/${selectedInvoice?.id ?? "-"}`
        }?`}
        warningMessage="Invoice beserta semua item dan catatannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
