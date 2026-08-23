"use client";

import { ArrowLeft, Factory, PlaneLanding, PlaneTakeoff } from "lucide-react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import ProductionTab from "./productionTab";
import ShipmentManager from "./shipmentManager";

export default function LogisticsTrackingDetail() {
  const { fetchApi, status } = useApi();
  const { orderId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [order, setOrder] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);

  // ✨ PERBAIKAN 1: Tambahkan state ini agar skeleton hanya muncul di awal
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const activeTab = searchParams.get("tab") || "production";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", value);
    // Mengubah URL tanpa membuat halaman melompat ke atas
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  // ✨ PERBAIKAN 2: Sesuaikan fungsi loadData
  // Kita tambahkan parameter 'isBackgroundUpdate' agar kita bisa mengambil data
  // tanpa memunculkan loading layar penuh secara mengganggu.
  const loadData = async (isBackgroundUpdate = false) => {
    if (status !== "authenticated" || !orderId) return;

    try {
      // Jika ini bukan update latar belakang, baru nyalakan loading
      if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const [orderRes, vendorRes] = await Promise.all([
        fetchApi(`/orders/${orderId}/tracking`),
        fetchApi(`/vendors/by-order/${orderId}`),
      ]);

      if (!orderRes.ok || !vendorRes.ok)
        throw new Error("Gagal mengambil data");

      const result = await orderRes.json();
      const vData = await vendorRes.json();

      setOrder(result.data);
      setVendors(vData.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data tracking");
    } finally {
      setLoading(false);
      setIsInitialLoading(false); // Tandai bahwa loading pertama sudah selesai
    }
  };

  useEffect(() => {
    loadData(false); // Memuat data untuk pertama kalinya
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, status]);

  // ✨ PERBAIKAN 3: Ubah kondisi render Skeleton
  // Skeleton hanya muncul jika loading bernilai true DAN ini adalah loading pertama
  if (loading && isInitialLoading) {
    return (
      <div className="space-y-6 mx-auto pb-20">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-62.5" />
            <Skeleton className="h-4 w-87.5" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-22.5 w-full rounded-lg" />
          ))}
        </div>
        <div className="space-y-6 mt-6">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-75 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return <div>Order not found</div>;

  const productionVendors = vendors.filter((v) => v.type === "PRODUCT");
  const logisticVendors = vendors.filter((v) => v.type === "SERVICE");

  return (
    <div className="space-y-6 mx-auto pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Tracking: {order.poNumber}
            <Badge variant="outline">
              {order.client?.b2b?.companyName || order.client?.b2c?.name}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola status produksi dan pengiriman (Inbound/Outbound).
          </p>
        </div>
      </div>

      <Separator />

      {/* DURATION SUMMARY (Tetap sama seperti aslinya) */}
      {order.durationSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Produksi",
              days: order.durationSummary.production.days,
              isComplete: order.durationSummary.production.isComplete,
              color: "text-orange-600",
              bg: "bg-orange-50 border-orange-100",
            },
            {
              label: "Inbound",
              days: order.durationSummary.inbound.days,
              isComplete: order.durationSummary.inbound.isComplete,
              color: "text-blue-600",
              bg: "bg-blue-50 border-blue-100",
            },
            {
              label: "Outbound",
              days: order.durationSummary.outbound.days,
              isComplete: order.durationSummary.outbound.isComplete,
              color: "text-green-600",
              bg: "bg-green-50 border-green-100",
            },
            {
              label: "Total Durasi",
              days: order.durationSummary.total.days,
              isComplete: order.durationSummary.total.isComplete,
              color: "text-purple-600",
              bg: "bg-purple-50 border-purple-100",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-3 ${item.bg} flex flex-col gap-1`}>
              <span className="text-xs text-muted-foreground font-medium">
                {item.label}
              </span>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${item.color}`}>
                  {item.days > 0 ? item.days : "-"}
                </span>
                {item.days > 0 && (
                  <span className="text-xs text-muted-foreground mb-0.5">
                    hari
                  </span>
                )}
              </div>
              <span className="text-[10px]">
                {item.isComplete ? (
                  <span className="text-green-600 font-medium">✓ Selesai</span>
                ) : item.days > 0 ? (
                  <span className="text-orange-500">⏳ On Progress</span>
                ) : (
                  <span className="text-gray-400">Belum dimulai</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MAIN TABS */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="production" className="flex gap-2">
            <Factory className="h-4 w-4" /> Produksi
          </TabsTrigger>
          <TabsTrigger value="inbound" className="flex gap-2">
            <PlaneLanding className="h-4 w-4" /> Inbound (Masuk)
          </TabsTrigger>
          <TabsTrigger value="outbound" className="flex gap-2">
            <PlaneTakeoff className="h-4 w-4" /> Outbound (Keluar)
          </TabsTrigger>
        </TabsList>

        {/* 
          ✨ PERBAIKAN 4: Menggunakan div dengan class "block" dan "hidden" 
          Alih-alih menggunakan <TabsContent>, kita menggunakan div HTML murni. 
          Ini memastikan komponen tidak dihapus dari memori saat tab lain diklik!
        */}
        <div className="mt-6">
          <div className={activeTab === "production" ? "block" : "hidden"}>
            <ProductionTab
              orderId={order.id}
              products={order.products}
              vendors={productionVendors}
              onUpdate={() => loadData(true)} // Kirim true agar update berjalan diam-diam
            />
          </div>

          <div className={activeTab === "inbound" ? "block" : "hidden"}>
            <ShipmentManager
              type="INBOUND"
              orderId={order.id}
              orderInfo={order}
              shipments={
                order.shipments?.filter((s: any) => s.type === "INBOUND") || []
              }
              products={order.products}
              couriers={logisticVendors}
              allVendors={vendors}
              onUpdate={() => loadData(true)}
            />
          </div>

          <div className={activeTab === "outbound" ? "block" : "hidden"}>
            <ShipmentManager
              type="OUTBOUND"
              orderId={order.id}
              orderInfo={order}
              shipments={
                order.shipments?.filter((s: any) => s.type === "OUTBOUND") || []
              }
              products={order.products}
              couriers={logisticVendors}
              allVendors={vendors}
              onUpdate={() => loadData(true)}
            />
          </div>
        </div>
      </Tabs>
    </div>
  );
}
