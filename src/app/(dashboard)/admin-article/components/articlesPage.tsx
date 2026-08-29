"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
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
import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Article = {
  id: string;
  slug: string;
  title_id: string;
  title_en?: string;
  published: boolean;
  publishedAt: string | null;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  categoryId: string;
  category: {
    id: string;
    name_id: string;
    name_en: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ArticlesSection() {
  const { fetchApi, status } = useApi();

  // --- STATE UNTUK TABLE & FILTER ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  //  STATE UNTUK NILAI FILTER
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  //  STATE UNTUK DATA MASTER DROPDOWN
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  //  FUNGSI LOAD MASTER DATA (Untuk Dropdown)
  useEffect(() => {
    async function loadFilters() {
      if (status !== "authenticated") return;
      try {
        // Sesuaikan endpoint /users dengan API kamu yang mengembalikan list author
        const [catRes, authRes] = await Promise.all([
          fetchApi("/article-categories/list"),
          fetchApi("/articles/authors"),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data || catData);
        }
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthors(authData.data || authData);
        }
      } catch (err) {
        console.error("Gagal memuat data filter", err);
      }
    }
    loadFilters();
  }, [status, fetchApi]);

  // --- FUNGSI FETCH DATA ---
  const fetchArticles = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

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

      //  Masukkan filter ke dalam parameter API
      if (selectedCategory !== "all")
        params.append("categoryId", selectedCategory);
      if (selectedAuthor !== "all") params.append("authorId", selectedAuthor);
      if (selectedStatus !== "all") params.append("published", selectedStatus);

      const res = await fetchApi(`/articles?${params}`);

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
  }, [
    page,
    debouncedSearch,
    selectedCategory,
    selectedAuthor,
    selectedStatus,
    status,
    fetchApi,
  ]);

  //  Reset halaman ke 1 jika filter berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedAuthor, selectedStatus]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/articles/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete article");
      }

      toast.success("Article berhasil dihapus!");
      setDeleteId(null);
      fetchArticles();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus Article.");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER & SEARCH/FILTER TABLE === */}
      <Card>
        <CardHeader className="flex flex-col gap-5">
          {/* === BAGIAN ATAS: JUDUL & TOMBOL === */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold">
              Article Management 📰
            </CardTitle>
            <Link href="/admin-article/article/add">
              <Button
                size="sm"
                className="w-full md:w-auto gap-2 cursor-pointer h-10">
                + Write Article
              </Button>
            </Link>
          </div>

          {/* === BAGIAN BAWAH: FILTER DAN PENCARIAN === */}
          <div className="flex flex-col lg:flex-row gap-4 items-center w-full">
            {/* 1. SEARCH (Akan melebar otomatis mengisi sisa ruang) */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search article title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* 2. KELOMPOK FILTER (Ukuran lebih konsisten) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* FILTER KATEGORI */}
              <div className="w-full sm:w-44">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FILTER AUTHOR */}
              <div className="w-full sm:w-44">
                <Select
                  value={selectedAuthor}
                  onValueChange={setSelectedAuthor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Penulis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Penulis</SelectItem>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FILTER STATUS PUBLISH */}
              <div className="w-full sm:w-44">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                    {/* Title & Slug */}
                    <TableCell className="font-medium">
                      <Link
                        href={`${process.env.NEXT_PUBLIC_CLIENT_ARTICLE_URL}/${data.slug}`}
                        target="_blank"
                        rel="noopener noreferrer">
                        <div
                          className="line-clamp-1 hover:text-blue-600 hover:underline cursor-pointer"
                          title={data.title_id}>
                          {data.title_id}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          /{data.slug}
                        </div>
                      </Link>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-sm">
                      {data.category?.name_id || data.category?.name_en || "-"}
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
                      <Link href={`/admin-article/article/edit/${data.id}`}>
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
