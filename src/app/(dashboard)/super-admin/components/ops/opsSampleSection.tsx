// app/super-admin/components/ops/opsSampleSection.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActivitySquare,
  CircleDollarSign,
  Info,
  PackageSearch,
  Percent,
  TrendingUp,
  UserCheck,
} from "lucide-react";

// ✨ UPDATE: Interface untuk Props dari API
export interface SampleMetricsData {
  totalSample: number;
  totalCost: number;
  convertedCustomer: number;
  conversionRate: number;
  returnOfSample: number;
  avgConversionRate: number;
}

interface OpsSampleSectionProps {
  data?: SampleMetricsData;
}

// ✨ Helper untuk format angka dan uang
const formatNumber = (val: number) =>
  new Intl.NumberFormat("id-ID").format(val || 0);
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val || 0);

export default function OpsSampleSection({ data }: OpsSampleSectionProps) {
  // Fallback data jika API belum mengirimkan props
  const safeData = data || {
    totalSample: 0,
    totalCost: 0,
    convertedCustomer: 0,
    conversionRate: 0,
    returnOfSample: 0,
    avgConversionRate: 0,
  };

  return (
    <div className="space-y-6 mt-8">
      {/* PEMBATAS SECTION B */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-foreground whitespace-nowrap">
          B. Sample
        </h2>
        {/* bg-border otomatis menyesuaikan garis dengan light/dark mode */}
        <div className="h-px w-full bg-border"></div>
      </div>

      {/* ROW 1: 3 METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Total Sample */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sample
            </CardTitle>
            <PackageSearch className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {/* ✨ Menggunakan format angka biasa */}
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.totalSample)}
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Cost Sample */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total cost sample
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {/* ✨ Menggunakan format mata uang IDR */}
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(safeData.totalCost)}
            </div>
          </CardContent>
        </Card>

        {/* 3. Converted Customer */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted Customer
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.convertedCustomer)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: 3 METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 4. Conversion Rate Sample */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate Sample
            </CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {/* ✨ Menggunakan toFixed(1) untuk menjamin 1 angka di belakang koma */}
            <div className="text-2xl font-bold text-foreground">
              {safeData.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* 5. Return of sample */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Return of sample
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(safeData.returnOfSample)}
            </div>
          </CardContent>
        </Card>

        {/* 6. Average conversion rate */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average conversion rate
            </CardTitle>
            <ActivitySquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {safeData.avgConversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NOTES AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Note 1 */}
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Conversion Timeframe
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Rerata waktu convert dihitung dari saat sample dikirimkan ke
                pelanggan hingga terjadi konversi (order).
              </p>
            </div>
          </div>
        </div>

        {/* Note 2 */}
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Customer Status
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Convert cust: Pemisahan data untuk melihat apakah pelanggan yang
                terkonversi adalah <strong>Customer Baru</strong> atau{" "}
                <strong>Customer Lama</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
