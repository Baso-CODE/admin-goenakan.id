"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Eye, FileText, Filter, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useDebounce } from "@/helper/debounce"; // Pastikan path ini benar

// === TYPES (Sesuai Response Service getAllInvoices) ===
type Invoice = {
  id: string;
  invoiceDate: string;
  invoiceNumber: string;
  dueDate: string | null;
  poNumber: string;
  clientName: string;
  totalAmount: number;
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
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Badge Colors Helper
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "PAID":
      return "default"; // Hitam/Primary
    case "UNPAID":
      return "secondary"; // Abu-abu
    case "OVERDUE":
      return "destructive"; // Merah
    default:
      return "outline";
  }
};

export default function InvoicesPage() {
  // === STATE ===
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH INVOICES ===
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // 1. Get Token
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // 3. Fetch API
      const res = await fetch(`http://localhost:8000/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch invoices");

      const result = await res.json();
      setInvoices(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, debouncedSearch, statusFilter, categoryFilter, startDate, endDate]);

  // === RENDER ===
  return (
    <div className="space-y-6 w-full  mx-auto pb-10">
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

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search Bar */}
            <div className="relative w-full md:w-70">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No Invoice / Client / PO..."
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
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center">
          {/* Group Filter Utama */}
          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-end">
            {/* Label Filter Icon */}
            <div className="hidden md:flex items-center gap-2 mr-1 h-9 bg-white px-3 border rounded-md shadow-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-medium">Filter</span>
            </div>

            {/* Filter Status */}
            <div className="flex flex-col gap-1.5 w-full sm:w-40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Status
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
                  <SelectItem value="UNPAID">Unpaid (Belum Lunas)</SelectItem>
                  <SelectItem value="PAID">Paid (Lunas)</SelectItem>
                  <SelectItem value="OVERDUE">Overdue (Telat)</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Kategori */}
            <div className="flex flex-col gap-1.5 w-full sm:w-45">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Kategori
              </span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="FULL_PAYMENT">Full Payment</SelectItem>
                  <SelectItem value="DP">Down Payment (DP)</SelectItem>
                  <SelectItem value="INSTALLMENT">Cicilan</SelectItem>
                  <SelectItem value="REMAINING_BALANCE">Pelunasan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Date Range */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex flex-col gap-0.5 px-2">
                <span className="text-[9px] text-muted-foreground font-medium uppercase">
                  Dari
                </span>
                <input
                  type="date"
                  className="text-xs font-medium focus:outline-none bg-transparent h-5 w-27.5"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="h-6 w-px bg-gray-200"></div> {/* Separator */}
              <div className="flex flex-col gap-0.5 px-2">
                <span className="text-[9px] text-muted-foreground font-medium uppercase">
                  Sampai
                </span>
                <input
                  type="date"
                  className="text-xs font-medium focus:outline-none bg-transparent h-5 w-27.5"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tombol Export */}
          {/* <Button
            variant="outline"
            className="w-full xl:w-auto h-9 text-xs font-medium border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2 shadow-sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            Export Excel
          </Button> */}
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
                  <TableHead className="w-30">Inovoice No</TableHead>
                  <TableHead className="w-37.5">PO Number</TableHead>
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
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                        {inv.poNumber}
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
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(inv.status) as any}
                          className="text-[10px] h-5 px-2 capitalize">
                          {inv.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/admin-invoice/invoices/${inv.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
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
            Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{meta.totalPage}</strong> • Total{" "}
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
