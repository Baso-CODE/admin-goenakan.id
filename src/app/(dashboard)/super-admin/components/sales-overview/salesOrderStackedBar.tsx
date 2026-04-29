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

// === DUMMY DATA ===
const stackedData = [
  {
    month: "Jan",
    stationary: 120,
    drinkware: 80,
    apparel: 40,
    accessories: 20,
  },
  {
    month: "Feb",
    stationary: 150,
    drinkware: 90,
    apparel: 50,
    accessories: 25,
  },
  {
    month: "Mar",
    stationary: 130,
    drinkware: 110,
    apparel: 45,
    accessories: 30,
  },
  {
    month: "Apr",
    stationary: 180,
    drinkware: 140,
    apparel: 60,
    accessories: 40,
  },
  {
    month: "May",
    stationary: 160,
    drinkware: 130,
    apparel: 55,
    accessories: 35,
  },
  {
    month: "Jun",
    stationary: 210,
    drinkware: 170,
    apparel: 80,
    accessories: 50,
  },
];

export default function SalesOrderStackedBar() {
  return (
    <Card className="shadow-sm mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Order by Product Category
        </CardTitle>
        <CardDescription className="text-xs">
          (Default per month) - Stacked Bar Chart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-87.5 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stackedData}
              margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
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
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px" }}
              />

              {/* STACKED BARS */}
              <Bar
                dataKey="stationary"
                name="Stationary"
                stackId="a"
                fill="#0ea5e9"
                maxBarSize={50}
              />
              <Bar
                dataKey="drinkware"
                name="Drinkware"
                stackId="a"
                fill="#10b981"
                maxBarSize={50}
              />
              <Bar
                dataKey="apparel"
                name="Apparel"
                stackId="a"
                fill="#f59e0b"
                maxBarSize={50}
              />
              <Bar
                dataKey="accessories"
                name="Accessories"
                stackId="a"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
