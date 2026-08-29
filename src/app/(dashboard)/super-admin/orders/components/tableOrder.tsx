"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
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

import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PurchaseChannel } from "../types/order.types";
import { InvoiceDialogWrapper } from "./helper/invoiceDialogWrapper";

// === TYPES ===
type Order = {
  id: string;
  orderDate: string;
  orderNumber: string;
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
  updatedBy: string;
  updatedTime: string;
  totalAmount: number;
  currencyCode: string;
  salesCategory: "SALES" | "SAMPLE";
  salesName: string;
  totalItems: number;
  purchaseChannel?: string;
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
  purchaseChannelId?: string;
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  //  2. STATE UNTUK MENYIMPAN DAFTAR PURCHASE CHANNEL
  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string>("ALL");

  //  3. FETCH PURCHASE CHANNELS SAAT HALAMAN DIMUAT
  useEffect(() => {
    const fetchPurchaseChannels = async () => {
      if (status !== "authenticated") return;
      try {
        const res = await fetchApi("/purchase-channels/list");
        if (res.ok) {
          const data = await res.json();
          // Menyesuaikan apakah response berupa array langsung atau terbungkus di dalam property .data
          setPurchaseChannels(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error("Gagal memuat purchase channels", error);
      }
    };

    fetchPurchaseChannels();
  }, [status, fetchApi]);
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

      //  4. MASUKKAN PURCHASE CHANNEL KE PARAMETER URL JIKA DIPILIH DAN BUKAN "ALL"
      if (selectedChannelId && selectedChannelId !== "ALL") {
        params.append("purchaseChannelId", selectedChannelId);
      }

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
  }, [
    page,
    debouncedSearch,
    startDate,
    endDate,
    selectedChannelId,
    status,
    fetchApi,
  ]);

  // === HANDLER EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: OrderExportQuery = {
        salesCategory: salesCategory,
      };

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      //  6. SERTAKAN FILTER CHANNEL PADA EXPORT
      if (selectedChannelId && selectedChannelId !== "ALL") {
        exportFilters.purchaseChannelId = selectedChannelId;
      }

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

  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const response = await fetchApi(`/orders/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus data");
      }

      toast.success("Data berhasil dihapus");

      // Refresh tabel setelah delete
      setPage(1);
      fetchOrders();
    } catch (error: any) {
      console.error("❌ Error delete data:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
            {/*  7. TAMBAHKAN DROPDOWN SELECT UNTUK FILTER PURCHASE CHANNEL */}
            <div className="flex flex-col gap-1.5 w-full sm:w-48">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Purchase Channel
              </span>
              <Select
                value={selectedChannelId}
                onValueChange={(value) => {
                  setSelectedChannelId(value);
                  setPage(1); // Reset ke halaman 1 saat filter diubah
                }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Channels</SelectItem>
                  {purchaseChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

      <Link href="/super-admin/orders/add?type=SALES" className=" items-end">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Sales Order
        </Button>
      </Link>
      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-2">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-30">Order Date</TableHead>
                  <TableHead className="min-w-37.5">SO Number</TableHead>
                  <TableHead className="min-w-37.5">Customer Name</TableHead>
                  <TableHead className="min-w-37.5">PIC Customer</TableHead>
                  <TableHead className="min-w-37.5">Status</TableHead>
                  <TableHead className="min-w-37.5">PO Customer</TableHead>
                  <TableHead className="text-right min-w-37.5">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center min-w-20">Items</TableHead>
                  <TableHead className="min-w-37.5">Sales Rep</TableHead>
                  <TableHead className="min-w-37.5">Sample Ref</TableHead>
                  <TableHead className="min-w-37.5">Quotation Ref</TableHead>
                  <TableHead className="min-w-37.5">Send to Cust</TableHead>
                  <TableHead className="min-w-37.5">Arrival in Cust</TableHead>
                  <TableHead className="min-w-50">Shipping Address</TableHead>
                  <TableHead className="min-w-37.5">Remarks</TableHead>
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
                        {order.orderNumber}
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
                        className="text-sm text-gray-600 max-w-50 truncate"
                        title={order.shippingAddress}>
                        {order.shippingAddress}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-37.5 truncate"
                        title={order.remark}>
                        {order.remark}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* ACTION: GENERATE INVOICE */}
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={() =>
                                setSelectedInvoiceOrderId(order.id)
                              }>
                              <FileText className="mr-2 h-4 w-4 text-green-600" />
                              <span>Generate Invoice</span>
                            </DropdownMenuItem>

                            {/* ACTION: DETAIL */}
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer">
                              <Link
                                href={`/super-admin/orders/detail/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Detail</span>
                              </Link>
                            </DropdownMenuItem>

                            {/* ACTION: EDIT */}
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer">
                              <Link
                                href={`/super-admin/orders/edit/${order.id}`}>
                                <Pencil className="mr-2 h-4 w-4 text-orange-600" />
                                <span>Edit</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* ACTION: DELETE */}
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                              onSelect={() => setDeleteId(order.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
