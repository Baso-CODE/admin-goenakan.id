// app/super-admin/components/ops/opsQuotationSection.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  FileEdit,
  SendHorizontal,
  XCircle,
} from "lucide-react";

// ✨ PERBAIKAN 1: Sesuaikan nama properti dengan yang dikirim dari Backend & izinkan null
export interface QuotationMetricsData {
  draft: number | null;
  sent: number | null;
  accepted: number | null; // Sebelumnya 'accept'
  rejected: number | null; // Sebelumnya 'reject'
  avgLeadTimeDays: number | null; // Sebelumnya 'avgLeadTime'
}

interface OpsQuotationSectionProps {
  data?: QuotationMetricsData;
}

// ✨ Helper untuk format angka (memberi titik ribuan, aman dari null)
const formatNumber = (val: number | null) =>
  new Intl.NumberFormat("id-ID").format(val || 0);

export default function OpsQuotationSection({
  data,
}: OpsQuotationSectionProps) {
  // Fallback data jika API belum mengirimkan props
  const safeData = data || {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    avgLeadTimeDays: 0,
  };

  return (
    <div className="space-y-4 mt-8">
      {/* PEMBATAS SECTION C */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-foreground whitespace-nowrap">
          C. Quotation
        </h2>
        {/* bg-border menyesuaikan garis dengan light/dark mode */}
        <div className="h-px w-full bg-border"></div>
      </div>

      {/* ROW 1: 3 METRICS (Draft, Sent, Accept) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Draft */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
            <FileEdit className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {/* Menggunakan format angka */}
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.draft)}
            </div>
          </CardContent>
        </Card>

        {/* 2. Sent */}
        <Card className="shadow-sm border-blue-100 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent
            </CardTitle>
            <SendHorizontal className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {/* Menggunakan format angka */}
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.sent)}
            </div>
          </CardContent>
        </Card>

        {/* 3. Accept */}
        <Card className="shadow-sm border-emerald-100 dark:border-emerald-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accept
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {/* ✨ PERBAIKAN 2: Gunakan nama properti yang benar (accepted) */}
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.accepted)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: 2 METRICS (Reject, Average Lead Time) - Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 4. Reject */}
        <Card className="shadow-sm border-rose-100 dark:border-rose-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reject
            </CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {/* ✨ PERBAIKAN 3: Gunakan nama properti yang benar (rejected) */}
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(safeData.rejected)}
            </div>
          </CardContent>
        </Card>

        {/* 5. Average sending quotation lead time */}
        <Card className="shadow-sm border-amber-100 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground leading-tight">
              Average sending quotation lead time
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500 shrink-0 ml-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mt-1">
              {/* ✨ PERBAIKAN 4: Gunakan || 0 sebelum toFixed dan panggil nama properti yang benar */}
              <div className="text-2xl font-bold text-foreground">
                {(safeData.avgLeadTimeDays || 0).toFixed(1)}
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                hari
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
