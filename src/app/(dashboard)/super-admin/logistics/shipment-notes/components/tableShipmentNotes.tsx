"use client";

import {
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { ShipmentNoteForm } from "./shipmentNoteForm";

type CategoryData = {
  id: string;
  name: string;
  templates: { title: string; content: string }[];
  _count: { notes: number };
  createdAt: string;
};

export default function ShipmentNoteCategory() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // === STATE UNTUK FORM DIALOG (Component Terpisah) ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    null,
  );

  // === STATE ALERT DELETE ===
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // === FETCH DATA ===
  const fetchData = async () => {
    // 🛑 Guard: Jangan eksekusi jika sesi belum siap
    if (status !== "authenticated") return;

    setIsLoading(true);
    try {
      //  Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi("/shipment-notes-categories");

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch data");
      }

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("❌ Failed to load shipment notes categories:", error);
      toast.error("Gagal memuat kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, fetchApi]);

  // === HANDLERS (Hanya untuk mengatur State UI) ===

  // 1. Buka Form Create
  const handleCreate = () => {
    setSelectedCategory(null); // Mode Create
    setIsFormOpen(true);
  };

  // 2. Buka Form Edit
  const handleEdit = (category: CategoryData) => {
    setSelectedCategory(category); // Mode Edit
    setIsFormOpen(true);
  };

  // 3. Handle Delete
  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    try {
      const res = await fetchApi(`/shipment-notes-categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus kategori");
      }

      toast.success("Kategori berhasil dihapus");
      setIsAlertOpen(false);
      fetchData(); // Refresh data setelah delete
    } catch (error: any) {
      console.error("❌ Error delete shipment notes category:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  // Filter Frontend Sederhana
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6  mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Shipment Note Categories
          </h1>
          <p className="text-muted-foreground">
            Kelola kategori catatan dan template standar untuk proses
            pengiriman.
          </p>
        </div>
        {/* Tombol Add memanggil handleCreate (Bukan handleOpenCreate yang lama) */}
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Jumlah Templates</TableHead>
                <TableHead>Digunakan</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground">
                    Tidak ada data kategori.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {Array.isArray(item.templates)
                          ? item.templates.length
                          : 0}
                        Items
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item._count?.notes > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200">
                          {item._count.notes}x Shipments
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {/* Tombol Edit memanggil handleEdit */}
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setDeleteId(item.id);
                              setIsAlertOpen(true);
                            }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === FORM COMPONENT (Dialog Create/Edit) === */}
      <ShipmentNoteForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedCategory}
        onSuccess={fetchData} // Refresh table setelah sukses save
      />

      {/* === DELETE ALERT === */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus
              permanen.
              <br />
              <span className="text-red-500 font-medium text-xs mt-2 block">
                * Kategori tidak dapat dihapus jika sudah pernah digunakan dalam
                transaksi.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
