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

// === DUMMY DATA ===
const comparisonData = [
  {
    month: "Jan",
    newOrderPct: 70,
    repeatOrderPct: 30,
    avgSalesNew: 120,
    avgSalesRepeat: 250,
  },
  {
    month: "Feb",
    newOrderPct: 65,
    repeatOrderPct: 35,
    avgSalesNew: 130,
    avgSalesRepeat: 270,
  },
  {
    month: "Mar",
    newOrderPct: 60,
    repeatOrderPct: 40,
    avgSalesNew: 125,
    avgSalesRepeat: 280,
  },
  {
    month: "Apr",
    newOrderPct: 55,
    repeatOrderPct: 45,
    avgSalesNew: 140,
    avgSalesRepeat: 310,
  },
  {
    month: "May",
    newOrderPct: 50,
    repeatOrderPct: 50,
    avgSalesNew: 150,
    avgSalesRepeat: 340,
  },
  {
    month: "Jun",
    newOrderPct: 40,
    repeatOrderPct: 60,
    avgSalesNew: 160,
    avgSalesRepeat: 380,
  },
];

export default function CustomerComparisonGraphs() {
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
              {/* Stacked bar chart (total 100%) */}
              <BarChart
                data={comparisonData}
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
              {/* Grouped bar chart (batang bersebelahan) */}
              <BarChart
                data={comparisonData}
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
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`]}
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
