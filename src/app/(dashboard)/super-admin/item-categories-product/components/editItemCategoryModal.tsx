"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Mendefinisikan bentuk data yang akan diterima dari tabel
interface ItemCategoryData {
  id: string;
  name: string;
  description?: string;
  // Memastikan kita mendapatkan ID parent untuk pre-fill dropdown
  productCategoryId?: string;
}

interface EditItemCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: ItemCategoryData | null; // Data yang sedang di-edit
}

export function EditItemCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EditItemCategoryModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  // State form
  const [name, setName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [description, setDescription] = useState("");

  // 1. Ambil data Product Category untuk Dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const res = await fetchApi("/product-categories/list"); // Sesuaikan endpoint
          const result = await res.json();
          // Jika API list langsung mengembalikan array, gunakan result. Jika {data: []}, gunakan result.data
          setProductCategories(
            Array.isArray(result) ? result : result.data || [],
          );
        } catch (error) {
          console.error("Gagal memuat kategori produk", error);
        }
      };
      fetchCategories();
    }
  }, [isOpen, fetchApi]);

  // 2. Pre-fill form saat initialData berubah atau modal terbuka
  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      // Jika dari backend productCategoryId tersedia, set nilainya.
      // Jika backend hanya mengirim relasi, pastikan Anda menyesuaikannya.
      setProductCategoryId(initialData.productCategoryId || "");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    if (!name || !productCategoryId) {
      toast.error("Nama dan Parent Category wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      // Mengirim request PATCH/PUT ke endpoint dengan ID spesifik
      const res = await fetchApi(`/item-categories/${initialData.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, productCategoryId, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal memperbarui data");
      }

      toast.success("Item Category berhasil diperbarui!");
      onSuccess(); // Refresh tabel
      onClose(); // Tutup modal
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Item Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Product Category (Parent)</Label>
            <Select
              onValueChange={setProductCategoryId}
              value={productCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori induk..." />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_id || cat.name} {cat.code && `(${cat.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Item Category Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
