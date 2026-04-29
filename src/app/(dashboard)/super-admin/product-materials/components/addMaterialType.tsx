"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import MaterialTypeForm, { MaterialTypeFormValues } from "./materialTypeForm";

const AddMaterialType = () => {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMaterial = async (values: MaterialTypeFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/material-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create material type");
      }

      toast.success("Material Type created successfully!");
      router.push("/super-admin/product-materials");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Material Error:", err);
      toast.error(err.message || "Failed to create material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight uppercase text-foreground">
          Add New Material
        </h2>
        <p className="text-sm text-muted-foreground">
          Tambahkan jenis material baru untuk produk Goenakan.
        </p>
      </div>

      <MaterialTypeForm
        onSubmit={handleAddMaterial}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddMaterialType;
