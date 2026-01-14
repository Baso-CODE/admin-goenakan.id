"use client";

import {
  ArrowRight,
  Container,
  Factory,
  FileText,
  Filter,
  Pencil,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
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
import { useDebounce } from "@/helper/debounce"; // Pastikan path ini benar

// === TYPES ===
type LogisticsData = {
  orderId: string;
  poNumber: string;
  clientName: string;
  waktuPenyelesaian: string; // "12 Hari"
  waktuProduksi: string; // "6 Hari"
  inboundTime: string; // "3 Hari"
  outboundTime: string; // "3 Hari"
  currentStatus: string; // "Inbound: OTW ke HO"
};

type Meta = {
  page: number;
  take: number;
  total: number;
  totalPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export default function LogisticTableAnalysist() {
  // === STATE ===
  const [data, setData] = useState<LogisticsData[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // === FETCH DATA ===
  const fetchData = async () => {
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

      // Endpoint sesuai Controller Analytics
      const res = await fetch(
        `http://localhost:8000/logistics/analytics/summary?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil data logistik");

      const result = await res.json();
      setData(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data logistik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, startDate, endDate]);

  // === HELPER: STATUS COLOR ===
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let variant = "outline";
    let className = "bg-gray-100 text-gray-600";

    if (s.includes("produksi")) {
      className = "bg-orange-100 text-orange-700 border-orange-200";
    } else if (s.includes("sampai") || s.includes("siap kirim")) {
      className = "bg-green-100 text-green-700 border-green-200";
    } else if (s.includes("otw") || s.includes("dispatched")) {
      className = "bg-blue-100 text-blue-700 border-blue-200";
    }

    return (
      <Badge variant="outline" className={`font-normal ${className}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header */}
      <Card className="border-l-4 border-l-indigo-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Logistics Tracking
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitor durasi produksi, inbound, dan outbound delivery.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari PO / Client..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 mr-2 h-9 bg-white px-3 border rounded-md shadow-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium">Filter Tanggal</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase px-1">
                Dari
              </span>
              <Input
                type="date"
                className="h-9 w-40 bg-white"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="h-px w-2 bg-gray-400 mt-4"></div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase px-1">
                Sampai
              </span>
              <Input
                type="date"
                className="h-9 w-40 bg-white"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-red-500 hover:text-red-700 h-9"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-45">PO Number</TableHead>
                  <TableHead className="w-50">Client</TableHead>
                  <TableHead className="w-62.5">Current Status</TableHead>

                  {/* Kolom Waktu dengan Icon */}
                  <TableHead className="text-center bg-orange-50/50">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <Factory className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-[10px] font-semibold text-orange-700 uppercase">
                        Produksi
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-blue-50/50">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <PlaneLanding className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] font-semibold text-blue-700 uppercase">
                        Inbound
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-green-50/50">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <PlaneTakeoff className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-[10px] font-semibold text-green-700 uppercase">
                        Outbound
                      </span>
                    </div>
                  </TableHead>

                  <TableHead className="text-center font-bold">
                    Total Waktu
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Container className="h-8 w-8 text-gray-300" />
                        <p>Tidak ada data logistik ditemukan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow
                      key={item.orderId}
                      className="hover:bg-muted/5 group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.poNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.clientName}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.currentStatus)}
                      </TableCell>

                      {/* Kolom Durasi */}
                      <TableCell className="text-center text-sm font-medium text-orange-700 bg-orange-50/30">
                        {item.waktuProduksi}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-blue-700 bg-blue-50/30">
                        {item.inboundTime}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-green-700 bg-green-50/30">
                        {item.outboundTime}
                      </TableCell>

                      <TableCell className="text-center font-bold text-gray-900 bg-gray-50/50">
                        {item.waktuPenyelesaian}
                      </TableCell>

                      <TableCell className="text-right">
                        {/* Tombol Edit / Pencil -> Ke Halaman Khusus Tracking */}
                        <Link
                          href={`/super-admin/logistics/track/${item.orderId}`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 mr-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                            <Pencil className="h-4 w-4" />{" "}
                            {/* Import Pencil dari lucide-react */}
                          </Button>
                        </Link>

                        {/* Tombol View -> Ke Detail Order (Optional, untuk cek invoice dll) */}
                        <Link
                          href={`/super-admin/orders/detail/${item.orderId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8">
                            <ArrowRight className="h-4 w-4 text-gray-500" />
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

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="text-xs text-muted-foreground">
            Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{meta.totalPage}</strong> • Total{" "}
            <strong>{meta.total}</strong> Order
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 text-xs">
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
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
