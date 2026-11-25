"use client";

import { useApi } from "@/hooks/useApi";

import { FileText, Loader2 } from "lucide-react";

import { useEffect, useState } from "react";
import QuotationFilter, {
  QuotationFilterValues,
} from "../ quotation-analytic/quotationFilter";
import QuotationMetrics, {
  QuotationMetricsData,
} from "../ quotation-analytic/quotationMetrics";

interface QuotationAnalyticsData {
  metrics: QuotationMetricsData;

  period: {
    start: string;
    end: string;
  };

  generatedAt: string;
}

const DEFAULT_FILTER: QuotationFilterValues = {
  range: "30days",
  startDate: "",
  endDate: "",
};

export default function QuotationAnalyticTab() {
  const { fetchApi, status } = useApi();

  // ==========================================
  // FILTER STATE
  // ==========================================
  const [filter, setFilter] = useState<QuotationFilterValues>({
    ...DEFAULT_FILTER,
  });

  const [appliedFilter, setAppliedFilter] = useState<QuotationFilterValues>({
    ...DEFAULT_FILTER,
  });

  // ==========================================
  // DATA STATE
  // ==========================================
  const [data, setData] = useState<QuotationAnalyticsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [filterError, setFilterError] = useState<string | null>(null);

  // ==========================================
  // FETCH QUOTATION ANALYTICS
  // ==========================================
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    const controller = new AbortController();

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          range: appliedFilter.range,
        });

        if (appliedFilter.range === "custom") {
          params.set("startDate", appliedFilter.startDate);

          params.set("endDate", appliedFilter.endDate);
        }

        const response = await fetchApi(
          `/analytics/quotations?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(
            result?.message || "Gagal memuat Quotation Analytics.",
          );
        }

        if (!cancelled) {
          setData(result.data);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Quotation analytics error:", error);

        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [appliedFilter, fetchApi, status]);

  // ==========================================
  // APPLY FILTER
  // ==========================================
  const handleApplyFilter = () => {
    setFilterError(null);

    if (filter.range === "custom") {
      if (!filter.startDate || !filter.endDate) {
        setFilterError("Start Date dan End Date wajib diisi.");

        return;
      }

      if (filter.startDate > filter.endDate) {
        setFilterError("Start Date tidak boleh melebihi End Date.");

        return;
      }

      const rangeDays =
        (new Date(filter.endDate).getTime() -
          new Date(filter.startDate).getTime()) /
        (1000 * 60 * 60 * 24);

      if (rangeDays > 366) {
        setFilterError("Custom range maksimal 366 hari.");

        return;
      }
    }

    setAppliedFilter({
      ...filter,
    });
  };

  return (
    <div className="mt-6 space-y-6 pb-10 animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/50">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Quotation Analytics
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor quotation performance, lead time, and order conversion.
          </p>
        </div>
      </div>

      {/* GLOBAL FILTER */}
      <QuotationFilter
        value={filter}
        onChange={setFilter}
        onApply={handleApplyFilter}
        isLoading={isLoading}
      />

      {/* FILTER ERROR */}
      {filterError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {filterError}
        </div>
      )}

      {/* API ERROR */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* LOADING */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm">Memuat Quotation Analytics...</p>
        </div>
      ) : (
        !error && data && <QuotationMetrics data={data.metrics} />
      )}
    </div>
  );
}
