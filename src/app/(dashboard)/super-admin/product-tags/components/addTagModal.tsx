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
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  slug?: string;
}

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTags: Tag[]) => void;
}

export function AddTagModal({ isOpen, onClose, onSuccess }: AddTagModalProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const parsedTags = useMemo(() => {
    return Array.from(
      new Set(
        name
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (parsedTags.length === 0) {
      toast.error("Nama tag wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi("/product-tags/bulk", {
        method: "POST",
        body: JSON.stringify({
          names: parsedTags,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal menyimpan tag");
      }

      const responseData = await res.json();
      const createdTags = Array.isArray(responseData)
        ? responseData
        : responseData.data || [];

      toast.success(`${createdTags.length} tag berhasil diproses`);

      onSuccess(createdTags);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-stone-900 border">
        <DialogHeader>
          <DialogTitle>Tambah Tag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="product-tag-name">Nama Tag</Label>

            <Input
              id="product-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Belajar, Mengaji, Alquran"
              autoFocus
              disabled={loading}
            />

            <p className="text-xs text-muted-foreground">
              Pisahkan beberapa tag dengan koma.
            </p>

            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border bg-stone-50 px-2 py-1 text-xs text-stone-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}>
              Batal
            </Button>

            <Button type="submit" disabled={loading || parsedTags.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
              {parsedTags.length > 0 ? ` (${parsedTags.length})` : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
