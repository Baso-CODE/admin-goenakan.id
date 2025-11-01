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
type Vendor = {
  id: string;
  companyName: string;
  picName: string;
  phone: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  vendorItems?: {
    item: {
      id: string;
      name: string;
      description: string;
      category: { id: string; name: string };
    };
  }[];
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // === Fetch data dari backend ===
  const fetchVendors = async () => {
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
      const res = await fetch(`http://localhost:8000/vendors?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      setVendors(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, debouncedSearch, statusFilter]);

  // === RENDER ===
  return (
    <div className="space-y-4 overflow-x-hidden w-full  mx-auto">
      {/* === Header === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Vendor Management
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendor..."
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

      {/* === Button Add Vendor === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/vendors/add">
          <Button size="sm" className="gap-2 cursor-pointer">
            + Add Vendor
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
                  <TableHead className="w-[200px]">Company Name</TableHead>
                  <TableHead>PIC Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Penanganan Loading menggunakan Skeleton */}
                {loading ? (
                  // Ulangi baris skeleton, misalnya 5 baris
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {/* Kolom 1: Company Name (w-[200px]) */}
                      <TableCell className="h-12 w-[200px]">
                        <Skeleton className="h-4 w-[180px]" />
                      </TableCell>
                      {/* Kolom 2: PIC Name */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      {/* Kolom 3: Phone */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      {/* Kolom 4: Country */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      {/* Kolom 5: Status */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[60px]" />
                      </TableCell>
                      {/* Kolom 6: Created */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      {/* Kolom 7: Actions (text-center) */}
                      <TableCell className="h-12 text-center">
                        {/* Untuk mensimulasikan tombol Edit & Detail */}
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
                      colSpan={7} // Jumlah kolom: 7
                      className="text-center text-red-500 py-6"
                    >
                      Error: {error || "Failed to load vendors."}
                    </TableCell>
                  </TableRow>
                ) : vendors.length > 0 ? (
                  /* Menampilkan Data Vendor */
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">
                        {vendor.companyName}
                      </TableCell>
                      <TableCell>{vendor.picName}</TableCell>
                      <TableCell>{vendor.phone}</TableCell>
                      <TableCell>{vendor.country}</TableCell>
                      <TableCell>
                        {vendor.isActive ? (
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
                        {formatDate(vendor.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Link href={`/super-admin/vendors/edit/${vendor.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/super-admin/vendors/detail/${vendor.id}`}>
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
                      colSpan={7} // Jumlah kolom: 7
                      className="text-center py-6 text-muted-foreground"
                    >
                      No vendors found.
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

export default Vendors;
