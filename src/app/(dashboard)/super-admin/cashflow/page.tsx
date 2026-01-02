"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowRight,
  Banknote,
  Calendar as CalendarIcon,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

// === TYPES ===
type CashflowItem = {
  orderId: string;
  poNumber: string;
  dateOrder: string;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  profitOrLoss: number;
  hasCashflowData: boolean; // Penanda apakah sudah pernah diedit
};

type Meta = {
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

export default function CashflowPage() {
  // === STATE ===
  const [cashflows, setCashflows] = useState<CashflowItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // === FETCH DATA ===
  const fetchCashflows = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // Endpoint Service Cashflow
      const res = await fetch(`http://localhost:8000/cashflows?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch cashflows");

      const result = await res.json();
      setCashflows(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data cashflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate]);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <Card className="border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Cash Flow</CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitor profit & loss per order transaction.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center">
          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-end">
            {/* Search */}
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO Number..."
                className="pl-9 h-9 text-sm bg-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm w-full sm:w-auto">
              <div className="flex flex-col gap-0.5 px-2">
                <span className="text-[9px] text-muted-foreground font-medium uppercase">
                  Start Date
                </span>
                <input
                  type="date"
                  className="text-xs font-medium focus:outline-none bg-transparent h-5 w-[110px]"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex flex-col gap-0.5 px-2">
                <span className="text-[9px] text-muted-foreground font-medium uppercase">
                  End Date
                </span>
                <input
                  type="date"
                  className="text-xs font-medium focus:outline-none bg-transparent h-5 w-[110px]"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
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
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-40">PO Number</TableHead>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead className="text-right w-40 text-emerald-600">
                    Total Revenue
                  </TableHead>
                  <TableHead className="text-right w-40 text-red-600">
                    Total Cost
                  </TableHead>
                  <TableHead className="text-right w-40">
                    Profit / Loss
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : cashflows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashflows.map((item) => (
                    <TableRow
                      key={item.orderId}
                      className="hover:bg-muted/5 group">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(item.dateOrder), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-primary">
                        {item.poNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {item.clientName}
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="text-right font-medium text-emerald-700">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>

                      {/* Cost */}
                      <TableCell className="text-right font-medium text-red-700">
                        {item.totalCost > 0 ? (
                          formatCurrency(item.totalCost)
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            - Not Inputted -
                          </span>
                        )}
                      </TableCell>

                      {/* Profit / Loss */}
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            "font-bold flex items-center justify-end gap-1",
                            item.profitOrLoss > 0
                              ? "text-emerald-600"
                              : item.profitOrLoss < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          )}>
                          {item.profitOrLoss > 0 && (
                            <TrendingUp className="h-3.5 w-3.5" />
                          )}
                          {item.profitOrLoss < 0 && (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {item.profitOrLoss === 0 && (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                          {formatCurrency(item.profitOrLoss)}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Link
                          href={`/super-admin/cashflow/edit/${item.orderId}`}>
                          <Button
                            variant={item.hasCashflowData ? "ghost" : "default"}
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-xs",
                              !item.hasCashflowData &&
                                "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            )}>
                            {item.hasCashflowData ? "Edit" : "Input Cost"}
                            {item.hasCashflowData && (
                              <ArrowRight className="ml-1 h-3 w-3 opacity-50" />
                            )}
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

      {/* Pagination (Sama seperti halaman lain) */}
      {meta && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="text-xs text-muted-foreground">
            Page <strong>{meta.page}</strong> of{" "}
            <strong>{meta.totalPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 text-xs">
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPage}
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
