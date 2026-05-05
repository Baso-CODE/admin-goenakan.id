"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/utils/formatDate";
import { Flag, Globe, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === 🟢 Type Definitions Updated ===
type ClientLogo = {
  id: string;
  name: string;
  country: string; // Tambahan baru
  logo: string;
  websiteUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ClientLogoTable() {
  const { fetchApi, status } = useApi();
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const fetchLogos = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetchApi(`/brand-clients?${params}`);

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch client logos.");
      }

      let data = result.data || [];
      if (statusFilter !== "ALL") {
        const isActiveBool = statusFilter === "true";
        data = data.filter(
          (item: ClientLogo) => item.isActive === isActiveBool,
        );
      }

      setLogos(data);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load brand clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/product-categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete category");
      }

      toast.success("Kategori berhasil dihapus!");
      setDeleteId(null);
      fetchLogos();
    } catch (error: any) {
      console.error("❌ Delete Error:", error);

      const errorMessage = error.message || "Gagal menghapus kategori.";
      toast.error(
        `${errorMessage}. Pastikan kategori ini tidak sedang digunakan oleh data produk.`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Brand Clients & Partners 🤝
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search brand name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-32 min-w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Total Brand Partners: {meta?.total || 0}
          </h3>

          <Link href="/super-admin/content/client-logo/add" className="ml-auto">
            <Button
              size="sm"
              className="gap-2 cursor-pointer bg-[#C4A48E] hover:bg-[#a38975]">
              <Plus className="h-4 w-4" /> Add Brand Client
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Order</TableHead>
                  <TableHead className="w-24">Logo</TableHead>
                  <TableHead className="min-w-37.5">Brand Details</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-red-500 py-6">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : logos.length > 0 ? (
                  logos.map((logo) => (
                    <TableRow key={logo.id}>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {logo.displayOrder}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="relative w-12 h-12 bg-stone-50 rounded-md border p-1 overflow-hidden">
                          <Image
                            src={logo.logo} // 🟢 Updated to .logo
                            alt={logo.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-sm">{logo.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          ID: {logo.id.split("-")[0]}...
                        </div>
                      </TableCell>

                      {/* 🟢 New Country Column */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-stone-600">
                          <Flag className="h-3 w-3" />
                          {logo.country}
                        </div>
                      </TableCell>

                      <TableCell>
                        {logo.websiteUrl ? (
                          <a
                            href={logo.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Link
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      <TableCell>
                        {logo.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(logo.createdAt)}
                      </TableCell>

                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/client-logo/edit/${logo.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDeleteId(logo.id)}
                          disabled={deleteId === logo.id}>
                          {deleteId === logo.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground text-sm">
                      No brand clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {meta && (
        <div className="flex justify-between items-center p-4 border rounded-md bg-card text-sm text-muted-foreground shadow-sm">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)} (
            {meta.total} clients)
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Brand Client tidak dapat dihapus jika sudah digunakan dalam data produk. Pastikan tidak ada produk yang menggunakan kategori ini sebelum menghapus."
      />
    </div>
  );
}
