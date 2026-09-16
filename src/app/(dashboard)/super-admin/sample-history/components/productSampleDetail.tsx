"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Box,
  Building2,
  Clock,
  Package,
  Truck,
  UserCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

// =====================================================================
// DEFINISI TIPE DATA (Sesuai dengan return dari Backend)
// =====================================================================
type ProductDetail = {
  id: string;
  name: string;
  sku: string;
};

type SummaryData = {
  atWarehouse: number;
  sending: number;
  atClient: number;
};

type HistoryData = {
  id: string;
  date: string;
  status: string;
  notes: string;
  orderNumber: string;
  clientName: string;
};

type SampleDetailResponse = {
  product: ProductDetail;
  summary: SummaryData;
  history: HistoryData[];
};

// Fungsi helper untuk warna status
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

export default function ProductSampleDetail() {
  const params = useParams();
  const router = useRouter();
  const { fetchApi, status } = useApi();

  const productId = params?.id as string;

  const [data, setData] = useState<SampleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (status !== "authenticated" || !productId) return;

      setLoading(true);
      try {
        // Memanggil endpoint detail SKU
        const res = await fetchApi(`/sample-history/products/${productId}`);

        if (!res.ok) {
          throw new Error("Gagal mengambil detail produk");
        }

        const result = await res.json();
        setData(result.data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat detail riwayat sampel produk ini.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [productId, status, fetchApi]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full mt-6" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Box className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-gray-700">
          Data Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-6">
          Produk sampel ini tidak ada atau telah dihapus.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <main className="space-y-6  min-h-auto w-full">
      {/* 1. HEADER HALAMAN & PROFIL PRODUK */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="w-fit pl-0 hover:bg-transparent hover:text-primary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Produk
        </Button>

        <div className="flex items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div className="p-4 bg-primary/10 rounded-xl">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {data.product.name}
            </h1>
            <p className="text-sm font-mono text-gray-500 mt-1">
              SKU: {data.product.sku}
            </p>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY (RINGKASAN STATUS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Di Gudang (Returned)
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.summary.atWarehouse}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sampel telah dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dalam Pengiriman (Sending)
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.summary.sending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang menuju klien
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Di Tangan Klien (Receive)
            </CardTitle>
            <UserCheck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.summary.atClient}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang dipinjam klien
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABEL HISTORY KHUSUS SKU INI */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Pergerakan Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md border-t overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Tanggal Activity</TableHead>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground">
                      Belum ada riwayat pergerakan untuk produk sampel ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.history.map((history) => (
                    <TableRow key={history.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {format(
                            new Date(history.date),
                            "dd MMM yyyy, HH:mm",
                            { locale: idLocale },
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-primary">
                        {history.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {history.clientName}
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
                        className="text-sm text-gray-600 max-w-xs truncate"
                        title={history.notes}>
                        {history.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
