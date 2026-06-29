"use client";

import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FlaskConical } from "lucide-react";

import OrderStats from "./components/orderStats";
import SampleStats from "./components/sampleStats";
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
            Kelola semua pesanan produksi dan sample dalam satu tempat.
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full min-w-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-100 grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Sales Orders
            </TabsTrigger>
            <TabsTrigger value="sample" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Sample Only
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="all"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            <OrderStats />
            <TableOrder />
          </div>
        </TabsContent>

        <TabsContent
          value="sample"
          className="mt-0 focus-visible:outline-none w-full min-w-0 max-w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 w-full min-w-0 max-w-full overflow-hidden">
            <SampleStats />
            <TableOrderSample />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
