"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";

import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { useEffect, useState, type ReactNode } from "react";

// ==========================================
// CONFIGURATION
// ==========================================
export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "14days", label: "Last 14 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "1year", label: "Last 1 Year" },
  { value: "custom", label: "Custom Range" },
] as const;

export interface AnalyticsDateFilter {
  range: string;
  startDate: string;
  endDate: string;
}

export interface AnalyticsPeriodData {
  period: {
    start: string;
    end: string;
  };
}

const DEFAULT_FILTER: AnalyticsDateFilter = {
  range: "30days",
  startDate: "",
  endDate: "",
};

const DAY_MS = 86_400_000;

// ==========================================
// DATE HELPERS
// ==========================================
function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function getTodayWib(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function validateFilter(filter: AnalyticsDateFilter): string | null {
  if (filter.range !== "custom") {
    return null;
  }

  if (!filter.startDate || !filter.endDate) {
    return "Start Date dan End Date wajib diisi.";
  }

  if (filter.startDate > filter.endDate) {
    return "Start Date tidak boleh melebihi End Date.";
  }

  if (filter.endDate > getTodayWib()) {
    return "End Date tidak boleh melebihi hari ini.";
  }

  const duration =
    (Date.parse(filter.endDate) - Date.parse(filter.startDate)) / DAY_MS;

  if (!Number.isFinite(duration)) {
    return "Rentang tanggal tidak valid.";
  }

  if (duration > 366) {
    return "Custom range maksimal 366 hari.";
  }

  return null;
}

// ==========================================
// SHARED ANALYTICS HOOK
// ==========================================
export function useAnalyticsPeriod<T extends AnalyticsPeriodData>(
  endpoint: string,
) {
  const { fetchApi, status } = useApi();

  const [draft, setDraft] = useState<AnalyticsDateFilter>({
    ...DEFAULT_FILTER,
  });

  const [applied, setApplied] = useState<AnalyticsDateFilter>({
    ...DEFAULT_FILTER,
  });

  const [data, setData] = useState<T | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [filterError, setFilterError] = useState<string | null>(null);

  // ========================================
  // FETCH BASED ON APPLIED FILTER
  // ========================================
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let active = true;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const params = new URLSearchParams({
          range: applied.range,
        });

        if (applied.range === "custom") {
          params.set("startDate", applied.startDate);

          params.set("endDate", applied.endDate);
        }

        const response = await fetchApi(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (
          !response.ok ||
          !result?.success ||
          !result?.data ||
          !result.data.period?.start ||
          !result.data.period?.end
        ) {
          throw new Error(result?.message || "Gagal memuat data analytics.");
        }

        if (active) {
          setData(result.data as T);
        }
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [endpoint, applied, fetchApi, status]);

  // ========================================
  // APPLY FILTER
  // ========================================
  const applyFilter = () => {
    const validation = validateFilter(draft);

    setFilterError(validation);

    if (validation) return;

    setData(null);
    setLoading(true);
    setApplied({ ...draft });
  };

  // ========================================
  // RESET TO LAST 30 DAYS
  // ========================================
  const resetFilter = () => {
    setFilterError(null);
    setData(null);
    setLoading(true);

    setDraft({ ...DEFAULT_FILTER });
    setApplied({ ...DEFAULT_FILTER });
  };

  // ========================================
  // REFRESH CURRENT PERIOD
  // ========================================
  const refresh = () => {
    setData(null);
    setLoading(true);
    setApplied({ ...applied });
  };

  const isDirty =
    draft.range !== applied.range ||
    (draft.range === "custom" &&
      (draft.startDate !== applied.startDate ||
        draft.endDate !== applied.endDate));

  const activeLabel =
    DATE_RANGE_OPTIONS.find((option) => option.value === applied.range)
      ?.label || applied.range;

  return {
    draft,
    setDraft,
    applied,
    data,

    isLoading: status === "loading" || (status === "authenticated" && loading),

    error:
      status === "unauthenticated"
        ? "Sesi tidak tersedia. Silakan login kembali."
        : error,

    filterError,
    isDirty,
    activeLabel,
    applyFilter,
    resetFilter,
    refresh,
  };
}

// ==========================================
// SHARED FILTER & DATA PANEL
// ==========================================
interface AnalyticsPeriodFilterProps<T extends AnalyticsPeriodData> {
  state: ReturnType<typeof useAnalyticsPeriod<T>>;
  description?: string;
  emptyMessage?: string | null;
  children?: ReactNode;
}

export function AnalyticsPeriodFilter<T extends AnalyticsPeriodData>({
  state,
  description = "Filter ini memengaruhi seluruh metrik dan grafik di bawah.",
  emptyMessage,
  children,
}: AnalyticsPeriodFilterProps<T>) {
  const {
    draft,
    setDraft,
    data,
    isLoading,
    error,
    filterError,
    isDirty,
    activeLabel,
    applyFilter,
    resetFilter,
    refresh,
  } = state;

  return (
    <div className="min-w-0 space-y-5">
      {/* FILTER CONTAINER */}
      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
        {/* FILTER HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-background p-2.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <h3 className="text-sm font-semibold">Date Filter</h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={refresh}
            className="gap-2 text-muted-foreground">
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* FILTER CONTROLS */}
        <div className="flex flex-wrap items-end gap-3">
          {/* PERIOD */}
          <div className="w-full space-y-1.5 sm:w-[210px]">
            <label
              htmlFor="analytics-period"
              className="text-xs font-medium text-muted-foreground">
              Period
            </label>

            <Select
              value={draft.range}
              onValueChange={(range) =>
                setDraft((previous) => ({
                  ...previous,
                  range,
                }))
              }>
              <SelectTrigger
                id="analytics-period"
                className="w-full bg-background">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>

              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CUSTOM DATE */}
          {draft.range === "custom" && (
            <>
              <div className="w-full space-y-1.5 sm:w-[170px]">
                <label
                  htmlFor="analytics-start-date"
                  className="text-xs font-medium text-muted-foreground">
                  Start Date
                </label>

                <Input
                  id="analytics-start-date"
                  type="date"
                  value={draft.startDate}
                  max={draft.endDate || getTodayWib()}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      startDate: event.target.value,
                    }))
                  }
                  className="bg-background"
                />
              </div>

              <div className="w-full space-y-1.5 sm:w-[170px]">
                <label
                  htmlFor="analytics-end-date"
                  className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>

                <Input
                  id="analytics-end-date"
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  max={getTodayWib()}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      endDate: event.target.value,
                    }))
                  }
                  className="bg-background"
                />
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilter}
              disabled={isLoading}
              className="flex-1 gap-2 sm:flex-none">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>

            <Button
              type="button"
              onClick={applyFilter}
              disabled={isLoading}
              className="flex-1 gap-2 sm:flex-none">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply Filter
            </Button>
          </div>
        </div>

        {/* VALIDATION ERROR */}
        {filterError && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-4 w-4" />
            {filterError}
          </div>
        )}

        {/* ACTIVE PERIOD */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-xs font-medium">{activeLabel}</p>

              {data?.period && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(data.period.start)}
                  {" – "}
                  {formatDate(data.period.end)}
                  {" · WIB"}
                </p>
              )}
            </div>
          </div>

          {isDirty && (
            <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              Filter belum diterapkan
            </span>
          )}
        </div>
      </div>

      {/* API ERROR */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:bg-red-950/20">
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>

          <Button variant="outline" size="sm" onClick={refresh}>
            Try Again
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Memuat data analytics...</p>
        </div>
      )}

      {/* EMPTY STATE INFORMATION */}
      {!isLoading && !error && data && emptyMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20">
          <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{emptyMessage}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDraft({
                range: "90days",
                startDate: "",
                endDate: "",
              })
            }>
            Select Last 90 Days
          </Button>
        </div>
      )}

      {/* ANALYTICS CONTENT */}
      {!isLoading && !error && data && children}
    </div>
  );
}
