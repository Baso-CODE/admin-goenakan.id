"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Pencil,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Hapus import Select karena filter kategori dihapus
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { InvoiceDialogWrapper } from "./helper/invoiceDialogWrapper";

// === TYPES ===
type Order = {
  id: string;
  orderDate: string;
  soNumber: string;
  poNumber: string;
  customerName: string;
  shippingAddress: string;
  picCustomer: string;
  clientPoNumber: string;
  sampleReference: string;
  quotationReference: string;
  remark: string;
  status: string;
  sendToCustDate: string | null;
  arrivalInCustDate: string | null;
  createdBy: string;
  createdTime: string;
  updatedTime: string;
  totalAmount: number;
  currencyCode: string;
  salesCategory: "SALES" | "SAMPLE";
  salesName: string;
  totalItems: number;
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

// === UTILS ===
const formatCurrency = (amount: number, currencyCode: string = "IDR") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
};

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

export default function TableOrder() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState<
    string | null
  >(null);
  const salesCategory = "SALES";

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH ORDERS ===
  const fetchOrders = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        salesCategory: salesCategory, // Selalu kirim "SALES"
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
      toast.error("Gagal memuat data order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate, status, fetchApi]);

  // === HANDLER EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: OrderExportQuery = {
        salesCategory: salesCategory, // Fix export hanya untuk SALES
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "orders_export.xlsx";

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
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Sales Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage, track, and export your commercial sales orders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SO/PO/Client..."
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
            {/* ✨ Filter UI untuk Category sudah dihapus karena ini halaman khusus SALES */}

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
                  <TableHead className="min-w-[120px]">Order Date</TableHead>
                  <TableHead className="min-w-[150px]">SO Number</TableHead>
                  <TableHead className="min-w-[150px]">Internal PO</TableHead>
                  <TableHead className="min-w-[150px]">Customer Name</TableHead>
                  <TableHead className="min-w-[150px]">PIC Customer</TableHead>
                  <TableHead className="min-w-[130px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">PO Customer</TableHead>
                  <TableHead className="text-right min-w-[130px]">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]">
                    Items
                  </TableHead>
                  {/* Kolom Type dihapus karena ini sudah pasti SALES */}
                  <TableHead className="min-w-[140px]">Sales Rep</TableHead>
                  <TableHead className="min-w-[150px]">Sample Ref</TableHead>
                  <TableHead className="min-w-[150px]">Quotation Ref</TableHead>
                  <TableHead className="min-w-[140px]">Send to Cust</TableHead>
                  <TableHead className="min-w-[140px]">
                    Arrival in Cust
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    Shipping Address
                  </TableHead>
                  <TableHead className="min-w-[150px]">Remarks</TableHead>
                  <TableHead className="min-w-[120px]">Created By</TableHead>
                  <TableHead className="min-w-[150px]">Created Time</TableHead>
                  <TableHead className="min-w-[150px]">Updated Time</TableHead>
                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] min-w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 19 }).map((_, col) => (
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
                      colSpan={20}
                      className="h-24 text-center text-muted-foreground">
                      No orders found matching your filters.
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
                      <TableCell className="font-mono font-medium text-primary">
                        {order.soNumber}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-orange-600">
                        {order.poNumber}
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
                        {order.clientPoNumber}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount, order.currencyCode)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {order.totalItems}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.salesName}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {order.sampleReference}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {order.quotationReference}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {order.sendToCustDate
                          ? format(new Date(order.sendToCustDate), "dd MMM yy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {order.arrivalInCustDate
                          ? format(
                              new Date(order.arrivalInCustDate),
                              "dd MMM yy",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-[200px] truncate"
                        title={order.shippingAddress}>
                        {order.shippingAddress}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-[150px] truncate"
                        title={order.remark}>
                        {order.remark}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.createdBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(order.createdTime), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(order.updatedTime), "dd/MM/yy HH:mm")}
                      </TableCell>

                      <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedInvoiceOrderId(order.id)}
                            title="Generate Invoice"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                            <FileText className="h-4 w-4" />
                          </Button>

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
            Showing Page <strong>{meta.page}</strong> of
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
      {selectedInvoiceOrderId && (
        <InvoiceDialogWrapper
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
          onSuccess={() => {
            fetchOrders(); // Refresh data tabel jika invoice berhasil terbuat
          }}
        />
      )}
    </div>
  );
}
