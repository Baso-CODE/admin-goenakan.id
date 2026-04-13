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
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type definitions ===
type Article = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  author: {
    name: string;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ArticlesSection() {
  // --- STATE UNTUK TABLE ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FUNGSI FETCH DATA ---
  const fetchArticles = async () => {
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

      // Pastikan endpoint backend ini sudah sesuai dengan ArticleRouter Anda
      const res = await fetch(`${apiUrl}/articles?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setArticles(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load articles");
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

      const res = await fetch(`${apiUrl}/articles/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete article");
      }

      toast.success("Article berhasil dihapus!");
      setDeleteId(null);
      fetchArticles(); // Refresh data
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus Article.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Panggil fetch setiap kali halaman atau pencarian berubah
  useEffect(() => {
    fetchArticles();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER & SEARCH/FILTER TABLE === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl font-semibold">
            Article Management 📰
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* SEARCH */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search article title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* BUTTON ADD ARTICLE */}
            <Link href="/admin-article/add" className="md:ml-auto">
              <Button size="sm" className="w-full gap-2 cursor-pointer h-10">
                + Write Article
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
                <TableHead className="w-[35%]">Title</TableHead>
                <TableHead className="w-[15%]">Category</TableHead>
                <TableHead className="w-[10%]">Author</TableHead>
                <TableHead className="w-[10%] text-center">Status</TableHead>
                <TableHead className="w-[15%] text-right">Published</TableHead>
                <TableHead className="w-[15%] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-64" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="h-12 flex justify-center items-center">
                      <Skeleton className="h-6 w-16 rounded-full mt-3" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell className="h-12">
                      <div className="flex justify-center space-x-2">
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
                    Error: {"Failed to load articles."}
                  </TableCell>
                </TableRow>
              ) : articles.length > 0 ? (
                articles.map((data) => (
                  <TableRow key={data.id}>
                    {/* Title & Slug */}
                    <TableCell className="font-medium">
                      <div className="line-clamp-1" title={data.title}>
                        {data.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        /{data.slug}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-sm">
                      {data.category?.name || "-"}
                    </TableCell>

                    {/* Author */}
                    <TableCell className="text-sm text-muted-foreground">
                      {data.author?.name || "System"}
                    </TableCell>

                    {/* Status Publish */}
                    <TableCell className="text-center">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          data.published
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {data.published ? "Published" : "Draft"}
                      </span>
                    </TableCell>

                    {/* Date Published */}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {data.publishedAt
                        ? formatDate(data.publishedAt, { style: "date" })
                        : "-"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center space-x-2">
                      <Link href={`/admin-article/edit/${data.id}`}>
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
                    No articles found. Start writing your first article!
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
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage) || 1}
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

      {/* === DELETE DIALOG === */}
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Apakah Anda yakin ingin menghapus artikel ini? Data yang sudah dihapus tidak dapat dikembalikan."
      />
    </div>
  );
}
