"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Package,
  Percent,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Metrics = {
  totalSamples: number;
  sampleCustomers: number;
  convertedSamples: number;
  unconvertedSamples: number;
  convertedCustomers: number;
  sampleConversionRate: number | null;
  customerConversionRate: number | null;
  totalLinkedSalesOrders: number;
  newConvertedCustomers: number;
  returningConvertedCustomers: number;
  averageConversionDays: number | null;
  conversionLeadTimeCount: number;
  totalSampleValue: number;
  totalSampleCost: number | null;
  convertedSalesValue: number;
  revenueToCostRatio: number | null;
  costPerConversion: number | null;
  sampleOrdersInCurrency: number;
  linkedSalesOrdersInCurrency: number;
  approvedCostSamples: number;
  costSamplesInCurrency: number;
  costCoverageRate: number | null;
  totalFollowUps: number;
  completedFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  followUpCompletionRate: number | null;
  samplesWithFollowUps: number;
  samplesWithCompletedFollowUps: number;
  samplesWithoutFollowUps: number;
  averageFollowUpsPerSample: number | null;
};
type Breakdown = { name: string; value: number };
type Detail = {
  id: string;
  orderNumber: string;
  dateOrder: string;
  status: string;
  customerName: string;
  salesName: string;
  salesUserId: string | null;
  sampleCurrency: string;
  sampleValue: number;
  sampleCost: number | null;
  costCurrency: string | null;
  costStatus: "APPROVED" | "DRAFT" | "MISSING" | "DUPLICATE";
  isConverted: boolean;
  linkedSalesOrderCount: number;
  linkedSalesValue: number;
  linkedSalesCurrency: string;
  firstSalesOrderId: string | null;
  firstSalesOrderNumber: string | null;
  firstConversionDate: string | null;
  conversionDays: number | null;
  totalFollowUps: number;
  completedFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
};
type AnalyticsData = {
  period: {
    start: string;
    end: string;
    generatedAt: string;
    granularity: "day" | "month";
  };
  filters: {
    currency: string;
    salesUserId: string | null;
    currencies: { code: string; name: string }[];
    salesUsers: { id: string; name: string; role: string | null }[];
  };
  metrics: Metrics;
  charts: {
    trend: {
      period: string;
      samples: number;
      convertedSamples: number;
      unconvertedSamples: number;
      conversionRate: number | null;
    }[];
    conversionBreakdown: Breakdown[];
    customerBreakdown: Breakdown[];
    followUpCoverage: Breakdown[];
  };
  salesPerformance: (Metrics & {
    salesUserId: string | null;
    salesName: string;
  })[];
  details: {
    items: Detail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
    };
  };
  dataQuality: {
    unassignedSamples: number;
    invalidConversionLinks: number;
    missingCashflow: number;
    draftCashflow: number;
    duplicateCashflow: number;
    approvedCashflowOtherCurrency: number;
    linkedSalesOtherCurrency: number;
  };
};
type Filter = {
  range: string;
  startDate: string;
  endDate: string;
  salesUserId: string;
  currency: string;
};
const INITIAL: Filter = {
  range: "30days",
  startDate: "",
  endDate: "",
  salesUserId: "all",
  currency: "IDR",
};
const RANGES = [
  ["today", "Today"],
  ["7days", "Last 7 Days"],
  ["14days", "Last 14 Days"],
  ["30days", "Last 30 Days"],
  ["90days", "Last 90 Days"],
  ["1year", "Last 1 Year"],
  ["custom", "Custom Range"],
];
const COLORS = ["#648e79", "#ad7f65"];
const count = (n: number) => new Intl.NumberFormat("id-ID").format(n);
const pct = (n: number | null) => (n === null ? "—" : `${n.toFixed(1)}%`);
const days = (n: number | null) => (n === null ? "—" : `${n.toFixed(1)} days`);
const money = (n: number | null, c: string) =>
  n === null
    ? "—"
    : `${c} ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n)}`;
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
const orderHref = (id: string) =>
  `/super-admin/orders/detail/${encodeURIComponent(id)}`;

function Metric({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 gap-2 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-blue-600" />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className="break-words text-2xl font-bold tracking-tight tabular-nums"
          title={value}>
          {value}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Breakdown[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Belum ada data.
          </div>
        ) : (
          <>
            <div className="h-48 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={items}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}>
                    {items.map((item, i) => (
                      <Cell key={item.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {count(item.value)} · {pct((item.value / total) * 100)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SampleOverview({ data }: { data: AnalyticsData }) {
  const m = data.metrics;
  const c = data.filters.currency;
  return (
    <>
      <section className="space-y-3">
        <h3 className="font-semibold">Sample Overview</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            title="Total Sample Orders"
            value={count(m.totalSamples)}
            detail="SAMPLE Order non-CANCELLED"
            icon={Package}
          />
          <Metric
            title="Sample Customers"
            value={count(m.sampleCustomers)}
            detail="Customer unik dengan Sample Order"
            icon={Users}
          />
          <Metric
            title="Converted Samples"
            value={count(m.convertedSamples)}
            detail={`${count(m.unconvertedSamples)} sample belum memiliki konversi langsung`}
            icon={CheckCircle2}
          />
          <Metric
            title="Sample Conversion Rate"
            value={pct(m.sampleConversionRate)}
            detail="Converted samples / total samples"
            icon={Percent}
          />
          <Metric
            title="Converted Customers"
            value={count(m.convertedCustomers)}
            detail={`Customer conversion rate: ${pct(m.customerConversionRate)}`}
            icon={Users}
          />
          <Metric
            title="Average Conversion Time"
            value={days(m.averageConversionDays)}
            detail={`${count(m.conversionLeadTimeCount)} sample dengan Sales Order terkait`}
            icon={Clock}
          />
          <Metric
            title="Linked Sales Orders"
            value={count(m.totalLinkedSalesOrders)}
            detail="Sales Order terkait yang valid; seluruh currency"
            icon={ShoppingBag}
          />
          <Metric
            title="Pending Follow-ups"
            value={count(m.pendingFollowUps)}
            detail={`${count(m.samplesWithoutFollowUps)} sample belum memiliki follow-up`}
            icon={CalendarDays}
          />
        </div>
      </section>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Sample Conversion Trend</CardTitle>
          <p className="text-xs text-muted-foreground">
            Dikelompokkan berdasarkan tanggal Sample Order (
            {data.period.granularity === "day" ? "harian" : "bulanan"});
            konversi dihitung hingga waktu laporan.
          </p>
        </CardHeader>
        <CardContent>
          {m.totalSamples === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Belum ada sample pada periode ini.
            </div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.charts.trend}
                  margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10 }}
                    minTickGap={20}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={40}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="convertedSamples"
                    name="Converted"
                    stackId="sample"
                    fill={COLORS[0]}
                  />
                  <Bar
                    dataKey="unconvertedSamples"
                    name="Not Converted"
                    stackId="sample"
                    fill={COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <BreakdownCard
          title="Sample Conversion"
          description="Sample dengan dan tanpa Sales Order terkait."
          items={data.charts.conversionBreakdown}
        />
        <BreakdownCard
          title="Customer Conversion"
          description="New: linked Sales Order adalah pembelian pertama customer."
          items={data.charts.customerBreakdown}
        />
        <BreakdownCard
          title="Follow-up Coverage"
          description="Sample dengan dan tanpa catatan follow-up."
          items={data.charts.followUpCoverage}
        />
      </div>
      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">Financial Performance</h3>
          <p className="text-xs text-muted-foreground">
            Nominal hanya dalam {c}; tidak ada konversi atau pencampuran mata
            uang.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            title="Sample Order Value"
            value={money(m.totalSampleValue, c)}
            detail={`${count(m.sampleOrdersInCurrency)} sample dalam currency terpilih`}
            icon={Wallet}
          />
          <Metric
            title="Approved Sample Cost"
            value={money(m.totalSampleCost, c)}
            detail={`${count(m.costSamplesInCurrency)} dari ${count(m.totalSamples)} sample memiliki approved cost dalam ${c}`}
            icon={Wallet}
          />
          <Metric
            title="Converted Sales Value"
            value={money(m.convertedSalesValue, c)}
            detail={`${count(m.linkedSalesOrdersInCurrency)} linked Sales Order; bukan pendapatan yang sudah dibayar`}
            icon={ShoppingBag}
          />
          <Metric
            title="Revenue / Cost Ratio"
            value={
              m.revenueToCostRatio === null
                ? "—"
                : `${m.revenueToCostRatio.toFixed(2)}x`
            }
            detail="Rasio nilai sales terhadap biaya sample, bukan ROI laba"
            icon={Percent}
          />
          <Metric
            title="Cost per Conversion"
            value={money(m.costPerConversion, c)}
            detail="Biaya seluruh sample / converted samples"
            icon={Wallet}
          />
          <Metric
            title="Cost Coverage"
            value={pct(m.costCoverageRate)}
            detail="Coverage approved cashflow dalam currency terpilih"
            icon={CheckCircle2}
          />
        </div>
        <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          Tanda — berarti metric tidak tersedia atau coverage belum memenuhi
          syarat. Biaya DRAFT, duplikat dan biaya dalam currency lain tidak
          dijumlahkan. Rasio hanya dihitung ketika data yang diperlukan lengkap.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Follow-up Performance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            title="Total Follow-ups"
            value={count(m.totalFollowUps)}
            detail={`${m.averageFollowUpsPerSample ?? "—"} rata-rata per sample`}
            icon={CalendarDays}
          />
          <Metric
            title="Completed"
            value={count(m.completedFollowUps)}
            detail={`Completion rate: ${pct(m.followUpCompletionRate)}`}
            icon={CheckCircle2}
          />
          <Metric
            title="Pending"
            value={count(m.pendingFollowUps)}
            detail="Follow-up dengan isDone = false"
            icon={Clock}
          />
          <Metric
            title="Pending Past Recorded Date"
            value={count(m.overdueFollowUps)}
            detail="Pending dengan tanggal tercatat yang sudah lewat; bukan SLA terverifikasi"
            icon={Clock}
          />
        </div>
      </section>
    </>
  );
}

function SalesTable({
  data,
  onSelect,
}: {
  data: AnalyticsData;
  onSelect: (id: string) => void;
}) {
  const c = data.filters.currency;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Sample Performance by Sales</CardTitle>
        <p className="text-xs text-muted-foreground">
          Berdasarkan owner Sample Order. Klik nama untuk memfilter dashboard;
          customer unik antar-owner dapat overlap.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow>
                {[
                  "Sales Owner",
                  "Samples",
                  "Converted",
                  "Rate",
                  "Pending Follow-ups",
                  "Approved Cost",
                  "Linked Sales Value",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.salesPerformance.length ? (
                data.salesPerformance.map((r) => (
                  <TableRow key={r.salesUserId ?? "unassigned"}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-blue-600 hover:underline"
                        onClick={() => onSelect(r.salesUserId ?? "unassigned")}>
                        {r.salesName}
                      </button>
                    </TableCell>
                    <TableCell>{count(r.totalSamples)}</TableCell>
                    <TableCell>{count(r.convertedSamples)}</TableCell>
                    <TableCell>{pct(r.sampleConversionRate)}</TableCell>
                    <TableCell>{count(r.pendingFollowUps)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(r.totalSampleCost, c)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(r.convertedSalesValue, c)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground">
                    Belum ada sample pada periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailTable({
  data,
  onPage,
  loading,
}: {
  data: AnalyticsData;
  onPage: (p: number) => void;
  loading: boolean;
}) {
  const { items, pagination: p } = data.details;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Sample Conversion Detail</CardTitle>
        <p className="text-xs text-muted-foreground">
          Klik nomor order untuk melihat detail. Nominal sample dan biaya
          mengikuti currency masing-masing; nilai sales mengikuti filter.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[1250px]">
            <TableHeader>
              <TableRow>
                {[
                  "Sample Order",
                  "Customer / Sales",
                  "Status",
                  "Sample Value",
                  "Approved Cost",
                  "Follow-ups",
                  "Conversion",
                  "Linked Sales Value",
                  "First Sales Order",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={orderHref(r.id)}
                        className="font-medium text-blue-600 hover:underline">
                        {r.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {dateLabel(r.dateOrder)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.salesName}
                      </div>
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(r.sampleValue, r.sampleCurrency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(r.sampleCost, r.costCurrency ?? r.sampleCurrency)}
                      <p className="text-xs text-muted-foreground">
                        {r.costStatus}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        {r.completedFollowUps}/{r.totalFollowUps} done
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.pendingFollowUps} pending
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          r.isConverted
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                        }>
                        {r.isConverted ? "Converted" : "Not converted"}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {r.linkedSalesOrderCount} sales ·{" "}
                        {days(r.conversionDays)}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(r.linkedSalesValue, r.linkedSalesCurrency)}
                    </TableCell>
                    <TableCell>
                      {r.firstSalesOrderId ? (
                        <>
                          <Link
                            href={orderHref(r.firstSalesOrderId)}
                            className="font-medium text-blue-600 hover:underline">
                            {r.firstSalesOrderNumber ?? "View order"}
                          </Link>
                          {r.firstConversionDate && (
                            <p className="text-xs text-muted-foreground">
                              {dateLabel(r.firstConversionDate)}
                            </p>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground">
                    Tidak ada sample pada halaman ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {p.total === 0
              ? "0 data"
              : `Halaman ${p.page} / ${p.totalPages} · ${count(p.total)} sample`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || p.page <= 1}
              onClick={() => onPage(p.page - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || !p.hasNext}
              onClick={() => onPage(p.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Quality({ data }: { data: AnalyticsData }) {
  const q = data.dataQuality;
  const entries = [
    ["Unassigned samples", q.unassignedSamples],
    ["Invalid eligible conversion links", q.invalidConversionLinks],
    ["Missing cashflow", q.missingCashflow],
    ["Draft cashflow", q.draftCashflow],
    ["Duplicate cashflow", q.duplicateCashflow],
    ["Approved cashflow in other currency", q.approvedCashflowOtherCurrency],
    ["Linked sales in other currency", q.linkedSalesOtherCurrency],
  ] as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Data Quality
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Indikator kelengkapan data; satu sample dapat muncul pada lebih dari
          satu kategori.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{count(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SampleAnalyticTab() {
  const { fetchApi, status } = useApi();
  const [draft, setDraft] = useState<Filter>({ ...INITIAL });
  const [applied, setApplied] = useState<Filter>({ ...INITIAL });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      range: applied.range,
      currency: applied.currency,
      page: String(page),
      limit: "20",
    });
    if (applied.range === "custom") {
      params.set("startDate", applied.startDate);
      params.set("endDate", applied.endDate);
    }
    if (applied.salesUserId !== "all")
      params.set("salesUserId", applied.salesUserId);
    void (async () => {
      try {
        const response = await fetchApi(
          `/analytics/samples?${params.toString()}`,
          { signal: controller.signal },
        );
        const result = await response.json().catch(() => null);
        if (
          !response.ok ||
          !result?.success ||
          !result?.data?.metrics ||
          !result?.data?.details
        )
          throw new Error(result?.message || "Gagal memuat Sample Analytics.");
        if (active) setData(result.data as AnalyticsData);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Gagal memuat Sample Analytics.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [applied, page, refresh, fetchApi, status]);
  const apply = () => {
    setFilterError(null);
    if (draft.range === "custom") {
      if (
        !draft.startDate ||
        !draft.endDate ||
        draft.startDate > draft.endDate
      ) {
        setFilterError("Isi rentang tanggal yang valid.");
        return;
      }
      if (
        (Date.parse(draft.endDate) - Date.parse(draft.startDate)) / 86400000 >
        366
      ) {
        setFilterError("Custom range maksimal 366 hari.");
        return;
      }
    }
    setPage(1);
    setApplied({ ...draft });
  };
  const selectOwner = (id: string) => {
    const next = { ...applied, salesUserId: id };
    setFilterError(null);
    setDraft(next);
    setPage(1);
    setApplied(next);
  };
  const sellers = data?.filters.salesUsers ?? [];
  const currencies = data?.filters.currencies ?? [
    { code: "IDR", name: "Indonesian Rupiah" },
  ];
  // Keep applied options visible even if the next cohort does not contain that owner.
  const sellerOptions = [...sellers];
  if (
    draft.salesUserId !== "all" &&
    !sellerOptions.some((s) => s.id === draft.salesUserId)
  )
    sellerOptions.push({
      id: draft.salesUserId,
      name: draft.salesUserId,
      role: null,
    });
  return (
    <div className="mt-6 min-w-0 space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/40">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Sample Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Monitor sample, customer conversion, follow-up dan performa
            keuangan.
          </p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex flex-wrap items-end gap-4 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 self-center text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Date Filter
        </div>
        <div className="w-full space-y-1 sm:w-44">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="sample-period">
            Period
          </label>
          <Select
            value={draft.range}
            onValueChange={(range) =>
              setDraft((d) => ({ ...d, range, salesUserId: "all" }))
            }>
            <SelectTrigger id="sample-period" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.range === "custom" && (
          <>
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="sample-start">
                Start Date
              </label>
              <Input
                id="sample-start"
                type="date"
                value={draft.startDate}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    startDate: e.target.value,
                    salesUserId: "all",
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="sample-end">
                End Date
              </label>
              <Input
                id="sample-end"
                type="date"
                value={draft.endDate}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    endDate: e.target.value,
                    salesUserId: "all",
                  }))
                }
              />
            </div>
          </>
        )}
        <div className="w-full space-y-1 sm:w-52">
          <label
            htmlFor="sample-owner"
            className="text-xs text-muted-foreground">
            Sales
          </label>
          <Select
            value={draft.salesUserId}
            onValueChange={(salesUserId) =>
              setDraft((d) => ({ ...d, salesUserId }))
            }>
            <SelectTrigger id="sample-owner" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {sellerOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1 sm:w-28">
          <label
            htmlFor="sample-currency"
            className="text-xs text-muted-foreground">
            Currency
          </label>
          <Select
            value={draft.currency}
            onValueChange={(currency) => setDraft((d) => ({ ...d, currency }))}>
            <SelectTrigger id="sample-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading || status !== "authenticated"}>
          Apply Filter
        </Button>
      </form>
      {filterError && (
        <p role="alert" className="text-sm text-destructive">
          {filterError}
        </p>
      )}
      {status === "unauthenticated" ? (
        <p className="text-sm text-muted-foreground">Silakan login kembali.</p>
      ) : loading || status === "loading" ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Memuat Sample Analytics...</p>
        </div>
      ) : error ? (
        <div role="alert" className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRefresh((n) => n + 1)}>
            Try Again
          </Button>
        </div>
      ) : (
        data && (
          <>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                {dateLabel(data.period.start)} – {dateLabel(data.period.end)} ·{" "}
                {data.filters.currency} ·{" "}
                {data.filters.salesUserId
                  ? (sellers.find((s) => s.id === data.filters.salesUserId)
                      ?.name ?? "Selected owner")
                  : "All Owners"}
              </p>
              <p>
                Periode berdasarkan tanggal sample. Konversi langsung dan status
                terkini dihitung hingga {dateLabel(data.period.generatedAt)}.
                Sample historis tanpa referenceSampleId tidak dianggap
                converted.
              </p>
            </div>
            <SampleOverview data={data} />
            <SalesTable data={data} onSelect={selectOwner} />
            <DetailTable data={data} loading={loading} onPage={setPage} />
            <Quality data={data} />
          </>
        )
      )}
    </div>
  );
}
