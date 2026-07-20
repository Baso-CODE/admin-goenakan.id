"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Box,
  CalendarIcon,
  FileDown,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddItemCategoryModal } from "./addItemCategoryModal";
import { EditItemCategoryModal } from "./editItemCategoryModal";

type ItemCategory = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  createdAt: string;
  productCategory: {
    name_id: string;
    name?: string;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ItemCategories() {
  const { fetchApi, status } = useApi();

  // --- STATE ---
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- MODAL STATE ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<ItemCategory | null>(null);

  // --- DELETE STATE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- EXPORT STATE ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FETCH DATA ---
  const fetchCategories = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      if (exportStartDate) params.append("startDate", exportStartDate);
      if (exportEndDate) params.append("endDate", exportEndDate);

      const res = await fetchApi(`/item-categories?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Gagal memuat daftar item categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, exportStartDate, exportEndDate, status, fetchApi]);

  // --- DELETE HANDLE ---
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/item-categories/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus data");
      }
      toast.success("Item Category berhasil dihapus");
      setDeleteId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- EXPORT HANDLE ---
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportStartDate) params.append("startDate", exportStartDate);
      if (exportEndDate) params.append("endDate", exportEndDate);

      const response = await fetchApi(
        `/item-categories/export/excel?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Export gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `item_categories_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Data berhasil di-export!");
    } catch (error) {
      toast.error("Gagal meng-export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <Card className="border-border">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[oklch(0.98_0.02_90)]">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Box className="h-6 w-6 text-primary" />
            Item Categories Management
          </CardTitle>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-white"
            />
          </div>
        </CardHeader>
      </Card>

      {/* FILTERS & ACTIONS */}
      <Card className="p-4 border-border">
        <div className="flex flex-wrap items-end gap-4">
          {/* ... (Date picker Filters Sama Persis) ... */}
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Start Date Picker */}
            <div className="flex flex-col gap-1.5 w-1/2 sm:w-40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                Start Date
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white border-border",
                      !exportStartDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4 " />
                    {exportStartDate ? (
                      format(new Date(exportStartDate), "dd MMM yyyy", {
                        locale: id,
                      })
                    ) : (
                      <span>Pick date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      exportStartDate ? new Date(exportStartDate) : undefined
                    }
                    onSelect={(date) => {
                      const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                      setExportStartDate(dateStr);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div className="flex flex-col gap-1.5 w-1/2 sm:w-40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                End Date
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white border-border",
                      !exportEndDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4 " />
                    {exportEndDate ? (
                      format(new Date(exportEndDate), "dd MMM yyyy", {
                        locale: id,
                      })
                    ) : (
                      <span>Pick date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      exportEndDate ? new Date(exportEndDate) : undefined
                    }
                    onSelect={(date) => {
                      const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                      setExportEndDate(dateStr);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white h-10"
              onClick={handleExport}
              disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Export Excel
            </Button>

            {/*  UPDATE: Buka Modal, Bukan Pindah Halaman */}
            <Button
              className="bg-primary hover:bg-accent text-white gap-2 h-10"
              onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Item Category
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[oklch(0.95_0.02_85)]">
              <TableRow>
                <TableHead className=" text-foreground w-[20%]">
                  Parent Category
                </TableHead>
                <TableHead className=" text-foreground w-[20%]">
                  Item Category Name
                </TableHead>
                <TableHead className=" text-foreground w-[10%]">Code</TableHead>
                <TableHead className=" text-foreground w-[20%]">
                  Description
                </TableHead>
                <TableHead className=" text-foreground w-[15%]">
                  Created
                </TableHead>
                <TableHead className=" text-foreground text-right w-[15%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-[oklch(0.98_0.02_90)] transition-colors">
                    {/*  BARU: Menampilkan Kategori Induk */}
                    <TableCell className="font-medium text-muted-foreground">
                      {item.productCategory?.name_id ||
                        item.productCategory?.name ||
                        "-"}
                    </TableCell>

                    <TableCell className="font-bold text-primary">
                      {item.name}
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {item.code}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-50 truncate text-sm">
                      {item.description || (
                        <span className="text-stone-300 italic">
                          No description
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatDate(item.createdAt, { style: "datetime" })}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-accent hover:bg-[oklch(0.93_0.02_85)]"
                        onClick={() => {
                          setSelectedItemForEdit(item);
                          setIsEditModalOpen(true);
                        }}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteId(item.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground italic">
                    Belum ada data item category ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {meta && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing
            <span className="font-medium text-foreground">
              {categories.length}
            </span>
            of <span className="font-medium text-foreground">{meta.total}</span>
            categories
          </p>
          <div className="flex gap-2">
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

      {/*  RENDER MODAL DI SINI */}
      <AddItemCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchCategories();
        }}
      />
      <EditItemCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        onSuccess={() => fetchCategories()}
        initialData={selectedItemForEdit}
      />
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Menghapus Item Category ini tidak dapat dibatalkan. Pastikan tidak ada produk yang masih menggunakan kategori ini."
      />
    </div>
  );
}
