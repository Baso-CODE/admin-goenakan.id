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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiUrl } from "@/helper/apiurl";
import ProductionTab from "./productionTab";
import ShipmentManager from "./shipmentManager";

export default function LogisticsTrackingDetail() {
  const { orderId } = useParams();
  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [order, setOrder] = useState<any>(null);

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get("tab") || "production";

  // 2. FUNGSI GANTI TAB (Update URL tanpa reload)
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", value);
    router.replace(`${pathname}?${newParams.toString()}`);
  };

  // FETCH DATA
  const loadData = async () => {
    try {
      setLoading(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const headers = { Authorization: `Bearer ${token}` };

      const orderRes = await fetch(`${apiUrl}/orders/${orderId}/tracking`, {
        headers,
      });
      const result = await orderRes.json();
      setOrder(result.data);

      const vendorRes = await fetch(`${apiUrl}/vendors/by-order/${orderId}`, {
        headers,
      });
      const vData = await vendorRes.json();
      setVendors(vData.data || []);
    } catch (error) {
      toast.error("Gagal memuat data tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadData();
  }, [orderId]);

  if (loading) return <div>Loading Tracking Data...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6  mx-auto pb-20">
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

        {/* TAB 1: PRODUCTION */}
        <TabsContent value="production" className="mt-6">
          <ProductionTab
            orderId={order.id}
            products={order.products}
            vendors={vendors}
            onUpdate={loadData}
          />
        </TabsContent>

        {/* TAB 2: INBOUND (Pabrik -> Gudang -> HO) */}
        <TabsContent value="inbound" className="mt-6">
          <ShipmentManager
            type="INBOUND"
            orderId={order.id}
            shipments={
              order.shipments?.filter((s: any) => s.type === "INBOUND") || []
            }
            products={order.products}
            couriers={vendors}
            onUpdate={loadData}
          />
        </TabsContent>

        {/* TAB 3: OUTBOUND (HO -> Client) */}
        <TabsContent value="outbound" className="mt-6">
          <ShipmentManager
            type="OUTBOUND"
            orderId={order.id}
            shipments={
              order.shipments?.filter((s: any) => s.type === "OUTBOUND") || []
            }
            products={order.products}
            couriers={vendors}
            onUpdate={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
