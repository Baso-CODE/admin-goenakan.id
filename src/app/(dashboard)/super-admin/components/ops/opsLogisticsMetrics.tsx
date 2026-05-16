"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Hammer, PackageOpen, Send, Truck } from "lucide-react";

export interface LogisticsMetricsData {
  production: number;
  packaging: number;
  shipping: number;
  sendToCustomer: number;
  complete: number;
}

interface OpsLogisticsMetricsProps {
  data?: LogisticsMetricsData;
}

// Helper untuk format angka
const formatNumber = (val: number) =>
  new Intl.NumberFormat("id-ID").format(val || 0);

export default function OpsLogisticsMetrics({
  data,
}: OpsLogisticsMetricsProps) {
  // Fallback jika data belum ada
  const safeData = data || {
    production: 0,
    packaging: 0,
    shipping: 0,
    sendToCustomer: 0,
    complete: 0,
  };

  return (
    <div className="space-y-4">
      {/* PEMBATAS SECTION */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">
          A. Logistics
        </h2>
        <div className="h-px w-full bg-slate-200"></div>
      </div>

      {/* METRICS PIPELINE */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* 1. Production */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-slate-100 rounded-full">
                <Hammer className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">
                Production
              </h3>
              <p className="text-xl font-bold text-slate-800">
                {formatNumber(safeData.production)}
              </p>
            </div>

            {/* 2. Packaging (Diubah urutannya sesuai logika bisnis: Produksi -> Kemas -> Kirim) */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-amber-50 rounded-full">
                <PackageOpen className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">
                Packaging
              </h3>
              <p className="text-xl font-bold text-slate-800">
                {formatNumber(safeData.packaging)}
              </p>
            </div>

            {/* 3. Shipping */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-blue-50 rounded-full">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">Shipping</h3>
              <p className="text-xl font-bold text-slate-800">
                {formatNumber(safeData.shipping)}
              </p>
            </div>

            {/* 4. Send to Customer */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-purple-50 rounded-full">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">
                Send to customer
              </h3>
              <p className="text-xl font-bold text-slate-800">
                {formatNumber(safeData.sendToCustomer)}
              </p>
            </div>

            {/* 5. Complete */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">Complete</h3>
              <p className="text-xl font-bold text-emerald-600">
                {formatNumber(safeData.complete)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
