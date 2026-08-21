"use client";

import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  CalendarIcon,
  Eye,
  FileDown,
  FileText,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { InvoiceDialogWrapper } from "./helper/invoiceDialogWrapper";
// import InvoiceDialogWrapper from "./InvoiceDialogWrapper";

// === TYPES ===
type CombinedOrder = {
  id: string;
  type: "ORDER" | "REPLACEMENT";
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
  salesCategory: string;
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
    case "REPLACEMENT":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function TableCombinedOrder() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [orders, setOrders] = useState<CombinedOrder[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState<
    string | null
  >(null);

  // === FETCH ORDERS ===
  const fetchOrders = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch && debouncedSearch[0])
        params.append("search", debouncedSearch[0]);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetchApi(`/orders/combined?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch combined orders");
      }

      const result = await res.json();
      console.log("ini adlah result", result);

      setOrders(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data order gabungan");
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
    // Bisa disesuaikan nanti jika ada endpoint export khusus combined
    toast.info("Fitur export untuk tabel gabungan sedang disiapkan!");
  };

  // === HANDLER DELETE ===
  const handleDelete = async () => {
    // Karena bisa berupa order atau replacement, pastikan endpoint delete mendukung ini nanti
    toast.info("Fitur delete dari tabel gabungan sedang disiapkan!");
  };

  // === RENDER ===
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-slate-800 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Layers className="h-6 w-6 text-slate-800" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                All Orders (Combined)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Master view untuk Sales Orders, Sample, dan Replacement.
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

      <div className="flex gap-2">
        {/* Tombol 1: New Order (SALES) */}
        <Link href="/super-admin/orders/add?type=SALES">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>

        {/* Tombol 2: New Sample (SAMPLE) - Ini yang baru kita tambahkan */}
        <Link href="/super-admin/orders/add?type=SAMPLE">
          <Button
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Plus className="mr-2 h-4 w-4" /> New Sample
          </Button>
        </Link>

        {/* Tombol 3: New Replacement */}
        <Link href="/super-admin/replacement-orders/add">
          <Button
            variant="secondary"
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200">
            <Plus className="mr-2 h-4 w-4" /> New Replacement
          </Button>
        </Link>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-2">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-30">Type</TableHead>
                  <TableHead className="min-w-30">Date</TableHead>
                  <TableHead className="min-w-37.5">Number</TableHead>
                  <TableHead className="min-w-37.5">Customer Name</TableHead>
                  <TableHead className="min-w-37.5">Status</TableHead>
                  <TableHead className="min-w-37.5">PO Customer</TableHead>
                  <TableHead className="text-right min-w-37.5">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center min-w-20">Items</TableHead>
                  <TableHead className="min-w-37.5">Sales Rep</TableHead>

                  {/* ✨ KOLOM YANG SEBELUMNYA DIHILANGKAN KINI DIKEMBALIKAN */}
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
                      {/* Sesuaikan jumlah skeleton dengan jumlah kolom (19 kolom + 1 action) */}
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
                  orders.map((order) => {
                    const isReplacement = order.type === "REPLACEMENT";

                    return (
                      <TableRow key={order.id} className="hover:bg-muted/5">
                        {/* BADGE TIPE DATA */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider",
                              isReplacement
                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                : order.salesCategory === "SAMPLE"
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200",
                            )}>
                            {isReplacement
                              ? "REPLACEMENT"
                              : order.salesCategory}
                          </Badge>
                        </TableCell>

                        {/* DATE */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {format(new Date(order.orderDate), "dd MMM yy", {
                              locale: idLocale,
                            })}
                          </div>
                        </TableCell>

                        {/* NUMBER */}
                        <TableCell className="font-mono font-medium text-slate-800">
                          {order.orderNumber}
                        </TableCell>

                        {/* CUSTOMER & PIC */}
                        <TableCell className="font-medium text-gray-700">
                          {order.customerName}
                          <br />
                          <span className="text-xs font-normal text-muted-foreground">
                            PIC: {order.picCustomer}
                          </span>
                        </TableCell>

                        {/* STATUS */}
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

                        {/* PO CUSTOMER */}
                        <TableCell className="text-sm font-mono text-gray-500">
                          {order.clientPoNumber}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-gray-900">
                          {isReplacement ? (
                            <div className="flex flex-col items-end justify-center py-1">
                              <span className="text-gray-400 font-normal italic text-[10px] mb-0.5">
                                Free/Retur
                              </span>
                              <span className="text-xs font-medium text-gray-600">
                                {formatCurrency(0, order.currencyCode || "IDR")}
                              </span>
                            </div>
                          ) : (
                            formatCurrency(
                              order.totalAmount,
                              order.currencyCode || "IDR",
                            )
                          )}
                        </TableCell>

                        {/* ITEMS & SALES REP */}
                        <TableCell className="text-center font-medium">
                          {order.totalItems}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {order.salesName}
                        </TableCell>

                        {/* DATA TAMBAHAN YANG DIKEMBALIKAN */}
                        <TableCell className="text-sm font-mono text-gray-500">
                          {order.sampleReference}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-500">
                          {order.quotationReference}
                        </TableCell>

                        <TableCell className="text-sm text-gray-500">
                          {order.sendToCustDate
                            ? format(
                                new Date(order.sendToCustDate),
                                "dd MMM yy",
                              )
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
                          {format(
                            new Date(order.createdTime),
                            "dd/MM/yy HH:mm",
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-gray-600">
                          {order.updatedBy}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {format(
                            new Date(order.updatedTime),
                            "dd/MM/yy HH:mm",
                          )}
                        </TableCell>

                        {/* ACTIONS */}
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

                              {!isReplacement && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onSelect={() =>
                                    setSelectedInvoiceOrderId(order.id)
                                  }>
                                  <FileText className="mr-2 h-4 w-4 text-green-600" />
                                  <span>Generate Invoice</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer">
                                <Link
                                  href={
                                    isReplacement
                                      ? `/super-admin/replacement-orders/detail/${order.id}`
                                      : `/super-admin/orders/detail/${order.id}`
                                  }>
                                  <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                  <span>Detail</span>
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer">
                                <Link
                                  href={
                                    isReplacement
                                      ? `/super-admin/replacement-orders/edit/${order.id}`
                                      : `/super-admin/orders/edit/${order.id}`
                                  }>
                                  <Pencil className="mr-2 h-4 w-4 text-orange-600" />
                                  <span>Edit</span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            {meta.total} items)
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
