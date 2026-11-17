"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { Edit3, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditLeadNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  currentName: string;
  onSuccess: () => void;
}

export function EditLeadNameDialog({
  open,
  onOpenChange,
  leadId,
  currentName,
  onSuccess,
}: EditLeadNameDialogProps) {
  const { fetchApi } = useApi();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName || "");
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/crm/leads/${leadId}/name`, {
        method: "PATCH",
        body: JSON.stringify({ displayName: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui nama lead");
      }

      toast.success("Nama panggilan lead berhasil disimpan!");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>Ubah Nama Lead</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Nama ini akan menjadi nama tampilan prioritas tertinggi untuk kontak ini di seluruh dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label className="text-xs font-semibold">Nama Panggilan / Identitas Lead</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pak Budi (Kaos Event)"
              className="h-9 text-xs"
              autoFocus
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
