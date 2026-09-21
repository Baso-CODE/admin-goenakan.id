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
import {
  Briefcase,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

//  UPDATE TIPE DATA BILINGUAL
type Portfolio = {
  id: string;
  title_id: string;
  title_en?: string | null;
  clientName: string;
  image: string;
  displayOrder: number;
  orderQuantity: number;
  projectDate: string | null;
  isActive: boolean;
  createdAt: string;
  eventCategory?: {
    id: string;
    title_id: string;
    title_en?: string | null;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function PortfolioTable() {
  const { fetchApi, status } = useApi();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const fetchPortfolios = async () => {
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

      const res = await fetchApi(`/portfolios?${params}`);

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch portfolios.");
      }

      let data = result.data || [];
      if (statusFilter !== "ALL") {
        const isActiveBool = statusFilter === "true";
        data = data.filter((item: Portfolio) => item.isActive === isActiveBool);
      }

      setPortfolios(data);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/portfolios/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete portfolio");
      }

      toast.success("Portfolio berhasil dihapus!");
      setDeleteId(null);
      fetchPortfolios();
    } catch (error: any) {
      console.error("❌ Delete Error:", error);
      toast.error(
        error.message || "Gagal menghapus Portfolio. Terjadi kesalahan sistem.",
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
            Portfolios & Projects 📁
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search title or client..."
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
            Total Portfolios: {meta?.total || 0}
          </h3>

          <Link href="/super-admin/content/portfolios/add" className="ml-auto">
            <Button
              size="sm"
              className="gap-2 cursor-pointer bg-[#C4A48E] hover:bg-[#a38975]">
              <Plus className="h-4 w-4" /> Add Portfolio
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
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead className="min-w-64">
                    Project & Category (ID / EN)
                  </TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="text-center">Items Ordered</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Project Date
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-red-500 py-6">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : portfolios.length > 0 ? (
                  portfolios.map((item) => (
                    <TableRow key={item.id}>
                      {/* --- URUTAN --- */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {item.displayOrder}
                        </Badge>
                      </TableCell>

                      {/* --- GAMBAR PORTFOLIO --- */}
                      <TableCell>
                        <div className="relative w-16 h-12 bg-stone-50 rounded-md border p-1 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title_id}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>

                      {/* --- JUDUL PROYEK & KATEGORI (BILINGUAL) --- */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-stone-900">
                            {item.title_id}{" "}
                            <span className="text-xs font-normal text-stone-400">
                              (ID)
                            </span>
                          </div>
                          {item.title_en ? (
                            <div className="text-xs text-stone-500">
                              {item.title_en}{" "}
                              <span className="text-[10px] text-stone-400">
                                (EN)
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] italic text-amber-600/70">
                              Belum ada terjemahan EN
                            </div>
                          )}

                          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground pt-1 border-t border-stone-100">
                            <Tag className="h-3 w-3 text-[#C4A48E]" />
                            <span>
                              {item.eventCategory?.title_id || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* --- NAMA KLIEN --- */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                          <Briefcase className="h-3.5 w-3.5 text-[#C4A48E]" />
                          {item.clientName}
                        </div>
                      </TableCell>

                      {/* --- JUMLAH ORDER --- */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                          <ShoppingCart className="h-3 w-3 mr-1 inline-block" />
                          {item.orderQuantity || 0}
                        </Badge>
                      </TableCell>

                      {/* --- TANGGAL PROYEK --- */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {item.projectDate ? (
                          formatDate(item.projectDate, { style: "date" })
                        ) : (
                          <span className="text-stone-400 italic">Not set</span>
                        )}
                      </TableCell>

                      {/* --- STATUS --- */}
                      <TableCell>
                        {item.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      {/* --- TANGGAL DIBUAT --- */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(item.createdAt, { style: "date" })}
                      </TableCell>

                      {/* --- ACTIONS --- */}
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/portfolios/edit/${item.id}`}>
                          <Button variant="outline" size="sm" className="h-8">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDeleteId(item.id)}
                          disabled={deleteId === item.id}>
                          {deleteId === item.id ? (
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
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 opacity-20" />
                        <p>No portfolios found.</p>
                      </div>
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
            {meta.total} items)
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
        warningMessage="Apakah Anda yakin ingin menghapus data portofolio ini secara permanen? Gambar yang terkait juga akan dihapus dari server."
      />
    </div>
  );
}
