"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// === DUMMY DATA ===
const topProducts = [
  {
    sku: "TMB-001",
    name: "Tumbler Stainless Premium",
    totalOrder: 1250,
    totalRevenue: 187500,
  },
  {
    sku: "MUG-002",
    name: "Mug Keramik Custom",
    totalOrder: 980,
    totalRevenue: 49000,
  },
  {
    sku: "PEN-015",
    name: "Pulpen Metal Eksklusif",
    totalOrder: 850,
    totalRevenue: 25500,
  },
  {
    sku: "BOK-003",
    name: "Notebook Agenda Kulit",
    totalOrder: 620,
    totalRevenue: 55800,
  },
  {
    sku: "BAG-009",
    name: "Tote Bag Kanvas",
    totalOrder: 410,
    totalRevenue: 20500,
  },
];

const bottomProducts = [
  {
    sku: "KEY-004",
    name: "Gantungan Kunci Akrilik",
    totalOrder: 15,
    totalRevenue: 300,
  },
  {
    sku: "PIN-007",
    name: "Pin Magnet Kustom",
    totalOrder: 22,
    totalRevenue: 220,
  },
  {
    sku: "MSK-001",
    name: "Masker Kain Sablon",
    totalOrder: 35,
    totalRevenue: 875,
  },
  { sku: "LNY-011", name: "Lanyard Polos", totalOrder: 40, totalRevenue: 600 },
  {
    sku: "MOU-005",
    name: "Mousepad Standar",
    totalOrder: 45,
    totalRevenue: 1350,
  },
];

export default function SalesTopBottomProducts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {/* ========================================== */}
      {/* TABEL KIRI: TOP 5 SELLING PRODUCTS         */}
      {/* ========================================== */}
      <Card className="shadow-sm border-emerald-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Top 5 Selling Product
          </CardTitle>
          <CardDescription className="text-xs">
            (Default is total revenue from beginning until now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Order
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-500">
                      {item.sku}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.totalOrder.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      ${item.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* TABEL KANAN: BOTTOM 5 SELLING PRODUCTS     */}
      {/* ========================================== */}
      <Card className="shadow-sm border-rose-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Bottom 5 Selling Product
          </CardTitle>
          <CardDescription className="text-xs">
            (Default is total revenue from beginning until now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Order
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottomProducts.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-500">
                      {item.sku}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.totalOrder.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">
                      ${item.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
