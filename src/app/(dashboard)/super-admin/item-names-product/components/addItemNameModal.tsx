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

interface AddItemNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItemName: any) => void;
  parentCategoryId?: string;
  parentItemCategoryId?: string;

  //  TAMBAHAN BARU: Terima data langsung dari form utama
  productCategories: any[];
  itemCategories: any[];
}

export function AddItemNameModal({
  isOpen,
  onClose,
  onSuccess,
  parentCategoryId = "",
  parentItemCategoryId = "",
  productCategories = [], //  Tangkap datanya
  itemCategories = [], //  Tangkap datanya
}: AddItemNameModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);

  // State Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPC, setSelectedPC] = useState(parentCategoryId);
  const [itemCategoryId, setItemCategoryId] = useState(parentItemCategoryId);

  // Sync state ketika prop berubah atau modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedPC(parentCategoryId);
      setItemCategoryId(parentItemCategoryId);
    }
  }, [isOpen, parentCategoryId, parentItemCategoryId]);

  // ❌ Kita HAPUS useEffect fetch API karena datanya sudah dilempar dari props! Ini bikin modal jadi instan (tanpa loading).

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name || !itemCategoryId) {
      toast.error("Nama dan Item Category (Parent) wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/item-names", {
        method: "POST",
        body: JSON.stringify({ name, itemCategoryId, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan data");
      }

      const responseData = await res.json();
      toast.success("Item Name berhasil ditambahkan!");
      onSuccess(responseData.data || responseData);
      handleClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Item Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>1. Product Category</Label>
            <Select
              onValueChange={setSelectedPC}
              value={selectedPC}
              disabled={!!parentCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori Produk..." />
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
            <Label>2. Item Category (Parent)</Label>
            <Select
              onValueChange={setItemCategoryId}
              value={itemCategoryId}
              disabled={
                !!parentItemCategoryId ||
                !selectedPC ||
                itemCategories.length === 0
              }>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Item Category..." />
              </SelectTrigger>
              <SelectContent>
                {itemCategories.map((ic) => (
                  <SelectItem key={ic.id} value={ic.id}>
                    {ic.name} {ic.code && `(${ic.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>3. Item Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: MacBook Pro 14"
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
