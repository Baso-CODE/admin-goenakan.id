"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";
import { Select, SelectTrigger } from "@radix-ui/react-select";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ProductCategories = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

const ProductCategoriesPage = () => {
  const [categories, setCategories] = useState<ProductCategories[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [page, setPage] = useState(1);

  // === FETCH DATA DARI BACKEND ===
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetch(
        `http://localhost:8000/product-categories?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load vendor categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-4 w-full max-w-8xl mx-auto">
      {/* === HEADER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Product Categories Management
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            {/* SEARCH */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* === ADD BUTTON === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/product-categories/add">
          <Button size="sm" className="gap-2 cursor-pointer">
            + Add Category
          </Button>
        </Link>
      </div>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Category Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Penanganan Loading menggunakan Skeleton */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {/* Kolom 1: Category Name */}
                    <TableCell className="h-12 w-[30%]">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    {/* Kolom 2: Slug */}
                    <TableCell className="h-12 w-[30%]">
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    {/* Kolom 3: Created */}
                    <TableCell className="h-12 w-[20%]">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    {/* Kolom 4: Actions (text-right) */}
                    <TableCell className="h-12 w-[20%] text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-[50px]" />
                        {/* Edit Button */}
                        <Skeleton className="h-8 w-[60px]" />
                        {/* Delete Button */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? ( // Asumsi ada state/prop 'error'
                /* Penanganan Error */
                <TableRow>
                  <TableCell
                    colSpan={4} // Jumlah kolom: 4
                    className="text-center text-red-500 py-6"
                  >
                    Error: {"Failed to load categories."}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                /* Menampilkan Data Category */
                categories.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium">{data.name}</TableCell>
                    <TableCell>{data.slug}</TableCell>
                    <TableCell>
                      {formatDate(data.createdAt, { style: "relative" })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link
                        href={`/super-admin/product-categories/edit/${data.id}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                        >
                          Edit
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
                    colSpan={4} // Jumlah kolom: 4
                    className="text-center py-6 text-muted-foreground"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p className="text-sm text-muted-foreground">
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

export default ProductCategoriesPage;
