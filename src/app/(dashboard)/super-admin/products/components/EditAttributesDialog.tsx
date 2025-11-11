"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
  attributes: { name: string; value: string }[];
  onUpdated: (newAttributes: { name: string; value: string }[]) => void;
}

export function EditAttributesDialog({
  productId,
  attributes,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [localAttrs, setLocalAttrs] = useState(attributes || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...localAttrs];
    updated[index] = { ...updated[index], [key]: value };
    setLocalAttrs(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `http://localhost:8000/products/${productId}/attributes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(localAttrs),
        }
      );

      toast.success("Update Atribut Success");
      onUpdated(localAttrs);
      setOpen(false);
    } catch (err) {
      toast.error("Gagal update atribut");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Atribut
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Atribut Produk</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {localAttrs.map((attr, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={attr.name}
                onChange={(e) => handleChange(i, "name", e.target.value)}
                placeholder="Nama atribut"
              />
              <Input
                value={attr.value}
                onChange={(e) => handleChange(i, "value", e.target.value)}
                placeholder="Nilai atribut"
              />
              <Button
                size="icon"
                variant="destructive"
                onClick={() =>
                  setLocalAttrs(localAttrs.filter((_, idx) => idx !== i))
                }
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setLocalAttrs([...localAttrs, { name: "", value: "" }])
            }
          >
            + Tambah Atribut
          </Button>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
