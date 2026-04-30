"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

// === DUMMY DATA ===
const initialRegionData = [
  {
    id: 1,
    region: "East Java",
    totalCustomer: 28,
    totalSales: 27823,
    lastOrder: "2026-04-26",
  },
  {
    id: 2,
    region: "DKI Jakarta",
    totalCustomer: 85,
    totalSales: 120500,
    lastOrder: "2026-04-29",
  },
  {
    id: 3,
    region: "West Java",
    totalCustomer: 45,
    totalSales: 45000,
    lastOrder: "2026-04-28",
  },
  {
    id: 4,
    region: "Bali",
    totalCustomer: 15,
    totalSales: 15200,
    lastOrder: "2026-04-20",
  },
  {
    id: 5,
    region: "Central Java",
    totalCustomer: 22,
    totalSales: 19800,
    lastOrder: "2026-04-25",
  },
];

// Helper untuk format tanggal (Contoh: "26 Apr 2026")
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerRegionTable() {
  const [sortBy, setSortBy] = useState("sales-desc");

  // Logika Sorting Data
  const sortedData = useMemo(() => {
    const dataCopy = [...initialRegionData];

    switch (sortBy) {
      case "region-asc":
        return dataCopy.sort((a, b) => a.region.localeCompare(b.region));
      case "region-desc":
        return dataCopy.sort((a, b) => b.region.localeCompare(a.region));
      case "customer-desc":
        return dataCopy.sort((a, b) => b.totalCustomer - a.totalCustomer);
      case "customer-asc":
        return dataCopy.sort((a, b) => a.totalCustomer - b.totalCustomer);
      case "sales-desc":
        return dataCopy.sort((a, b) => b.totalSales - a.totalSales);
      case "sales-asc":
        return dataCopy.sort((a, b) => a.totalSales - b.totalSales);
      case "date-desc":
        return dataCopy.sort(
          (a, b) =>
            new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime(),
        );
      case "date-asc":
        return dataCopy.sort(
          (a, b) =>
            new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime(),
        );
      default:
        return dataCopy;
    }
  }, [sortBy]);

  return (
    <Card className="shadow-sm mt-6">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Tabel Detail Customer by Region
        </CardTitle>

        {/* FITUR FILTER / SORTING */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Sort by:
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-50 h-8 text-xs bg-white">
              <ArrowUpDown className="w-3 h-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort data..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales-desc">Total Sales (Highest)</SelectItem>
              <SelectItem value="sales-asc">Total Sales (Lowest)</SelectItem>
              <SelectItem value="customer-desc">
                Total Customer (Highest)
              </SelectItem>
              <SelectItem value="customer-asc">
                Total Customer (Lowest)
              </SelectItem>
              <SelectItem value="date-desc">Last Order (Newest)</SelectItem>
              <SelectItem value="date-asc">Last Order (Oldest)</SelectItem>
              <SelectItem value="region-asc">Region (A-Z)</SelectItem>
              <SelectItem value="region-desc">Region (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">
                  Region
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Total Customer
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Total Sales
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Last Order
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">{item.region}</TableCell>
                  <TableCell className="text-right">
                    {item.totalCustomer.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    ${item.totalSales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    {formatDate(item.lastOrder)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
