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
import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTag: { id: string; name: string; slug?: string }) => void;
}

export function AddTagModal({ isOpen, onClose, onSuccess }: AddTagModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Nama tag wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/product-tags", {
        method: "POST",
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyimpan tag");
      }

      const responseData = await res.json();
      const createdTag = responseData.data || responseData;

      toast.success("Tag berhasil ditambahkan!");
      onSuccess(createdTag);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan tag");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-stone-900 border">
        <DialogHeader>
          <DialogTitle>Add New Product Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="product-tag-name">Tag Name</Label>
            <Input
              id="product-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Best Seller, Ramah Lingkungan"
              autoFocus
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
