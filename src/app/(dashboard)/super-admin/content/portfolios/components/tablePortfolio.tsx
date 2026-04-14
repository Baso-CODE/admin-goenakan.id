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
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";
import {
  Briefcase,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Portfolio = {
  id: string;
  title: string;
  clientName: string;
  image: string;
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

export default function PortfolioTable() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
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

  const fetchPortfolios = async () => {
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

      // Hit ke endpoint Portfolios
      const res = await fetch(`${apiUrl}/portfolios?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [page, debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/portfolios/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete portfolio");
      }

      toast.success("Portfolio berhasil dihapus!");
      setDeleteId(null);
      fetchPortfolios();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus Portfolio. Terjadi kesalahan sistem.");
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
                  <TableHead className="min-w-37.5">Project Title</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>

                      {/* --- JUDUL PROYEK --- */}
                      <TableCell>
                        <div className="font-semibold text-sm">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          ID: {item.id.substring(0, 8)}...
                        </div>
                      </TableCell>

                      {/* --- NAMA KLIEN --- */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                          <Briefcase className="h-3 w-3 text-[#C4A48E]" />
                          {item.clientName}
                        </div>
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
                        {formatDate(item.createdAt)}
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
                      colSpan={7}
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
