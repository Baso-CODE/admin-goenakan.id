"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FinanceCategoryForm, {
  FinanceCategoryFormValues,
} from "../../components/financeCategoryForm";

export default function AddFinanceCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === HANDLE SUBMIT ===
  const handleAddCategory = async (data: FinanceCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Dapatkan Token
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Tembak API POST Create Category
      const res = await fetch(`${apiUrl}/finance/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Gagal membuat kategori keuangan");
      }

      // 3. Sukses & Redirect
      toast.success("Kategori keuangan berhasil ditambahkan!");
      router.push("/super-admin/finance/categories");
    } catch (err: any) {
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
