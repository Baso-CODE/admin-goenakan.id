"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Eye,
  FileDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ReplacementOrder = {
  id: string;
  replacementDate: string;
  replacementNumber: string;
  referenceOrderNumber: string;
  customerName: string;
  picCustomer: string | null;
  replacementReason: string;
  remarks: string;
  sendToCustDate: string | null;
  arrivalInCustDate: string | null;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  totalItems: number;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface ReplacementExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function TableReplacementOrder() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [replacements, setReplacements] = useState<ReplacementOrder[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // State untuk Hapus Data
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // === FETCH REPLACEMENT ORDERS ===
  const fetchReplacements = async () => {
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

      // Endpoint API mengarah ke router replacement-orders
      const res = await fetchApi(`/replacement-orders/all?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || "Failed to fetch replacement orders",
        );
      }

      const result = await res.json();
      setReplacements(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data Replacement Order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, startDate, endDate, status, fetchApi]);

  // === HANDLER EXPORT (Persiapan jika backend sudah ada endpoint export) ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: ReplacementExportQuery = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      if (debouncedSearch) exportFilters.search = debouncedSearch;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/replacement-orders/export/excel?${queryString}`,
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
          ?.match(/filename="(.+)"/)?.[1] || "replacement_orders_export.xlsx";

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
      toast.error(
        "Gagal melakukan export data. Pastikan endpoint export tersedia.",
      );
    } finally {
      setExporting(false);
    }
  };

  // === HANDLER DELETE ===
  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const response = await fetchApi(`/replacement-orders/${deleteId}`, {
        method: "DELETE", // Pastikan endpoint DELETE sudah dibuat di backend ya!
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus data");
      }

      toast.success("Data Replacement Order berhasil dihapus");
      setPage(1);
      fetchReplacements();
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
      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <RefreshCcw className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Replacement Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and track returned or replaced items for customers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RN/SO/Client..."
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

      <Link href="/super-admin/replacement-orders/add" className="items-end">
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Create Replacement Order
        </Button>
      </Link>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-2">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="min-w-30">Date</TableHead>
                  <TableHead className="min-w-37.5">RN Number</TableHead>
                  <TableHead className="min-w-37.5">SO Reference</TableHead>
                  <TableHead className="min-w-37.5">Customer Name</TableHead>
                  <TableHead className="min-w-37.5">PIC Customer</TableHead>
                  <TableHead className="min-w-37.5">Reason</TableHead>
                  <TableHead className="text-center min-w-20">Items</TableHead>
                  <TableHead className="min-w-37.5">Send to Cust</TableHead>
                  <TableHead className="min-w-37.5">Arrival in Cust</TableHead>
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
                      {Array.from({ length: 14 }).map((_, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : replacements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={15}
                      className="h-24 text-center text-muted-foreground">
                      No replacement orders found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  replacements.map((rep) => (
                    <TableRow key={rep.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(rep.replacementDate), "dd MMM yy", {
                            locale: idLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-orange-600">
                        {rep.replacementNumber}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600">
                        {rep.referenceOrderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {rep.customerName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {rep.picCustomer || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-red-600 font-medium">
                        {rep.replacementReason}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {rep.totalItems}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {rep.sendToCustDate
                          ? format(new Date(rep.sendToCustDate), "dd MMM yy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {rep.arrivalInCustDate
                          ? format(new Date(rep.arrivalInCustDate), "dd MMM yy")
                          : "-"}
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-37.5 truncate"
                        title={rep.remarks}>
                        {rep.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {rep.createdBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(rep.createdTime), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {rep.updatedBy}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {format(new Date(rep.updatedTime), "dd/MM/yy HH:mm")}
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

                            {/* ACTION: DETAIL */}
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer">
                              <Link
                                href={`/super-admin/replacement-orders/detail/${rep.id}`}>
                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Detail</span>
                              </Link>
                            </DropdownMenuItem>

                            {/* ACTION: EDIT */}
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer">
                              <Link
                                href={`/super-admin/replacement-orders/edit/${rep.id}`}>
                                <Pencil className="mr-2 h-4 w-4 text-orange-600" />
                                <span>Edit</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* ACTION: DELETE */}
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                              onSelect={() => setDeleteId(rep.id)}>
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
            <strong>{Math.ceil(meta.total / meta.perPage) || 1}</strong> (
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
