"use client";

import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FlaskConical, Layers, RefreshCw } from "lucide-react";

import TableReplacementOrder from "../replacement-orders/components/tableReplacementOrder";
import OrderStats from "./components/orderStats";
import SampleStats from "./components/sampleStats";
import TableCombinedOrder from "./components/tableCombinedOrder";
import TableOrder from "./components/tableOrder";
import TableOrderSample from "./components/tableOrderSample";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "all";

  return (
    <div className="w-full min-w-0 max-w-[98vw] overflow-hidden mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua pesanan produksi, sample, dan replacement dalam satu
            tempat.
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full min-w-0">
        <div className="flex items-center justify-between mb-4">
          {/* ✨ UPDATE: Mengubah grid menjadi 4 kolom di layar besar, dan 2 kolom di layar kecil agar responsif */}
          <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent md:bg-muted p-1">
            <TabsTrigger value="all" className="flex items-center gap-2 py-2">
              <Layers className="h-4 w-4" />
              All Orders
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2 py-2">
              <ClipboardList className="h-4 w-4" />
              Sales Orders
            </TabsTrigger>
            <TabsTrigger
              value="sample"
              className="flex items-center gap-2 py-2">
              <FlaskConical className="h-4 w-4" />
              Sample Only
            </TabsTrigger>
            <TabsTrigger
              value="replacement"
              className="flex items-center gap-2 py-2">
              <RefreshCw className="h-4 w-4" />
              Replacement
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =========================================
            TAB 1: ALL (GABUNGAN SEMUA TABEL)
        ========================================= */}
        <TabsContent
          value="all"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            {/* Opsi: Jika kamu ingin tetap menampilkan kartu statistik di bagian atas tab All, kamu bisa membiarkan <OrderStats /> di sini. Jika tidak, baris ini bisa dihapus. */}
            {/* <OrderStats /> */}

            <TableCombinedOrder />
          </div>
        </TabsContent>

        {/* =========================================
            TAB 2: SALES ORDER SAJA
        ========================================= */}
        <TabsContent
          value="sales"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            <OrderStats />
            <TableOrder />
          </div>
        </TabsContent>

        {/* =========================================
            TAB 3: SAMPLE SAJA
        ========================================= */}
        <TabsContent
          value="sample"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            <SampleStats />
            <TableOrderSample />
          </div>
        </TabsContent>

        {/* =========================================
            TAB 4: REPLACEMENT SAJA
        ========================================= */}
        <TabsContent
          value="replacement"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            <TableReplacementOrder />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
