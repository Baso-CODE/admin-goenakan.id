"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, FileDown, Loader2, Search, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// === Type definitions ===
type ArticleTag = {
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

// === Schema untuk Form ===
const tagSchema = z.object({
  name: z.string().min(2, { message: "Nama tag minimal 2 karakter." }),
});
type TagFormValues = z.infer<typeof tagSchema>;

export default function ArticleTags() {
  const { fetchApi, status } = useApi();

  // --- STATE UNTUK TABLE ---
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- STATE UNTUK MODAL ADD/EDIT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ArticleTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi Form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "" },
  });

  // --- FUNGSI FETCH DATA ---
  const fetchTags = useCallback(async () => {
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

      const res = await fetchApi(`/article-tags?${params}`);

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setTags(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load article tags");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, fetchApi]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // --- FUNGSI BUKA MODAL ADD/EDIT ---
  const handleOpenAdd = () => {
    setEditingTag(null);
    form.reset({ name: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: ArticleTag) => {
    setEditingTag(tag);
    form.reset({ name: tag.name });
    setIsModalOpen(true);
  };

  // --- FUNGSI SUBMIT FORM (ADD & EDIT) ---
  const onSubmitForm = async (values: TagFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const url = editingTag
        ? `/article-tags/${editingTag.id}`
        : "/article-tags";
      const method = editingTag ? "PATCH" : "POST";

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `Failed to ${editingTag ? "update" : "create"} tag`,
        );
      }

      toast.success(
        `Article Tag berhasil di${editingTag ? "perbarui" : "tambahkan"}!`,
      );
      setIsModalOpen(false);
      fetchTags(); // Refresh tabel setelah sukses
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/article-tags/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete tag");

      toast.success("Article Tag berhasil dihapus!");
      setDeleteId(null);
      fetchTags();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(
        "Gagal menghapus Tag. Pastikan tag ini tidak sedang digunakan.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNGSI HANDLE EXPORT ---
  const handleExportTags = async () => {
    if (status !== "authenticated") return;

    setExporting(true);
    try {
      const exportFilters = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();
      const response = await fetchApi(
        `/article-tags/export/excel?${queryString}`,
      );

      if (!response.ok) throw new Error("Export failed.");

      const blob = await response.blob();
      const filenameMatch = response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `article_tags_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Article Tags berhasil di-export!");
    } catch (error) {
      toast.error("Gagal meng-export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 w-auto mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            Article Tags Management <Tag className="h-5 w-5" />
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Filter Export (Created Date):
          </h3>

          <div className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-50 justify-start text-left font-normal",
                    !exportStartDate && "text-muted-foreground",
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {exportStartDate ? (
                    format(new Date(exportStartDate), "PPP")
                  ) : (
                    <span>Start Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    exportStartDate ? new Date(exportStartDate) : undefined
                  }
                  onSelect={(date) =>
                    setExportStartDate(
                      date ? date.toISOString().split("T")[0] : "",
                    )
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-50 justify-start text-left font-normal",
                    !exportEndDate && "text-muted-foreground",
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {exportEndDate ? (
                    format(new Date(exportEndDate), "PPP")
                  ) : (
                    <span>End Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={exportEndDate ? new Date(exportEndDate) : undefined}
                  onSelect={(date) =>
                    setExportEndDate(
                      date ? date.toISOString().split("T")[0] : "",
                    )
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ✨ TOMBOL ADD DIGANTI UNTUK MEMBUKA MODAL */}
          <Button
            size="sm"
            className="gap-2 ml-auto bg-[#C4A48E] hover:bg-[#a38975]"
            onClick={handleOpenAdd}>
            + Add Tag
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
            onClick={handleExportTags}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </Card>

      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Tag Name</TableHead>
                <TableHead className="w-[30%]">Slug</TableHead>
                <TableHead className="w-[15%]">Created At</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-red-500 py-6">
                    Error loading tags.
                  </TableCell>
                </TableRow>
              ) : tags.length > 0 ? (
                tags.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell className="font-semibold">{data.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {data.slug}
                    </TableCell>
                    <TableCell>{formatDate(data.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* ✨ TOMBOL EDIT DIGANTI UNTUK MEMBUKA MODAL */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(data)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(data.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground">
                    No tags found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && (
        <div className="flex justify-between items-center p-4 text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
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

      {/* === MODAL ADD / EDIT TAG === */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Article Tag" : "Add Article Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Ubah nama tag artikel di bawah ini."
                : "Masukkan nama tag baru untuk artikel Anda."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitForm)}
              className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Tag</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Tips Bisnis, Edukasi..."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#C4A48E] hover:bg-[#a38975]">
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTag ? "Simpan Perubahan" : "Tambahkan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* === MODAL DELETE === */}
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Tag artikel yang dihapus akan otomatis terlepas dari semua artikel terkait. Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
