"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ✨ UPDATE: Interface untuk props data grafik
interface CustomerRetentionGraphsProps {
  data?: any[];
}

export default function CustomerRetentionGraphs({
  data = [],
}: CustomerRetentionGraphsProps) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* 1. REPEAT PURCHASE RATE */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Repeat Purchase Rate per Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-70 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month" // Diambil dari backend
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `${value}%`,
                    "Repeat Purchase Rate",
                  ]}
                />
                <Bar
                  dataKey="repeatRate"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. PERCENTAGE CHURNED CUSTOMER */}
      <Card className="shadow-sm border-rose-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Percentage Churned Customer by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-70 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#ffe4e6"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: "#fff1f2" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Churn Rate"]}
                />
                <Bar
                  dataKey="churnRate"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
