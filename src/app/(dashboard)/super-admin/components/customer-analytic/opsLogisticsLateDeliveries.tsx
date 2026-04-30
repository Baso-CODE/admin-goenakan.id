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

// === DUMMY DATA ===
const dataMonth = [
  { label: "Jan", value: 45 },
  { label: "Feb", value: 52 },
  { label: "Mar", value: 38 },
  { label: "Apr", value: 65 },
  { label: "May", value: 48 },
  { label: "Jun", value: 55 },
];

const dataVendor = [
  { label: "Vendor A", value: 120 },
  { label: "Vendor B", value: 85 },
  { label: "Vendor C", value: 40 },
  { label: "Vendor D", value: 25 },
];

const dataProduct = [
  { label: "Tumbler", value: 95 },
  { label: "Apparel", value: 70 },
  { label: "Agenda", value: 30 },
  { label: "Bag", value: 20 },
];

export default function OpsLogisticsLateDeliveries() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {/* 1. LATE DELIVERIES BY MONTH */}
      <Card className="shadow-sm border-orange-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Late deliveries by month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataMonth}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#fed7aa"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9a3412" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9a3412" }}
                />
                <Tooltip
                  cursor={{ fill: "#fff7ed" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. LATE DELIVERIES BY VENDOR */}
      <Card className="shadow-sm border-orange-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Late deliveries by vendor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataVendor}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#fed7aa"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9a3412" }}
                  width={70}
                />
                <Tooltip cursor={{ fill: "#fff7ed" }} />
                <Bar
                  dataKey="value"
                  fill="#fb923c"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. LATE DELIVERIES BY PRODUCT */}
      <Card className="shadow-sm border-orange-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Late deliveries by product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataProduct}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#fed7aa"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9a3412" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9a3412" }}
                />
                <Tooltip cursor={{ fill: "#fff7ed" }} />
                <Bar
                  dataKey="value"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
