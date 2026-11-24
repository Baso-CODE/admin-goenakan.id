"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

import { ArrowDown, ArrowUp, ArrowUpDown, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

export interface RegionData {
  id: string;
  country: string;
  region: string;
  city: string;
  totalCustomer: number;
  totalSales: number | null;
  currencyCode: string | null;
  salesByCurrency: Record<string, number>;
  lastOrder: string;
}

interface CustomerRegionTableProps {
  data?: RegionData[];
}

type SortKey =
  | "country"
  | "region"
  | "city"
  | "totalCustomer"
  | "totalSales"
  | "lastOrder";

type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
}[] = [
  {
    key: "country",
    label: "Country",
    align: "left",
  },
  {
    key: "region",
    label: "Region",
    align: "left",
  },
  {
    key: "city",
    label: "City",
    align: "left",
  },
  {
    key: "totalCustomer",
    label: "Total Customer",
    align: "right",
  },
  {
    key: "totalSales",
    label: "Total Sales",
    align: "right",
  },
  {
    key: "lastOrder",
    label: "Last Order",
    align: "right",
  },
];

const EMPTY_DATA: RegionData[] = [];

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CustomerRegionTable({
  data = EMPTY_DATA,
}: CustomerRegionTableProps) {
  const [search, setSearch] = useState("");

  const [selectedCurrency, setSelectedCurrency] = useState("IDR");

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "totalSales",
    direction: "desc",
  });

  // ==========================================
  // AVAILABLE CURRENCIES
  // ==========================================
  const currencies = useMemo(() => {
    const result = new Set<string>();

    for (const row of data) {
      for (const currency of Object.keys(row.salesByCurrency ?? {})) {
        result.add(currency);
      }
    }

    return Array.from(result).sort();
  }, [data]);

  const activeCurrency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : (currencies[0] ?? "IDR");

  // ==========================================
  // HANDLE CLICK TABLE HEADER
  // ==========================================
  const handleSort = (key: SortKey) => {
    setSortConfig((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "asc" ? "desc" : "asc",
        };
      }

      const isTextColumn = ["country", "region", "city"].includes(key);

      return {
        key,
        direction: isTextColumn ? "asc" : "desc",
      };
    });
  };

  // ==========================================
  // SEARCH & SORT
  // ==========================================
  const sortedData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const rows = data.filter((row) => {
      if (!keyword) {
        return true;
      }

      return [row.country, row.region, row.city]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    const direction = sortConfig.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      const key = sortConfig.key;

      let result = 0;

      switch (key) {
        case "country":
        case "region":
        case "city":
          result = a[key].localeCompare(b[key], undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;

        case "totalCustomer":
          result = a.totalCustomer - b.totalCustomer;
          break;

        case "totalSales": {
          const aSales = a.salesByCurrency?.[activeCurrency];

          const bSales = b.salesByCurrency?.[activeCurrency];

          // Region tanpa transaksi pada mata
          // uang terpilih tetap berada di bawah.
          if (aSales === undefined && bSales !== undefined) {
            return 1;
          }

          if (aSales !== undefined && bSales === undefined) {
            return -1;
          }

          result = (aSales ?? 0) - (bSales ?? 0);

          break;
        }

        case "lastOrder":
          result =
            new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime();
          break;
      }

      if (result !== 0) {
        return result * direction;
      }

      return a.id.localeCompare(b.id);
    });
  }, [data, search, sortConfig, activeCurrency]);

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return (
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      );
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-3.5 w-3.5 shrink-0 text-blue-600" />;
    }

    return <ArrowDown className="h-3.5 w-3.5 shrink-0 text-blue-600" />;
  };

  return (
    <Card className="min-w-0 shadow-sm">
      {/* HEADER */}
      <CardHeader className="gap-4 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted/40 p-2.5">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <CardTitle className="text-base font-semibold">
                Tabel Detail Customer by Region
              </CardTitle>

              <CardDescription className="mt-1 text-xs">
                Distribusi pelanggan berdasarkan negara, provinsi, dan kota.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search location..."
                aria-label="Search location"
                className="h-9 pl-9 text-sm"
              />
            </div>

            {/* CURRENCY */}
            <Select
              value={activeCurrency}
              onValueChange={setSelectedCurrency}
              disabled={!currencies.length}>
              <SelectTrigger className="h-9 w-full sm:w-32">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>

              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[780px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sortConfig.key === column.key
                        ? sortConfig.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={`flex w-full items-center gap-2 py-2 text-xs font-semibold transition-colors hover:text-blue-600 ${
                        column.align === "right"
                          ? "justify-end"
                          : "justify-start"
                      }`}>
                      {column.label}
                      {getSortIcon(column.key)}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((row) => {
                  const totalSales = row.salesByCurrency?.[activeCurrency];

                  return (
                    <TableRow
                      key={row.id}
                      className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {row.country}
                      </TableCell>

                      <TableCell>{row.region}</TableCell>

                      <TableCell>{row.city}</TableCell>

                      <TableCell className="text-right tabular-nums">
                        {row.totalCustomer.toLocaleString("en-US")}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-emerald-600">
                        {totalSales === undefined
                          ? "-"
                          : formatCurrency(totalSales, activeCurrency)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                        {formatDate(row.lastOrder)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada data pelanggan yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            Showing {sortedData.length} of {data.length} regions
          </span>

          <span>
            Total Sales: {activeCurrency}. Customer dan Last Order mencakup
            semua mata uang.
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Klik nama kolom untuk mengurutkan data. Total Sales merupakan nilai
          Order, bukan jumlah pembayaran yang diterima.
        </p>
      </CardContent>
    </Card>
  );
}
