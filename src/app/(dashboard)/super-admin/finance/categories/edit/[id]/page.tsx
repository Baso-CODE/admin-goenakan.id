"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FinanceCategoryForm, {
  FinanceCategoryFormValues,
} from "../../../components/financeCategoryForm";

export default function EditFinanceCategoryPage() {
  const { fetchApi, status } = useApi();

  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // State untuk menampung data lama dari database
  const [initialData, setInitialData] = useState<
    FinanceCategoryFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ============================
  // 1. FETCH DATA LAMA (GET)
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/finance/categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal mengambil data kategori");
        }

        const responseJson = await res.json();
        // Backend membungkus response di dalam properti "data"
        const data = responseJson.data;

        setInitialData({
          name: data.name,
          type: data.type,
          description: data.description || "",
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("❌ Failed to fetch category:", err);
        toast.error("Gagal memuat data kategori keuangan.");
        router.push("/super-admin/finance/categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]); // Tambahkan dependensi auth

  // ============================
  // 2. UPDATE DATA (PATCH)
  // ============================
  const handleUpdateCategory = async (
    formValues: FinanceCategoryFormValues,
  ) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/finance/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal mengupdate kategori");
      }

      toast.success("Kategori keuangan berhasil diupdate!");
      router.push("/super-admin/finance/categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to update category:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengupdate kategori",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================
  // 3. RENDER UI
  // ============================
  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Edit Kategori Keuangan
          </h2>
          <p className="text-sm text-muted-foreground font-mono bg-orange-100/50  px-2 py-0.5 rounded w-fit mt-1">
            ID: {id}
          </p>
        </div>
      </div>

      <FinanceCategoryForm
        initialData={initialData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
