"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import ProductTagForm, { ProductTagFormValues } from "./formTagProduct";

export default function EditProductTag() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [tagData, setTagData] = useState<ProductTagFormValues | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Fetch data tag berdasarkan ID ===
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      setIsLoading(true);
      try {
        //  Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi(`/product-tags/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch tag data");
        }

        const data = await res.json();
        setTagData({
          name: data.name,
        });
      } catch (err: any) {
        console.error("❌ Failed to load data:", err);
        setTagData(undefined);
        toast.error(err.message || "Failed to load tag data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi]);

  const handleUpdateProductTag = async (data: ProductTagFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/product-tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update tag");
      }

      toast.success("Product Tag updated successfully!");
      router.push("/super-admin/product-tags");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Tag Error:", err);
      toast.error(err.message || "Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Product Tag
      </h2>

      <ProductTagForm
        initialData={tagData}
        onSubmit={handleUpdateProductTag}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
