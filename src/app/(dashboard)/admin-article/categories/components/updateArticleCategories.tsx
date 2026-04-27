"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import ArticleCategoryForm, {
  ArticleCategoryFormValues,
} from "./formArticleCategories";

export default function EditArticleCategory() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<
    ArticleCategoryFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FETCH EXISTING DATA ===
  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    setIsLoading(true);
    try {
      const res = await fetchApi(`/article-categories/${id}`);

      if (!res.ok) throw new Error("Failed to fetch category data");

      const response = await res.json();
      const data = response.data || response;

      setCategoryData({
        name: data.name,
        description: data.description || "",
        isActive: data.isActive ?? true,
      });
    } catch (err) {
      console.error("❌ Failed to load data:", err);
      setCategoryData(undefined);
      toast.error("Failed to load category data.");
    } finally {
      setIsLoading(false);
    }
  }, [id, status, fetchApi]);

  useEffect(() => {
    if (id) fetchData();
  }, [fetchData]);

  // === SUBMIT UPDATE DATA ===
  const handleUpdateCategory = async (data: ArticleCategoryFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi dengan method PATCH
      const res = await fetchApi(`/article-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Article Category updated successfully!");
      router.push("/admin-article/categories");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state jika session atau data sedang dimuat
  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Memuat data kategori...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Article Category
      </h2>

      <ArticleCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
