"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type definitions ===
type ArticleInfo = {
  title: string;
  coverImage: string;
  slug: string;
};

type ArticleBanner = {
  id: string;
  backgroundColor: string;
  buttonText: string;
  ctaLink: string;
  isActive: boolean;
  createdAt: string;
  article: ArticleInfo;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

const ArticleBanners = () => {
  // --- STATE UNTUK TABLE ---
  const [banners, setBanners] = useState<ArticleBanner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  // Pencarian berdasarkan Judul Artikel
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FUNGSI FETCH DATA ---
  const fetchBanners = async () => {
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

      // Sesuaikan URL ini jika nama route backend Anda berbeda
      const res = await fetch(`${apiUrl}/articles-banners?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setBanners(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load article banners");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/article-banners/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete banner");
      }

      toast.success("Article Banner berhasil dihapus!");
      setDeleteId(null);
      fetchBanners(); // Refresh data
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus Banner.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Article Banners Management 🎯
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by article title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Link href="/admin-article/banners/add">
              <Button
                size="sm"
                className="w-full sm:w-auto gap-2 cursor-pointer">
                + Add Banner
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Terkait Artikel</TableHead>
                <TableHead className="w-[15%]">Visual</TableHead>
                <TableHead className="w-[20%]">Tombol & Link CTA</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[15%]">Dibuat</TableHead>
                <TableHead className="w-[10%]">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-500 py-6">
                    Error: {"Failed to load banners."}
                  </TableCell>
                </TableRow>
              ) : banners.length > 0 ? (
                banners.map((data) => (
                  <TableRow key={data.id}>
                    {/* Terkait Artikel */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-stone-100 rounded-sm overflow-hidden shrink-0">
                          <Image
                            src={data.article.coverImage}
                            alt={data.article.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="font-medium text-sm line-clamp-2">
                          {data.article.title}
                        </div>
                      </div>
                    </TableCell>

                    {/* Visual: Preview Warna */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-stone-200 shadow-sm"
                          style={{ backgroundColor: data.backgroundColor }}
                        />
                        <span className="text-xs font-mono text-muted-foreground uppercase">
                          {data.backgroundColor}
                        </span>
                      </div>
                    </TableCell>

                    {/* Tombol & Link CTA */}
                    <TableCell>
                      <div className="text-sm font-semibold">
                        {data.buttonText}
                      </div>
                      <a
                        href={data.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline line-clamp-1 mt-1">
                        {data.ctaLink}
                      </a>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          data.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                        {data.isActive ? "Tayang" : "Draft"}
                      </span>
                    </TableCell>

                    {/* Dibuat Tanggal */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(data.createdAt)}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="space-x-2">
                      <Link href={`/admin-article/banners/edit/${data.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs cursor-pointer"
                        onClick={() => setDeleteId(data.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground">
                    Belum ada banner yang dibuat.
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
        warningMessage="Apakah Anda yakin ingin menghapus konfigurasi banner ini? Data artikel asli tidak akan terhapus."
      />
    </div>
  );
};

export default ArticleBanners;
