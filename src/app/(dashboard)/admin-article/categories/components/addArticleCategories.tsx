"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ArticleCategoryForm, {
  ArticleCategoryFormValues,
} from "./formArticleCategories";

const AddArticleCategory = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (data: ArticleCategoryFormValues) => {
    try {
      setIsSubmitting(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");
      const res = await fetch(`${apiUrl}/article-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
