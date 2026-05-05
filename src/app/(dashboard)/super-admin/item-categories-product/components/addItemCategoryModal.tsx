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

interface AddItemCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: AddItemCategoryModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  // State form
  const [name, setName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [description, setDescription] = useState("");

  // Ambil data Product Category (Induk) untuk Dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const res = await fetchApi("/product-categories"); // Sesuaikan dengan endpoint list category kamu
          const result = await res.json();
          setProductCategories(result.data || []);
        } catch (error) {
          console.error("Gagal memuat kategori produk", error);
        }
      };
      fetchCategories();
    }
  }, [isOpen, fetchApi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !productCategoryId) {
      toast.error("Nama dan Parent Category wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/item-categories", {
        method: "POST",
        body: JSON.stringify({ name, productCategoryId, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan data");
      }

      toast.success("Item Category berhasil ditambahkan!");
      onSuccess(); // Refresh tabel
      handleClose(); // Tutup & Reset
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setProductCategoryId("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Item Category</DialogTitle>
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
