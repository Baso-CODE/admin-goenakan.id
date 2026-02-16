"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FinanceCategoryForm, {
  FinanceCategoryFormValues,
} from "../../../components/financeCategoryForm";

export default function EditFinanceCategoryPage() {
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
      if (!id) return;

      try {
        setIsLoading(true);

        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Gagal mengambil token");
        const { token } = await tokenRes.json();

        // Ambil data kategori berdasarkan ID
        const res = await fetch(`${apiUrl}/finance/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data kategori");

        const responseJson = await res.json();
        // Backend kita membungkus response di dalam properti "data"
        const data = responseJson.data;

        // Set state agar form terisi dengan data lama
        setInitialData({
          name: data.name,
          type: data.type,
          description: data.description || "",
          isActive: data.isActive,
        });
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data kategori keuangan.");
        router.push("/super-admin/finance/categories"); // Lempar balik jika ID tidak valid
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // ============================
  // 2. UPDATE DATA (PATCH)
  // ============================
  const handleUpdateCategory = async (
    formValues: FinanceCategoryFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Update menggunakan method PATCH
      const res = await fetch(`${apiUrl}/finance/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Gagal mengupdate kategori");
      }

      toast.success("Kategori keuangan berhasil diupdate!");
      router.push("/super-admin/finance/categories");
    } catch (err) {
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
