"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, Timer } from "lucide-react";

export interface LogisticsAveragesData {
  avgProductionDays: number | null;
  avgShippingDays: number | null;
  avgFulfillmentDays: number | null;
}

interface OpsLogisticsAveragesProps {
  data?: LogisticsAveragesData;
}

export default function OpsLogisticsAverages({
  data,
}: OpsLogisticsAveragesProps) {
  const safeData = data || {
    avgProductionDays: 0,
    avgShippingDays: 0,
    avgFulfillmentDays: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {/* 1. AVERAGE PRODUCTION */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Average Production
          </CardTitle>
          <Timer className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          {/* ✨ PERBAIKAN 3: Lindungi dari nilai null dari Backend (|| 0) sebelum toFixed */}
          <div className="text-2xl font-bold text-slate-800">
            {(safeData.avgProductionDays || 0).toFixed(1)} Hari
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rata-rata waktu produksi
          </p>
        </CardContent>
      </Card>

      {/* 2. AVERAGE SHIPPING */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Average Shipping
          </CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {(safeData.avgShippingDays || 0).toFixed(1)} Hari
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rata-rata waktu pengiriman (SLA)
          </p>
        </CardContent>
      </Card>

      {/* 3. AVERAGE ORDER FULFILLMENT */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Average Order Fulfillment
          </CardTitle>
          <CheckSquare className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {(safeData.avgFulfillmentDays || 0).toFixed(1)} Hari
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total waktu pemenuhan pesanan (Fulfillment)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
