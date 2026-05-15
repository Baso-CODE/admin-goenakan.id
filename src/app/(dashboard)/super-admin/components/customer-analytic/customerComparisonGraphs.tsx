"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CustomerComparisonGraphsProps {
  data?: any[];
}

export default function CustomerComparisonGraphs({
  data = [],
}: CustomerComparisonGraphsProps) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* 3. PERCENTAGE NEW VS REPEAT ORDER (STACKED BAR) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Percentage New vs Repeat Customer Order by Month
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
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "10px" }}
                />

                <Bar
                  dataKey="newOrderPct"
                  name="New Customer Order"
                  stackId="a"
                  fill="#10b981"
                  maxBarSize={45}
                />
                <Bar
                  dataKey="repeatOrderPct"
                  name="Repeat Customer Order"
                  stackId="a"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 4. AVERAGE SALES NEW VS REPEAT CUSTOMER (GROUPED BAR) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Average Sales: New vs Repeat Customer by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-70 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
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
                  tickFormatter={(value) =>
                    `${value >= 1000 ? value / 1000 + "k" : value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(value),
                    "Sales",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "10px" }}
                />

                <Bar
                  dataKey="avgSalesNew"
                  name="Avg Sales (New)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="avgSalesRepeat"
                  name="Avg Sales (Repeat)"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
