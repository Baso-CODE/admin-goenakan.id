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
import { useCachedApi } from "@/hooks/useCachedApi";
import { formatDate } from "@/utils/formatDate";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPageNumbers(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set<number>([
    1,
    2,
    totalPages - 1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  // Tampilkan lebih banyak nomor ketika dekat awal.
  if (currentPage <= 3) {
    visible.add(3);
    visible.add(4);
  }

  // Tampilkan lebih banyak nomor ketika dekat akhir.
  if (currentPage >= totalPages - 2) {
    visible.add(totalPages - 2);
    visible.add(totalPages - 3);
  }

  const sorted = [...visible]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const result: PageItem[] = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];

    if (previous !== undefined) {
      const gap = page - previous;

      if (gap === 2) {
        result.push(previous + 1);
      } else if (gap > 2) {
        result.push(index <= 2 ? "ellipsis-left" : "ellipsis-right");
      }
    }

    result.push(page);
  });

  return result;
}

export default function ArticlesSection() {
  const { fetchApi, status } = useApi();
  const queryClient = useQueryClient();

  // ==========================================
  // STATE FILTER & PAGINATION
  // ==========================================

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);

  const [page, setPage] = useState(1);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // ==========================================
  // DELETE STATE
  // ==========================================

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // FETCH ARTICLE CATEGORIES
  // ==========================================

  type ArticleCategory = {
    id: string;
    name_id: string;
    name_en?: string | null;
  };

  type ArticleAuthor = {
    id: string;
    name: string;
  };

  type ListResponse<T> =
    | T[]
    | {
        data: T[];
      };

  const { data: categoryResponse } = useCachedApi<
    ListResponse<ArticleCategory>
  >(["article-categories", "list"], "/article-categories/list", {
    staleTime: 10 * 60 * 1000,
  });

  const categories: ArticleCategory[] = Array.isArray(categoryResponse)
    ? categoryResponse
    : (categoryResponse?.data ?? []);

  // ==========================================
  // FETCH ARTICLE AUTHORS
  // ==========================================

  const { data: authorResponse } = useCachedApi<ListResponse<ArticleAuthor>>(
    ["articles", "authors"],
    "/articles/authors",
    {
      staleTime: 10 * 60 * 1000,
    },
  );

  const authors: ArticleAuthor[] = Array.isArray(authorResponse)
    ? authorResponse
    : (authorResponse?.data ?? []);

  // ==========================================
  // BUILD QUERY PARAMS
  // ==========================================

  const params = new URLSearchParams({
    page: String(page),
    take: "10",
  });

  const searchValue = String(debouncedSearch ?? "").trim();

  if (searchValue) {
    params.set("search", searchValue);
  }

  if (selectedCategory !== "all") {
    params.set("categoryId", selectedCategory);
  }

  if (selectedAuthor !== "all") {
    params.set("authorId", selectedAuthor);
  }

  if (selectedStatus !== "all") {
    params.set("published", selectedStatus);
  }

  const endpoint = `/articles?${params.toString()}`;

  // ==========================================
  // TANSTACK QUERY - ARTICLES
  // ==========================================

  type ArticleResponse = {
    data: Article[];
    meta: Meta;
  };

  const {
    data: articleResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
  } = useCachedApi<ArticleResponse>(["articles", "list", endpoint], endpoint, {
    staleTime: 5 * 60 * 1000,
  });

  // ==========================================
  // DATA UNTUK JSX
  // ==========================================

  const articles: Article[] = articleResponse?.data ?? [];

  const meta: Meta | null = articleResponse?.meta ?? null;

  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / Math.max(1, meta.perPage || 10)))
    : 1;

  const pageNumbers = getPageNumbers(Math.min(page, totalPages), totalPages);

  const isPaginationDisabled = loading || isFetching;

  const goToPage = (targetPage: number) => {
    if (
      isPaginationDisabled ||
      targetPage < 1 ||
      targetPage > totalPages ||
      targetPage === page
    ) {
      return;
    }

    setPage(targetPage);
  };

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Gagal mengambil data artikel."
    : null;

  // ==========================================
  // DELETE ARTICLE
  // ==========================================

  const handleDelete = async () => {
    if (!deleteId || isDeleting || status !== "authenticated") {
      return;
    }

    const articleId = deleteId;

    try {
      setIsDeleting(true);

      const res = await fetchApi(`/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(errorData.message || "Gagal menghapus artikel.");
      }

      toast.success("Artikel berhasil dihapus!");

      setDeleteId(null);

      // ==========================================
      // INVALIDASI CACHE
      // ==========================================

      await queryClient.invalidateQueries({
        queryKey: ["articles", "list"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["article-detail", articleId],
      });

      // Jika artikel terakhir pada halaman dihapus,
      // kembali ke halaman sebelumnya.
      if (articles.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Delete Article Error:", error);

      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus artikel.",
      );
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 w-full"
              />
            </div>

            {/* 2. KELOMPOK FILTER (Ukuran lebih konsisten) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* FILTER KATEGORI */}
              <div className="w-full sm:w-44">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setPage(1);
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>

                    <SelectItem value="__uncategorized__">
                      Uncategorized
                    </SelectItem>

                    {categories
                      .filter(
                        (cat) =>
                          !["uncategorized", "tanpa kategori"].includes(
                            cat.name_id.trim().toLowerCase(),
                          ),
                      )
                      .map((cat) => (
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
                  onValueChange={(value) => {
                    setSelectedAuthor(value);
                    setPage(1);
                  }}>
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
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    setPage(1);
                  }}>
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

      {/* ==========================================
    PAGINATION - NUMBERED
========================================== */}
      {meta && (
        <div className="flex flex-col gap-4 border-t p-4 md:flex-row md:items-center md:justify-between">
          {/* PAGINATION INFORMATION */}
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {meta.total === 0 ? 0 : (page - 1) * (meta.perPage || 10) + 1}
            </span>
            {" - "}
            <span className="font-semibold text-foreground">
              {Math.min(page * (meta.perPage || 10), meta.total)}
            </span>
            {" of "}
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" articles"}
          </div>

          {/* NUMBERED PAGE BUTTONS */}
          <nav
            aria-label="Article pagination"
            className="flex flex-wrap items-center justify-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || isPaginationDisabled}
              onClick={() => goToPage(page - 1)}
              className="h-9 min-w-20 rounded-lg">
              Previous
            </Button>

            {pageNumbers.map((item, index) => {
              if (typeof item !== "number") {
                return (
                  <span
                    key={`${item}-${index}`}
                    aria-hidden="true"
                    className="flex h-9 w-8 items-center justify-center text-sm text-muted-foreground">
                    ...
                  </span>
                );
              }

              const isActive = item === page;

              return (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  aria-label={`Page ${item}`}
                  aria-current={isActive ? "page" : undefined}
                  disabled={isPaginationDisabled}
                  onClick={() => goToPage(item)}
                  className={`h-9 min-w-9 rounded-lg px-2.5 ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:border-primary/40 hover:text-primary"
                  }`}>
                  {item}
                </Button>
              );
            })}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isPaginationDisabled}
              onClick={() => goToPage(page + 1)}
              className="h-9 min-w-16 rounded-lg">
              Next
            </Button>
          </nav>
        </div>
      )}

      {/* === DELETE DIALOG === */}
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeleteId(null);
          }
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Artikel?"
        description="Apakah Anda yakin ingin menghapus artikel ini secara permanen?"
        warningMessage="Data yang sudah dihapus tidak dapat dikembalikan."
      />
    </div>
  );
}
