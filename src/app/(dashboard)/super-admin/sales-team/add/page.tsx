"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import SalesForm, { SalesFormValues } from "../components/FormSales";

export default function AddSalesPage() {
  const { fetchApi, status } = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const handleAddSales = async (data: SalesFormValues, file?: File) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);

    const formData = new FormData();

    // 1. Lampirkan file jika ada
    if (file) {
      formData.append("signature", file, file.name);
    }

    const { signatureFile, signatureUrl, ...salesData } = data;
    formData.append("data", JSON.stringify(salesData));

    try {
      const res = await fetchApi("/sales", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Failed to create sales person");
      }

      toast.success("Sales person created successfully!");

      router.push("/super-admin/sales");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Add Sales Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add sales person",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase"></h2>

      <SalesForm onSubmit={handleAddSales} isSubmitting={isSubmitting} />
    </div>
  );
}
