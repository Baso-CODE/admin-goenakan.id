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
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditItemNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: any | null;
}

export function EditItemNameModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EditItemNameModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);

  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPC, setSelectedPC] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // 1. Fetch Product Categories
  useEffect(() => {
    if (isOpen) {
      const fetchPC = async () => {
        try {
          const res = await fetchApi("/product-categories/list");
          const result = await res.json();
          setProductCategories(
            Array.isArray(result) ? result : result.data || [],
          );
        } catch (error) {
          console.error("Gagal memuat product categories", error);
        }
      };
      fetchPC();
    }
  }, [isOpen, fetchApi]);

  // 2. Pre-fill data
  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");

      // Ambil productCategoryId dari nested object
      const pcId = initialData.itemCategory?.productCategoryId || "";
      setSelectedPC(pcId);
      setItemCategoryId(initialData.itemCategoryId || "");
      setIsActive(initialData.isActive !== false);
    }
  }, [initialData, isOpen]);

  // 3. Fetch Item Categories jika selectedPC berubah
  useEffect(() => {
    if (selectedPC && isOpen) {
      const fetchIC = async () => {
        try {
          const res = await fetchApi(
            `/item-categories?productCategoryId=${selectedPC}&take=100`,
          );
          const result = await res.json();
          setItemCategories(result.data || []);
        } catch (error) {
          console.error("Gagal memuat item categories", error);
        }
      };
      fetchIC();
    } else {
      setItemCategories([]);
    }
  }, [selectedPC, isOpen, fetchApi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    if (!name || !itemCategoryId) {
      toast.error("Nama dan Item Category (Parent) wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi(`/item-names/${initialData.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, itemCategoryId, description, isActive }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal memperbarui data");
      }

      toast.success("Item Name berhasil diperbarui!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-108.25">
        <DialogHeader>
          <DialogTitle>Edit Item Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>1. Product Category</Label>
            <Select
              onValueChange={(val) => {
                setSelectedPC(val);
                setItemCategoryId(""); // Reset anak jika induk berubah
              }}
              value={selectedPC}>
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
              disabled={!selectedPC || itemCategories.length === 0}>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Status Aktif</Label>
              <p className="text-xs text-muted-foreground">
                Tampilkan item name ini di sisi publik (storefront).
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
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
