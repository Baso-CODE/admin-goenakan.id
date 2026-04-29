"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import MaterialTypeForm, { MaterialTypeFormValues } from "./materialTypeForm";

export default function EditMaterialType() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [materialData, setMaterialData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      setIsLoading(true);
      try {
        const res = await fetchApi(`/material-types/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal mengambil data material");
        }

        const data = await res.json();
        setMaterialData(data);
      } catch (err: any) {
        console.error("❌ Failed to load material data:", err);
        toast.error(err.message || "Gagal memuat data material.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi]);

  // === 2. HANDLE UPDATE (JSON) ===
  const handleUpdateMaterial = async (values: MaterialTypeFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/material-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memperbarui material");
      }

      toast.success("Material Type updated successfully!");
      router.push("/super-admin/product-materials");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Gagal memperbarui material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight uppercase text-foreground">
          Edit Material Type
        </h2>
        <p className="text-sm text-muted-foreground">
          Ubah informasi material untuk menyesuaikan spesifikasi produk.
        </p>
      </div>

      <MaterialTypeForm
        initialData={materialData}
        onSubmit={handleUpdateMaterial}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
