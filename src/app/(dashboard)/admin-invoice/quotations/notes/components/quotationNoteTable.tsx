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
import { apiUrl } from "@/helper/apiurl";
import { QuotationNoteForm } from "./quotationNoteForm";

type CategoryData = {
  id: string;
  name: string;
  isPublic: boolean; // Field baru khusus Quotation
  templates: { title: string; content: string }[];
  _count: { notes: number };
  createdAt: string;
};

export default function QuotationNoteCategory() {
  // === STATE DATA ===
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // === STATE UNTUK FORM DIALOG ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    null,
  );

  // === STATE ALERT DELETE ===
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // === FETCH DATA ===
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Endpoint Quotation Note Categories
      const res = await fetch(`${apiUrl}/quotation-notes-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat kategori.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === HANDLERS ===

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
    if (!deleteId) return;
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `${apiUrl}/quotation-notes-categories/${deleteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus");
      }

      toast.success("Kategori berhasil dihapus");
      setIsAlertOpen(false);
      fetchData(); // Refresh data setelah delete
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Filter Frontend Sederhana
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quotation Note Categories
          </h1>
          <p className="text-muted-foreground">
            Kelola kategori catatan penawaran (Public untuk PDF / Internal).
          </p>
        </div>
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
                <TableHead>Tipe</TableHead> {/* Kolom Baru */}
                <TableHead>Jumlah Templates</TableHead>
                <TableHead>Digunakan</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground">
                    Tidak ada data kategori.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>

                    {/* Visualisasi Tipe Public vs Internal */}
                    <TableCell>
                      {item.isPublic ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          Public (PDF)
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-muted-foreground">
                          Internal Only
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {Array.isArray(item.templates)
                          ? item.templates.length
                          : 0}{" "}
                        Items
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {item._count?.notes > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200">
                          {item._count.notes}x Quotes
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
      <QuotationNoteForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedCategory}
        onSuccess={fetchData}
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
                Quotation yang ada.
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
