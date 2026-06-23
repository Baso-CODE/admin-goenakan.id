"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  FlaskConical,
  Loader2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

// === TYPES ===
type OrderSample = {
  id: string;
  orderDate: string;
  sampleNumber: string;
  customerName: string;
  shippingAddress: string;
  picCustomer: string;
  quotationReference: string;

  // Data Production & Logistics
  productionData?: string;
  packagingDate?: string;
  shippingDate: string | null;
  sendToCustDate: string | null;
  arrivalInCustDate: string | null;

  // Follow Up
  lastFollowUpDate: string | null;
  lastFollowUpRemark: string;

  // Audit
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  status: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface OrderExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
  salesCategory?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function TableOrderSample() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [orders, setOrders] = useState<OrderSample[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH ORDERS (SAMPLE ONLY) ===
  const fetchOrders = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        salesCategory: "SAMPLE",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetchApi(`/orders/all?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch orders");
      }

      const result = await res.json();
      setOrders(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data sample");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate, status, fetchApi]);

  // === HANDLER EXPORT (SAMPLE ONLY) ===
  const handleExport = async () => {
    if (status !== "authenticated") return;
    setExporting(true);
    try {
      const exportFilters: OrderExportQuery = {
        salesCategory: "SAMPLE",
      };

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(`/orders/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "sample_orders_export.xlsx";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export Sample berhasil!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    // Struktur max-w-full dan overflow-hidden agar halaman tidak scroll memanjang
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-hidden mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FlaskConical className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Sample Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Khusus pengelolaan data sample order dan follow up.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Sample No / Client..."
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
      <Card className="p-4 shadow-sm w-full">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex flex-col gap-1.5 w-full sm:w-35">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date
              </span>
              <Input
                type="date"
                className="text-sm"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-35">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                End Date
              </span>
              <Input
                type="date"
                className="text-sm"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full lg:w-auto border-green-600 text-green-700 hover:bg-green-50 gap-2"
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

      <Link href="/super-admin/orders/add?type=SAMPLE">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Sample Order
        </Button>
      </Link>
      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-4">
        <CardContent className="p-0 w-full overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table className="whitespace-nowrap w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-30">Order Date</TableHead>
                  <TableHead className="min-w-42.5">Sample Number</TableHead>
                  <TableHead className="min-w-37.5">Customer Name</TableHead>
                  <TableHead className="min-w-37.5">PIC Customer</TableHead>
                  <TableHead className="min-w-32.5">Status</TableHead>
                  <TableHead className="min-w-37.5">Quotation Ref</TableHead>

                  {/* Bagian Production & Logistik */}
                  <TableHead className="min-w-35 bg-blue-50/50">
                    Production Data
                  </TableHead>
                  <TableHead className="min-w-32.5 bg-blue-50/50">
                    Packaging Date
                  </TableHead>
                  <TableHead className="min-w-32.5 bg-green-50/50">
                    Shipping Date
                  </TableHead>
                  <TableHead className="min-w-35 bg-green-50/50">
                    Send to Cust
                  </TableHead>
                  <TableHead className="min-w-35 bg-green-50/50">
                    Arrival in Cust
                  </TableHead>

                  {/* Bagian Follow up */}
                  <TableHead className="min-w-35 bg-orange-50/50">
                    Last Follow Up
                  </TableHead>
                  <TableHead className="min-w-50 bg-orange-50/50">
                    Follow Up Remark
                  </TableHead>

                  {/* Bagian Detail Lainnya */}
                  <TableHead className="min-w-50">Shipping Address</TableHead>
                  <TableHead className="min-w-30">Created By</TableHead>
                  <TableHead className="min-w-35">Create Time</TableHead>
                  <TableHead className="min-w-30">Updated By</TableHead>
                  <TableHead className="min-w-35">Updated Time</TableHead>

                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] min-w-25">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 18 }).map((_, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={19}
                      className="h-24 text-center text-muted-foreground">
                      No sample orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(order.orderDate), "dd MMM yy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-purple-600">
                        {order.sampleNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.picCustomer}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px] uppercase tracking-wider",
                            getStatusColor(order.status),
                          )}
                          variant="outline">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {order.quotationReference}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-blue-700 bg-blue-50/30">
                        {order.productionData || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-blue-600 bg-blue-50/30">
                        {order.packagingDate
                          ? format(
                              new Date(order.packagingDate),
                              "dd MMM yy HH:mm",
                            )
                          : "-"}
                      </TableCell>

                      <TableCell className="text-sm text-green-700 bg-green-50/30">
                        {order.shippingDate
                          ? format(
                              new Date(order.shippingDate),
                              "dd MMM yy HH:mm",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-green-700 bg-green-50/30">
                        {order.sendToCustDate
                          ? format(new Date(order.sendToCustDate), "dd MMM yy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-green-700 bg-green-50/30">
                        {order.arrivalInCustDate
                          ? format(
                              new Date(order.arrivalInCustDate),
                              "dd MMM yy",
                            )
                          : "-"}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-orange-600 bg-orange-50/30">
                        {order.lastFollowUpDate
                          ? format(
                              new Date(order.lastFollowUpDate),
                              "dd MMM yy",
                            )
                          : "Belum di-follow up"}
                      </TableCell>
                      <TableCell
                        className="text-sm text-orange-600 bg-orange-50/30 max-w-50 truncate"
                        title={order.lastFollowUpRemark}>
                        {order.lastFollowUpRemark}
                      </TableCell>

                      <TableCell
                        className="text-sm text-gray-600 max-w-50 truncate"
                        title={order.shippingAddress}>
                        {order.shippingAddress}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.createdBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(order.createdTime), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.updatedBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(order.updatedTime), "dd/MM/yy HH:mm")}
                      </TableCell>

                      <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/super-admin/orders/detail/${order.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/super-admin/orders/edit/${order.id}`}>
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
            Page <strong>{meta.page}</strong> of
            <strong>{Math.ceil(meta.total / meta.perPage)}</strong> (
            {meta.total} samples)
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
