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
  ShoppingCart,
} from "lucide-react";
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

// Custom Hook Debounce (Pastikan file ini ada)
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { cn } from "@/lib/utils";

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

export default function TableOrder() {
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
      const res = await fetch(`${apiUrl}/orders/all?${params}`, {
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
        exportFilters as Record<string, string>,
      ).toString();

      // Endpoint ini mengarah ke OrderController.exportOrders
      const response = await fetch(
        `${apiUrl}/orders/export/excel?${queryString}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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

  // === RENDER ===
  return (
    <div className="space-y-6 w-full mx-auto pb-10">
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
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO / Client..."
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
          {/* Filter Group */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter Sales Category */}
            <div className="flex flex-col gap-1.5 w-full sm:w-45">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </span>
              <Select
                value={salesCategory}
                onValueChange={(val) => {
                  setSalesCategory(val);
                  setPage(1);
                }}>
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
              {/* Start Date Picker */}
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
                        // Convert Date object to YYYY-MM-DD string
                        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                        setStartDate(dateStr);
                        setPage(1);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Picker */}
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

          {/* Export Button */}
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
                  <TableHead className="w-45">PO Number</TableHead>
                  <TableHead className="w-37.5">Date</TableHead>
                  <TableHead className="w-50">Client</TableHead>
                  <TableHead className="w-37.5">Sales Rep</TableHead>
                  <TableHead className="text-center w-25">Type</TableHead>
                  <TableHead className="text-center w-25">Items</TableHead>
                  <TableHead className="text-right w-45">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center w-37.5">Actions</TableHead>
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
                      className="h-24 text-center text-muted-foreground">
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
                          className="text-[10px] h-5 px-2">
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
                          {/* Optional Delete Button */}
                          {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
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
