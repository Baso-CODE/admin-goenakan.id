"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle, Clock, Eye, History, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

type SampleHistory = {
  id: string;
  orderId: string;
  date: string;
  status: string;
  notes: string;
  orderNumber: string;
  clientName: string;
  productName: string;
  productSku: string;
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
    case "ORDER_SAMPLE_CREATE":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "SENDING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "RECEIVE":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "RETURNED":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

export default function TableSampleHistory() {
  const { fetchApi, status } = useApi();

  const [histories, setHistories] = useState<SampleHistory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // State untuk Modal Konfirmasi Return
  const [selectedOrderIdForReturn, setSelectedOrderIdForReturn] = useState<
    string | null
  >(null);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const fetchHistory = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedStatus && selectedStatus !== "ALL") {
        params.append("status", selectedStatus);
      }

      const res = await fetchApi(`/sample-history?${params}`);

      if (!res.ok) {
        throw new Error("Failed to fetch sample history");
      }

      const result = await res.json();
      setHistories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data riwayat sampel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, debouncedSearch, selectedStatus, status, fetchApi]);

  // Handler untuk Trigger Tombol "Return" setelah dikonfirmasi via Modal
  const confirmMarkReturned = async () => {
    if (!selectedOrderIdForReturn) return;

    setIsUpdating(true);
    try {
      const response = await fetchApi(
        `/sample-history/${selectedOrderIdForReturn}/return`,
        {
          method: "POST",
          body: JSON.stringify({
            notes:
              "Barang sampel telah dikembalikan dan diverifikasi oleh Admin",
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal mengubah status");
      }

      toast.success("Status sampel berhasil diubah menjadi RETURNED!");
      setSelectedOrderIdForReturn(null);
      setPage(1);
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden mx-auto pb-10 mt-6">
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Sample History Tracking
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Lacak pergerakan barang sampel dari Gudang ke Klien.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter Status */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setPage(1);
              }}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="ORDER_SAMPLE_CREATE">Created</SelectItem>
                <SelectItem value="SENDING">Sending (In Transit)</SelectItem>
                <SelectItem value="RECEIVE">Receive (At Client)</SelectItem>
                <SelectItem value="RETURNED">
                  Returned (At Warehouse)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari SO / Klien / Produk..."
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

      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-2">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Tanggal Activity</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : histories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground">
                      Tidak ada riwayat sampel yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  histories.map((history) => (
                    <TableRow key={history.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {format(
                            new Date(history.date),
                            "dd MMM yyyy, HH:mm",
                            {
                              locale: idLocale,
                            },
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-primary">
                        {history.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {history.clientName}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-800">
                        {history.productName}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {history.productSku}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px] uppercase tracking-wider",
                            getStatusColor(history.status),
                          )}
                          variant="outline">
                          {history.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-600 max-w-64 truncate"
                        title={history.notes}>
                        {history.notes}
                      </TableCell>
                      <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol Lihat Detail */}
                          <Link
                            href={`/super-admin/sample-history/${history.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Lihat Detail">
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </Link>

                          {/* Tombol Interaktif Mark Returned */}
                          {history.status === "RECEIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-green-500 text-green-600 hover:bg-green-50 cursor-pointer"
                              disabled={isUpdating || !history.orderId}
                              onClick={() =>
                                setSelectedOrderIdForReturn(history.orderId)
                              }>
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Mark Returned
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic px-2">
                              {history.status === "RETURNED"
                                ? "Completed"
                                : "Waiting"}
                            </span>
                          )}
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
            Menampilkan Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{Math.ceil(meta.total / meta.perPage)}</strong> (
            {meta.total} total riwayat)
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

      {/* Modal Konfirmasi Return (AlertDialog) */}
      <AlertDialog
        open={Boolean(selectedOrderIdForReturn)}
        onOpenChange={(open) => !open && setSelectedOrderIdForReturn(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengembalian Sampel</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin bahwa barang sampel ini sudah benar-benar
              dikembalikan ke gudang? Tindakan ini akan memperbarui status
              pesanan menjadi selesai (Completed).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmMarkReturned();
              }}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white">
              {isUpdating ? "Memproses..." : "Ya, Tandai Dikembalikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
