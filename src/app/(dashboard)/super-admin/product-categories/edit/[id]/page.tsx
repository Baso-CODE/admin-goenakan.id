"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import ProductCategoryForm from "../../components/formCategoryProduct";

export default function EditProductCategories() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      setIsLoading(true);
      try {
        const res = await fetchApi(`/product-categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch category data");
        }

        const data = await res.json();
        setCategoryData(data);
      } catch (err: any) {
        console.error("❌ Failed to load data:", err);
        toast.error(err.message || "Failed to load category data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi]); // Tambahkan dependensi auth

  // === 2. HANDLE UPDATE (DENGAN FORMDATA) ===
  const handleUpdateCategoryProduct = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/product-categories/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Product Category updated successfully!");
      router.push("/super-admin/product-categories");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Product Category
      </h2>

      <ProductCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategoryProduct}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
