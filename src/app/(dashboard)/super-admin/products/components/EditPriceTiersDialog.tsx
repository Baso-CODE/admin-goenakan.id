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
  priceTiers: { minQuantity: number; price: number }[];
  onUpdated: (newTiers: { minQuantity: number; price: number }[]) => void;
}

export function EditPriceTiersDialog({
  productId,
  priceTiers,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tiers, setTiers] = useState(priceTiers || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (i: number, key: string, value: string) => {
    const updated = [...tiers];
    updated[i] = { ...updated[i], [key]: Number(value) };
    setTiers(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `http://localhost:8000/products/${productId}/price-tiers`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tiers),
        }
      );

      toast.success("Update price tier success");
      onUpdated(tiers);
      setOpen(false);
    } catch (err) {
      toast.error("Gagal update price tier");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Harga Bertingkat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Harga Bertingkat</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="number"
                value={tier.minQuantity}
                onChange={(e) => handleChange(i, "minQuantity", e.target.value)}
                placeholder="Min Qty"
              />
              <Input
                type="number"
                value={tier.price}
                onChange={(e) => handleChange(i, "price", e.target.value)}
                placeholder="Harga"
              />
              <Button
                size="icon"
                variant="destructive"
                onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setTiers([...tiers, { minQuantity: 1, price: 0 }])}
          >
            + Tambah Tier
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
