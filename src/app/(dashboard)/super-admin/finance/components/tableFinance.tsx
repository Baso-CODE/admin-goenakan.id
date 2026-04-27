"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  Loader2,
  Pencil,
  Search,
  Tags,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

// === TYPES ===
type FinanceTransaction = {
  id: string;
  transactionDate: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  referenceNumber: string | null;
  description: string;
  category: { name: string; type: string };
  user: { name: string };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface FinanceExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
  type?: string;
}

// === UTILS ===
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function TableFinance() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [transactionType, setTransactionType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH TRANSACTIONS ===
  const fetchTransactions = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (transactionType !== "ALL") params.append("type", transactionType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetchApi(`/finance/transactions?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch transactions");
      }

      const result = await res.json();
      setTransactions(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error("❌ Failed to load transactions:", error);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    transactionType,
    startDate,
    endDate,
    status,
    fetchApi,
  ]);

  // === HANDLER EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const exportFilters: FinanceExportQuery = {};
      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (transactionType !== "ALL") exportFilters.type = transactionType;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/finance/transactions/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || "Export failed. Server responded with an error.",
        );
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "finance_export.xlsx";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export berhasil didownload!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan export data");
    } finally {
      setExporting(false);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Buku Kas Operasional
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Kelola dan pantau arus kas masuk dan keluar perusahaan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Deskripsi / Ref..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Link href="/super-admin/finance/categories">
              <Button
                variant="outline"
                className="w-full md:w-auto shadow-sm hover:shadow-md transition-all gap-2">
                <Tags className="h-4 w-4" />
                Kategori
              </Button>
            </Link>

            {/* Tombol Catat Transaksi (Primary) */}
            <Link href="/super-admin/finance/add">
              <Button className="w-full md:w-auto shadow-sm hover:shadow-md transition-all">
                + Catat Transaksi
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Filter & Export Bar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter Type */}
            <div className="flex flex-col gap-1.5 w-full sm:w-45">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tipe Transaksi
              </span>
              <Select
                value={transactionType}
                onValueChange={(val) => {
                  setTransactionType(val);
                  setPage(1);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="INCOME">Pemasukan (Income)</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran (Expense)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Date Range */}
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5 w-full sm:w-35">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Start Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm h-10 px-3",
                        !startDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(new Date(startDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih Tanggal</span>
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

              {/* End Date */}
              <div className="flex flex-col gap-1.5 w-full sm:w-35">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  End Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm h-10 px-3",
                        !endDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(new Date(endDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih Tanggal</span>
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

          <Button
            variant="outline"
            className="w-full lg:w-auto border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export Excel
          </Button>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead className="w-40">Kategori</TableHead>
                  <TableHead className="w-64">Deskripsi</TableHead>
                  <TableHead className="w-32 text-center">Tipe</TableHead>
                  <TableHead className="w-32">Dibuat Oleh</TableHead>
                  <TableHead className="text-right w-40">Nominal</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground">
                      Tidak ada transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(tx.transactionDate), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-700">
                          {tx.category.name}
                        </span>
                        {tx.referenceNumber && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Ref: {tx.referenceNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-2 font-medium gap-1",
                            tx.type === "INCOME"
                              ? "text-green-700 border-green-200 bg-green-50"
                              : "text-red-700 border-red-200 bg-red-50",
                          )}>
                          {tx.type === "INCOME" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {tx.user.name}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          tx.type === "INCOME"
                            ? "text-green-600"
                            : "text-gray-900",
                        )}>
                        {tx.type === "EXPENSE" ? "- " : "+ "}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/super-admin/finance/detail/${tx.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/super-admin/finance/edit/${tx.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
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
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing Page <strong>{meta.page}</strong> of{" "}
            <strong>{Math.ceil(meta.total / meta.perPage)}</strong> (
            {meta.total} total items)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
