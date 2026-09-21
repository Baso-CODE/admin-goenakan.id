"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Building2, Clock, FileText, Package } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Tipe data untuk Detail Sample History
type SampleHistoryDetail = {
  id: string;
  date: string;
  status: string;
  notes: string;
  order: {
    id: string;
    orderNumber: string;
    dateOrder: string;
    status: string;
    shippingAddress: string;
  };
  client: {
    name: string;
    phone: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
  };
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

export default function SampleHistoryDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { fetchApi, status } = useApi();

  const [detail, setDetail] = useState<SampleHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (status !== "authenticated" || !id) return;

      setLoading(true);
      try {
        const res = await fetchApi(`/sample-history/${id}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil detail riwayat sampel");
        }
        const result = await res.json();
        setDetail(result.data);
      } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan saat memuat detail riwayat");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, status, fetchApi]);

  if (loading) {
    return (
      <div className="space-y-6 w-full mx-auto pb-10">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          Data riwayat sampel tidak ditemukan.
        </p>
        <Link href="/super-admin/sample-history">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Tombol Kembali */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/sample-history">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Detail Riwayat Sampel
          </h1>
          <p className="text-sm text-muted-foreground">
            Informasi lengkap pergerakan dan status peminjaman.
          </p>
        </div>
      </div>

      {/* Kartu Utama Status & Catatan */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Status Saat Ini</span>
            <Badge
              className={cn(
                "text-xs uppercase px-2.5 py-1",
                getStatusColor(detail.status),
              )}
              variant="outline">
              {detail.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Waktu Kejadian:</span>
              <strong className="text-foreground">
                {format(new Date(detail.date), "dd MMM yyyy, HH:mm", {
                  locale: idLocale,
                })}
              </strong>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span>Catatan:</span>
              <strong className="text-foreground">{detail.notes}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Informasi Pendukung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Produk */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informasi Produk
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Nama Produk</p>
              <p className="font-semibold text-gray-900">
                {detail.product.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SKU</p>
              <p className="font-mono text-sm text-gray-700">
                {detail.product.sku}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Klien */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informasi Klien
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Nama Perusahaan / Klien
              </p>
              <p className="font-semibold text-gray-900">
                {detail.client.name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="text-gray-700">{detail.client.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-gray-700">{detail.client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informasi Pesanan (Order) */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Referensi Pesanan (Order)
          </CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nomor Sample</p>
              <p className="font-mono font-medium text-primary">
                {detail.order.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Order</p>
              <p className="text-gray-700">
                {format(new Date(detail.order.dateOrder), "dd MMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status Order</p>
              <p className="font-medium text-gray-700">{detail.order.status}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alamat Pengiriman</p>
            <p className="text-gray-700 bg-slate-50 p-3 rounded border text-xs">
              {detail.order.shippingAddress}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
