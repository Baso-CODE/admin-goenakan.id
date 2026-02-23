"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowRight,
  Banknote,
  Calendar as CalendarIcon,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import UtangPiutangCard from "./utangPiutangCard";

// === TYPES ===
type CashflowItem = {
  orderId: string;
  poNumber: string;
  dateOrder: string;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  profitOrLoss: number;
  hasCashflowData: boolean;
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

export default function CashflowClient() {
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

  // === FETCH DATA TABLE ===
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
      const res = await fetch(`${apiUrl}/cashflows?${params}`, {
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
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* 1. Header Halaman */}
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

      <UtangPiutangCard />

      {/* 3. Filter Bar & Tabel */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto sm:items-center">
            {/* --- Search Input --- */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO Number..."
                // Menggunakan h-10 agar tinggi nyaman disentuh & sejajar
                className="pl-9 h-10 text-sm bg-white shadow-sm border-gray-200 focus-visible:ring-1"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {/* === START DATE PICKER === */}
              <div className="flex flex-col gap-1.5 w-1/2 sm:w-36">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Start Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs h-9 px-3 bg-white border-gray-200",
                        !startDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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

              {/* === END DATE PICKER === */}
              <div className="flex flex-col gap-1.5 w-1/2 sm:w-36">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  End Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs h-9 px-3 bg-white border-gray-200",
                        !endDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
                        setPage(1); // Reset ke halaman 1 saat filter berubah
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Optional: Add clear filter or export button here if needed later */}
        </div>
      </Card>

      {/* 4. Table Data */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-40">PO Number</TableHead>
                  <TableHead className="w-48">Client</TableHead>
                  <TableHead className="text-right w-36 text-emerald-600">
                    Revenue
                  </TableHead>
                  <TableHead className="text-right w-36 text-red-600">
                    Cost
                  </TableHead>
                  <TableHead className="text-right w-36">Profit/Loss</TableHead>
                  <TableHead className="text-center w-24">Action</TableHead>
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
                      No transactions found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashflows.map((item) => (
                    <TableRow
                      key={item.orderId}
                      className="hover:bg-muted/5 group transition-colors">
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
                          {format(new Date(item.dateOrder), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium text-primary">
                        {item.poNumber}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700 truncate max-w-50">
                        {item.clientName}
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="text-right text-sm font-medium text-emerald-700">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>

                      {/* Cost */}
                      <TableCell className="text-right text-sm font-medium text-red-700">
                        {item.totalCost > 0 ? (
                          formatCurrency(item.totalCost)
                        ) : (
                          <span className="text-gray-400 italic text-[10px]">
                            --
                          </span>
                        )}
                      </TableCell>

                      {/* Profit / Loss */}
                      <TableCell className="text-right text-sm">
                        <div
                          className={cn(
                            "font-bold flex items-center justify-end gap-1",
                            item.profitOrLoss > 0
                              ? "text-emerald-600"
                              : item.profitOrLoss < 0
                                ? "text-red-600"
                                : "text-gray-400",
                          )}>
                          {item.profitOrLoss > 0 && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {item.profitOrLoss < 0 && (
                            <TrendingDown className="h-3 w-3" />
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
                              "h-7 px-3 text-xs shadow-none",
                              !item.hasCashflowData &&
                                "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
                            )}>
                            {item.hasCashflowData ? "Detail" : "Input"}
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

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between px-2">
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
