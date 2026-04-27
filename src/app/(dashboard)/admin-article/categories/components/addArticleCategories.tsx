"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ArticleCategoryForm, {
  ArticleCategoryFormValues,
} from "./formArticleCategories";

const AddArticleCategory = () => {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (data: ArticleCategoryFormValues) => {
    // 🛑 Validasi status auth
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetchApi("/article-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create category");
      }

      toast.success("Article Category created successfully!");
      router.push("/admin-article/categories");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Article Category
      </h2>
      <ArticleCategoryForm
        onSubmit={handleAddCategory}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddArticleCategory;
