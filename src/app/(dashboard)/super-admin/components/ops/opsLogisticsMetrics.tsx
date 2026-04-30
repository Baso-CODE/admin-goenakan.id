"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Hammer, PackageOpen, Send, Truck } from "lucide-react";

export default function OpsLogisticsMetrics() {
  // === DUMMY DATA ===
  const logisticsData = {
    production: "88,978.00",
    shipping: "88,978.00",
    packaging: "88,978.00",
    sendToCustomer: "88,978.00",
    complete: "88,978.00",
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
                {logisticsData.production}
              </p>
            </div>

            {/* 2. Shipping */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-blue-50 rounded-full">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">Shipping</h3>
              <p className="text-xl font-bold text-slate-800">
                {logisticsData.shipping}
              </p>
            </div>

            {/* 3. Packaging */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-amber-50 rounded-full">
                <PackageOpen className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">
                Packaging
              </h3>
              <p className="text-xl font-bold text-slate-800">
                {logisticsData.packaging}
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
                {logisticsData.sendToCustomer}
              </p>
            </div>

            {/* 5. Complete */}
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-50 transition-colors">
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500">Complete</h3>
              <p className="text-xl font-bold text-emerald-600">
                {logisticsData.complete}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
