"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/formatDate";
import { useDebounce } from "@/helper/debounce";
import { Skeleton } from "@/components/ui/skeleton";

// === Type definitions ===
type SalesPerson = {
  id: string;
  prefix: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  signatureUrl?: string;
  bankAccounts?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }[];
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

const Sales = () => {
  const [sales, setSales] = useState<SalesPerson[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Mengganti endpoint ke /sales
      const res = await fetch(`http://localhost:8000/sales?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch sales data.");
      }

      setSales(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, debouncedSearch, statusFilter]);

  // === RENDER ===
  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === Header === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Sales Management
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sales name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter active/inactive */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger className="w-[150px] min-w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* === Button Add Sales === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/sales/add">
          <Button size="sm" className="gap-2">
            + Add Sales
          </Button>
        </Link>
      </div>
      {/* === Table === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Prefix & Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Penanganan Loading menggunakan Skeleton */}
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {/* Kolom 1: Prefix & Name */}
                      <TableCell className="h-12 w-[250px]">
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      {/* Kolom 2: Phone */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      {/* Kolom 3: Status */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[60px]" />
                      </TableCell>
                      {/* Kolom 4: Created */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      {/* Kolom 5: Actions */}
                      <TableCell className="h-12 text-center">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-[50px]" />
                          <Skeleton className="h-8 w-[60px]" />
                          <Skeleton className="h-8 w-[60px]" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* Penanganan Error */
                  <TableRow>
                    <TableCell
                      colSpan={5} // Jumlah kolom: 5
                      className="text-center text-red-500 py-6"
                    >
                      Error: {error || "Failed to load sales data."}
                    </TableCell>
                  </TableRow>
                ) : sales.length > 0 ? (
                  /* Menampilkan Data Sales */
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        <span className="font-bold mr-1">{sale.prefix}.</span>
                        {sale.name}
                      </TableCell>
                      <TableCell>{sale.phone}</TableCell>
                      <TableCell>
                        {sale.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/10 text-red-600 border-red-500/20"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Link href={`/super-admin/sales/update/${sale.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/super-admin/sales/detail/${sale.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs cursor-pointer"
                          >
                            Detail
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs cursor-pointer"
                          // onClick={() => handleDelete(sale.id)} // TODO: Implement soft delete
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  /* Data Kosong */
                  <TableRow>
                    <TableCell
                      colSpan={5} // Jumlah kolom: 5
                      className="text-center py-6 text-muted-foreground"
                    >
                      No sales found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === Pagination === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
