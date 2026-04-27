"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function UtangPiutangCard() {
  const { fetchApi, status } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    try {
      setLoading(true);
      const res = await fetchApi("/finance/debt-receivables");

      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();
      setData(json.data || json);
    } catch (error) {
      console.error("Gagal load utang piutang", error);
    } finally {
      setLoading(false);
    }
  }, [status, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Loading State (NextAuth loading atau API loading)
  if (status === "loading" || loading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* CARD PIUTANG (Uang Masuk Tertunda) */}
      <Card className="shadow-sm border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Piutang (Receivables)
          </CardTitle>
          <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">
            {formatIDR(data?.receivables?.total || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dari {data?.receivables?.count} invoice yang belum lunas
            (Unpaid/Overdue).
          </p>
        </CardContent>
      </Card>

      {/* CARD UTANG (Uang Keluar Tertunda) */}
      <Card className="shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estimasi Utang Vendor (Payables)
          </CardTitle>
          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">
            {formatIDR(data?.payables?.total || 0)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
            <div className="flex justify-between">
              <span>Total Tagihan Vendor:</span>
              <span>{formatIDR(data?.payables?.estimatedBill || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sudah Dibayar:</span>
              <span>{formatIDR(data?.payables?.paidSoFar || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
