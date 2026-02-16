"use client";

import { Pencil, Search, Tags } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { cn } from "@/lib/utils";

// === TYPES ===
type FinanceCategory = {
  id: string;
  name: string;
  slug: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  isActive: boolean;
  _count: {
    transactions: number;
  };
};

export default function TableFinanceCategory() {
  // === STATE ===
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<
    FinanceCategory[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [categoryType, setCategoryType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // === FETCH CATEGORIES ===
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/finance/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch categories");

      const result = await res.json();
      setCategories(result.data || []);
      setFilteredCategories(result.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data kategori keuangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // === CLIENT-SIDE FILTERING ===
  useEffect(() => {
    let result = [...categories];

    // Filter Search (Nama Kategori)
    if (debouncedSearch) {
      const lowercasedSearch = debouncedSearch.toLowerCase();
      result = result.filter((cat) =>
        cat.name.toLowerCase().includes(lowercasedSearch),
      );
    }

    // Filter Tipe (INCOME / EXPENSE)
    if (categoryType !== "ALL") {
      result = result.filter((cat) => cat.type === categoryType);
    }

    // Filter Status (ACTIVE / INACTIVE)
    if (statusFilter !== "ALL") {
      const isActiveFilter = statusFilter === "ACTIVE";
      result = result.filter((cat) => cat.isActive === isActiveFilter);
    }

    setFilteredCategories(result);
  }, [categories, debouncedSearch, categoryType, statusFilter]);

  // === RENDER ===
  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tags className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Kategori Keuangan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Kelola master data kategori untuk arus kas (Buku Kas).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama kategori..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/super-admin/finance/categories/add">
              <Button className="w-full md:w-auto shadow-sm bg-orange-600 hover:bg-orange-700 transition-all">
                + Tambah Kategori
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter Type */}
          <div className="flex flex-col gap-1.5 w-full sm:w-48">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tipe Kategori
            </span>
            <Select
              value={categoryType}
              onValueChange={(val) => setCategoryType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="INCOME">Pemasukan (Income)</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran (Expense)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Status */}
          <div className="flex flex-col gap-1.5 w-full sm:w-48">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status Aktif
            </span>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-64">Nama Kategori</TableHead>
                  <TableHead className="w-32 text-center">Tipe</TableHead>
                  <TableHead className="w-48">Deskripsi</TableHead>
                  <TableHead className="w-32 text-center">
                    Jml Transaksi
                  </TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="text-center w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground">
                      Tidak ada kategori ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-muted/5">
                      <TableCell>
                        <span className="font-semibold text-gray-800">
                          {cat.name}
                        </span>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {cat.slug}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-2",
                            cat.type === "INCOME"
                              ? "text-green-700 border-green-200 bg-green-50"
                              : "text-red-700 border-red-200 bg-red-50",
                          )}>
                          {cat.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {cat.description || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="font-medium bg-slate-100">
                          {cat._count.transactions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-5 px-2",
                            cat.isActive
                              ? "text-blue-700 border-blue-200 bg-blue-50"
                              : "text-slate-500 border-slate-200 bg-slate-100",
                          )}>
                          {cat.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/super-admin/finance/categories/edit/${cat.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          {/* Opsional: Tombol Delete (Disarankan divalidasi dulu sebelum hapus via API) */}
                          {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground text-right px-2">
        Menampilkan {filteredCategories.length} kategori keuangan
      </div>
    </div>
  );
}
