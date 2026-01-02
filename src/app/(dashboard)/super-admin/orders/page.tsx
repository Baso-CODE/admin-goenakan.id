"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  FileDown,
  Calendar as CalendarIcon,
  ReceiptText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Custom Hook Debounce (Pastikan file ini ada)
import { useDebounce } from "@/helper/debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// === TYPES ===
type Order = {
  id: string;
  poNumber: string;
  dateOrder: string;
  salesCategory: "SALES" | "SAMPLE";
  totalAmount: number;
  clientName: string;
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

// Interface untuk query params export
interface OrderExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
  salesCategory?: string;
}

// === UTILS ===
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrdersPage() {
  // === STATE ===
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [salesCategory, setSalesCategory] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<
    string | null
  >(null);
  const [invoiceCategory, setInvoiceCategory] = useState<string>(
    "FULL_PAYMENT"
  );
  const [invoiceDP, setInvoiceDP] = useState<number>(30); // Default DP 30%
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Handler Buka Modal
  const handleOpenInvoiceDialog = (orderId: string) => {
    setSelectedOrderForInvoice(orderId);
    setInvoiceCategory("FULL_PAYMENT");
    setInvoiceDP(30);
    setInvoiceDialogOpen(true);
  };

  // === FETCH ORDERS ===
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Get Token (Mocking auth logic)
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (salesCategory !== "ALL")
        params.append("salesCategory", salesCategory);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // 3. Fetch API
      // Endpoint ini mengarah ke OrderController.getAllOrders
      const res = await fetch(`http://localhost:8000/orders/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

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

  // Effect: Fetch on filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, salesCategory, startDate, endDate]);

  // === HANDLER EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const exportFilters: OrderExportQuery = {};
      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (salesCategory !== "ALL") exportFilters.salesCategory = salesCategory;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>
      ).toString();

      // Endpoint ini mengarah ke OrderController.exportOrders
      const response = await fetch(
        `http://localhost:8000/orders/export/excel?${queryString}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      // Download Blob Logic
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

  const handleCreateInvoice = async () => {
    if (!selectedOrderForInvoice) return;

    setIsCreatingInvoice(true);
    try {
      // 1. Get Token
      // (Gunakan helper fetchWithTokenNew atau getSession logic yang sudah diperbaiki)
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Siapkan Payload
      const payload: any = {
        orderId: selectedOrderForInvoice,
        category: invoiceCategory,
        status: "UNPAID",
      };

      if (invoiceCategory === "DP") {
        payload.dpPercentage = Number(invoiceDP);
      }

      // 3. Call API
      const res = await fetch("http://localhost:8000/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal membuat invoice");
      }

      toast.success("Invoice berhasil dibuat!");
      setInvoiceDialogOpen(false);

      // Opsional: Redirect ke halaman detail invoice atau refresh list order
      // router.push("/super-admin/invoices");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Order Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage, track, and export your orders efficiently.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter: Search */}
            <div className="relative w-full md:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO / Client..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset page on search
                }}
              />
            </div>

            {/* Link to Create Order */}
            <Link href="/super-admin/orders/create">
              <Button className="w-full md:w-auto shadow-sm hover:shadow-md transition-all">
                + Create Order
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Filter & Export Bar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          {/* Filter Group */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter Sales Category */}
            <div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </span>
              <Select
                value={salesCategory}
                onValueChange={(val) => {
                  setSalesCategory(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="SAMPLE">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Date Range */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Start Date
                </span>
                <div className="relative">
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
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  End Date
                </span>
                <div className="relative">
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
            </div>
          </div>

          {/* Export Button */}
          <Button
            variant="outline"
            className="w-full lg:w-auto border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
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
                  <TableHead className="w-[180px]">PO Number</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead className="w-[150px]">Sales Rep</TableHead>
                  <TableHead className="text-center w-[100px]">Type</TableHead>
                  <TableHead className="text-center w-[100px]">Items</TableHead>
                  <TableHead className="text-right w-[180px]">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center w-[150px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton Loading Rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No orders found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/5">
                      <TableCell className="font-mono font-medium text-primary">
                        {order.poNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(order.dateOrder), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {order.clientName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.salesName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            order.salesCategory === "SAMPLE"
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px] h-5 px-2"
                        >
                          {order.salesCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {order.totalItems}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/super-admin/orders/detail/${order.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/super-admin/orders/edit/${order.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          {/* Optional Delete Button */}
                          {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Create Invoice"
                            onClick={() => handleOpenInvoiceDialog(order.id)}
                          >
                            <ReceiptText className="h-4 w-4" />
                          </Button>
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
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* === MODAL CREATE INVOICE === */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Buat invoice baru berdasarkan Order ini. Pilih jenis tagihan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Pilihan Kategori */}
            <div className="flex flex-col gap-2">
              <Label>Jenis Tagihan</Label>
              <Select
                value={invoiceCategory}
                onValueChange={setInvoiceCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_PAYMENT">
                    Full Payment (Lunas)
                  </SelectItem>
                  <SelectItem value="DP">Down Payment (DP)</SelectItem>
                  <SelectItem value="INSTALLMENT">Cicilan (Termin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Khusus DP */}
            {invoiceCategory === "DP" && (
              <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                <Label>Persentase DP (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={invoiceDP}
                    onChange={(e) => setInvoiceDP(Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nominal akan dihitung otomatis dari total order.
                </p>
              </div>
            )}

            {/* Input Khusus Cicilan (Jika mau manual input nominal) */}
            {/* Anda bisa tambahkan input 'customAmount' disini jika category === 'INSTALLMENT' */}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleCreateInvoice} disabled={isCreatingInvoice}>
              {isCreatingInvoice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Proses...
                </>
              ) : (
                "Buat Invoice"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
