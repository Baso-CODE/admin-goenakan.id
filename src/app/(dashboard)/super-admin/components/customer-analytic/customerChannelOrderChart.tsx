"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BarChart3, ShoppingCart } from "lucide-react";

import { useMemo } from "react";

export interface ChannelOrderData {
  channels: {
    key: string;
    name: string;
  }[];

  months: {
    month: string;
    label: string;
    totalOrders: number;
    counts: Record<string, number>;
  }[];
}

interface Props {
  data?: ChannelOrderData;
}

const CHANNEL_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#ef4444",
];

function getChannelColor(name: string, index: number) {
  const normalized = name.toLowerCase();

  if (normalized.includes("whatsapp")) {
    return "#16a34a";
  }

  if (normalized.includes("website") || normalized === "web") {
    return "#2563eb";
  }

  if (normalized === "unassigned") {
    return "#94a3b8";
  }

  return CHANNEL_COLORS[index] ?? `hsl(${(index * 137.508) % 360}, 65%, 48%)`;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export default function CustomerChannelOrderChart({ data }: Props) {
  const channels = data?.channels ?? [];

  // ==========================================
  // FLATTEN API RESPONSE FOR RECHARTS
  // ==========================================
  const chartData = useMemo(() => {
    if (!data?.months) {
      return [];
    }

    return data.months.map((month) => ({
      month: month.month,
      label: month.label,
      totalOrders: month.totalOrders,

      ...month.counts,
    }));
  }, [data]);

  // ==========================================
  // TOTAL ORDERS
  // ==========================================
  const totalOrders = chartData.reduce(
    (total, month) => total + month.totalOrders,
    0,
  );

  const channelSummaries = channels.map((channel, index) => ({
    ...channel,

    color: getChannelColor(channel.name, index),

    total: (data?.months ?? []).reduce(
      (sum, month) => sum + (month.counts[channel.key] ?? 0),
      0,
    ),
  }));

  const hasData = channels.length > 0 && totalOrders > 0;

  return (
    <Card className="min-w-0 shadow-sm">
      {/* HEADER */}
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted/40 p-2.5">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <CardTitle className="text-base font-semibold">
                Channel Order per Month
              </CardTitle>

              <CardDescription className="mt-1 text-xs">
                Monthly order distribution by purchase channel.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>

              <p className="text-xl font-bold tabular-nums">
                {formatNumber(totalOrders)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <>
            {/* CHANNEL SUMMARY */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {channelSummaries.map((channel) => {
                const percentage =
                  totalOrders > 0
                    ? ((channel.total / totalOrders) * 100).toFixed(1)
                    : "0";

                return (
                  <div
                    key={channel.key}
                    className="min-w-0 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: channel.color,
                        }}
                      />

                      <span
                        className="truncate text-xs text-muted-foreground"
                        title={channel.name}>
                        {channel.name}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-end justify-between gap-1">
                      <span className="text-xl font-bold tabular-nums">
                        {formatNumber(channel.total)}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STACKED BAR CHART */}
            <div className="h-[340px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 10,
                  }}
                  barCategoryGap="25%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                    tickMargin={12}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tick={{
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                    tickFormatter={(value) => formatNumber(Number(value))}
                  />

                  <Tooltip
                    cursor={{
                      fill: "#f1f5f9",
                    }}
                    contentStyle={{
                      borderRadius: "10px",
                      fontSize: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(value) =>
                      `${formatNumber(Number(value))} orders`
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{
                      fontSize: "12px",
                      paddingTop: "16px",
                    }}
                  />

                  {channelSummaries.map((channel) => (
                    <Bar
                      key={channel.key}
                      dataKey={channel.key}
                      name={channel.name}
                      stackId="purchase-channel"
                      fill={channel.color}
                      maxBarSize={60}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Setiap batang menunjukkan total Order per bulan. Warna menunjukkan
              Purchase Channel. Order CANCELLED tidak disertakan.
            </p>
          </>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <BarChart3 className="h-10 w-10 opacity-40" />

            <p className="text-sm font-medium">No order channel data</p>

            <p className="text-xs">
              Tidak ada Order pada periode yang dipilih.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
