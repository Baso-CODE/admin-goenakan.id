"use client";

import { ArrowLeft, Factory, PlaneLanding, PlaneTakeoff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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

  const [order, setOrder] = useState<any>(null);
  console.log("ini adalah data order", order);

  const [vendors, setVendors] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      // 2. Fetch Vendor (Product = Pabrik, Service = Kurir)
      const vProdRes = await fetch(`${apiUrl}/vendors?type=PRODUCT`, {
        headers,
      });
      const vServRes = await fetch(`${apiUrl}/vendors?type=SERVICE`, {
        headers,
      });

      const vProd = await vProdRes.json();
      const vServ = await vServRes.json();

      setVendors(vProd.data || []);
      setCouriers(vServ.data || []);
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

      {/* MAIN TABS */}
      <Tabs defaultValue="production" className="w-full">
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
            products={order.products} // Untuk logic partial shipment
            couriers={couriers}
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
            couriers={couriers}
            onUpdate={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
