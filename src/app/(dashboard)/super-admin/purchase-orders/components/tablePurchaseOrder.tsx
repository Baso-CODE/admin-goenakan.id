"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  Loader2,
  Pencil,
  Search,
  ShoppingBag,
} from "lucide-react";
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
import Link from "next/link";

// === TYPES ===
type PurchaseOrder = {
  id: string;
  poDate: string;
  poNumber: string;
  purchaseType: string;
  expensesCategory: string;
  vendorName: string;
  vendorAddress: string;
  salesOrderReference: string;
  currency: string;
  totalAmount: number;
  status: string;
  approvalStatus: string;
  approveBy: string;
  approvalDate: string | null;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface PurchaseOrderExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

// === UTILS ===
const formatCurrency = (amount: number, currencyCode: string = "IDR") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
};

// Warna untuk Purchase Order Status
const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    case "APPROVED":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
    case "SENT":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

export default function TablePurchaseOrder() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH PURCHASE ORDERS ===
  const fetchPurchaseOrders = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // Pastikan endpoint ini sesuai dengan path router backend kamu
      const res = await fetchApi(`/purchase-orders/all?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch purchase orders");
      }

      const result = await res.json();
      setPurchaseOrders(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data Purchase Order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate, status, fetchApi]);

  // === HANDLER EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: PurchaseOrderExportQuery = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      // Pastikan backend memiliki route export ini jika tombol ini digunakan
      const response = await fetchApi(
        `/purchase-orders/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "purchase_orders_export.xlsx";

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
    <div className="space-y-6 w-full max-w-full overflow-hidden mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-blue-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Purchase Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and track all internal purchases and vendor orders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO Number / Vendor..."
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

      {/* Filter & Export Bar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter Date Range */}
            <div className="flex gap-2 w-full sm:w-auto">
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
      <Card className="shadow-sm border-t-0 w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-30">PO Date</TableHead>
                  <TableHead className="min-w-37.5">PO Number</TableHead>
                  <TableHead className="min-w-37.5">Purchase Type</TableHead>
                  <TableHead className="min-w-37.5">Expense Category</TableHead>
                  <TableHead className="min-w-37.5">Vendor Name</TableHead>
                  <TableHead className="min-w-50">Vendor Address</TableHead>
                  <TableHead className="min-w-37.5">SO / Sample Ref</TableHead>
                  <TableHead className="min-w-20">Currency</TableHead>
                  <TableHead className="text-right min-w-37.5">
                    Total Amount
                  </TableHead>
                  <TableHead className="min-w-30">Status</TableHead>
                  <TableHead className="min-w-30">Approval Status</TableHead>
                  <TableHead className="min-w-30">Approve By</TableHead>
                  <TableHead className="min-w-37.5">Approval Date</TableHead>
                  <TableHead className="min-w-30">Created By</TableHead>
                  <TableHead className="min-w-37.5">Created Time</TableHead>
                  <TableHead className="min-w-30">Updated By</TableHead>
                  <TableHead className="min-w-37.5">Updated Time</TableHead>
                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] min-w-25">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 17 }).map((_, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={18}
                      className="h-24 text-center text-muted-foreground">
                      No purchase orders found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(po.poDate), "dd MMM yy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-blue-700">
                        {po.poNumber}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700">
                        {po.purchaseType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {po.expensesCategory}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {po.vendorName}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-50 truncate"
                        title={po.vendorAddress}>
                        {po.vendorAddress}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {po.salesOrderReference}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-600">
                        {po.currency}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(po.totalAmount, po.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px] uppercase tracking-wider border",
                            getStatusColor(po.status),
                          )}
                          variant="secondary">
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase tracking-wider",
                            po.approvalStatus === "Approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200",
                          )}>
                          {po.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {po.approveBy}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {po.approvalDate
                          ? format(new Date(po.approvalDate), "dd MMM yy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {po.createdBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(po.createdTime), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {po.updatedBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(po.updatedTime), "dd/MM/yy HH:mm")}
                      </TableCell>

                      <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          {/* Sesuaikan href dengan routing untuk view / edit PO */}
                          <Link
                            href={`/super-admin/purchase-orders/detail/${po.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Link
                            href={`/super-admin/purchase-orders/edit/${po.id}`}>
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
            <strong>{Math.ceil(meta.total / meta.perPage)} </strong> (
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
