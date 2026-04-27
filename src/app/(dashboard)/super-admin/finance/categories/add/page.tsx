"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FinanceCategoryForm, {
  FinanceCategoryFormValues,
} from "../../components/financeCategoryForm";

export default function AddFinanceCategoryPage() {
  const { fetchApi, status } = useApi();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === HANDLE SUBMIT ===
  const handleAddCategory = async (data: FinanceCategoryFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/finance/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal membuat kategori keuangan");
      }

      // 3. Sukses & Redirect
      toast.success("Kategori keuangan berhasil ditambahkan!");
      router.push("/super-admin/finance/categories");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Error adding finance category:", err);
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Tambah Kategori Keuangan
          </h2>
          <p className="text-sm text-muted-foreground">
            Buat kategori baru untuk mengelompokkan arus kas masuk & keluar.
          </p>
        </div>
      </div>

      {/* FORM COMPONENT */}
      <FinanceCategoryForm
        onSubmit={handleAddCategory}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
