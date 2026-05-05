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
import { AddItemNameModal } from "./addItemNameModal";
import { EditItemNameModal } from "./editItemNameModal";

type ItemName = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  createdAt: string;
  itemCategoryId: string;
  itemCategory: {
    name: string;
    productCategory?: {
      name_id: string;
      name?: string;
    };
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ItemNames() {
  const { fetchApi, status } = useApi();

  const [itemNames, setItemNames] = useState<ItemName[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- MODAL STATE ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<ItemName | null>(null);

  // --- DELETE & EXPORT STATE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FETCH DATA ---
  const fetchItemNames = async () => {
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

      const res = await fetchApi(`/item-names?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");

      const result = await res.json();
      setItemNames(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Gagal memuat daftar item names");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemNames();
  }, [page, debouncedSearch, exportStartDate, exportEndDate, status, fetchApi]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/item-names/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus data");
      }
      toast.success("Item Name berhasil dihapus");
      setDeleteId(null);
      fetchItemNames();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportStartDate) params.append("startDate", exportStartDate);
      if (exportEndDate) params.append("endDate", exportEndDate);

      const response = await fetchApi(
        `/item-names/export/excel?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Export gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `item_names_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            Item Names Management
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search item name..."
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
                      "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white",
                      !exportStartDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                    onSelect={(date) =>
                      setExportStartDate(date ? format(date, "yyyy-MM-dd") : "")
                    }
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
                      "w-full justify-start text-left font-normal text-sm h-10 px-3 bg-white",
                      !exportEndDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                    onSelect={(date) =>
                      setExportEndDate(date ? format(date, "yyyy-MM-dd") : "")
                    }
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
            <Button
              className="bg-primary hover:bg-accent text-white gap-2 h-10"
              onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Item Name
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
                <TableHead className="w-[20%]">Parent Hierarchy</TableHead>
                <TableHead className="w-[20%]">Item Name</TableHead>
                <TableHead className="w-[10%]">Code</TableHead>
                <TableHead className="w-[20%]">Description</TableHead>
                <TableHead className="w-[15%]">Created</TableHead>
                <TableHead className="text-right w-[15%]">Actions</TableHead>
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
              ) : itemNames.length > 0 ? (
                itemNames.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-[oklch(0.98_0.02_90)] transition-colors">
                    {/* ✨ Menampilkan Product Category > Item Category */}
                    <TableCell className="text-sm">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        {item.itemCategory?.productCategory?.name_id ||
                          "No Prod Category"}
                      </div>
                      <div className="font-medium">
                        {item.itemCategory?.name || "-"}
                      </div>
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
                    Belum ada data item name ditemukan.
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
            Showing{" "}
            <span className="font-medium text-foreground">
              {itemNames.length}
            </span>{" "}
            of <span className="font-medium text-foreground">{meta.total}</span>{" "}
            items
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

      {/* RENDER MODALS */}
      <AddItemNameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setPage(1);
          fetchItemNames();
        }}
      />
      <EditItemNameModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItemForEdit(null);
        }}
        onSuccess={() => fetchItemNames()}
        initialData={selectedItemForEdit}
      />
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Menghapus Item Name ini tidak dapat dibatalkan. Pastikan tidak ada produk yang masih menggunakannya."
      />
    </div>
  );
}
