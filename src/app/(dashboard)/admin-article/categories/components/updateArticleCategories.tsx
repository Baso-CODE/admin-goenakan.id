"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiUrl } from "@/helper/apiurl";
import ArticleCategoryForm, {
  ArticleCategoryFormValues,
} from "./formArticleCategories";

export default function EditArticleCategory() {
  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<
    ArticleCategoryFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FETCH EXISTING DATA ===
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/article-categories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch category data");

        const data = await res.json();

        // Memasukkan data dari database ke dalam state Form
        setCategoryData({
          name: data.name,
          description: data.description || "", // Antisipasi null dari DB
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        setCategoryData(undefined);
        toast.error("Failed to load category data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // === SUBMIT UPDATE DATA ===
  const handleUpdateCategory = async (data: ArticleCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/article-categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Article Category updated successfully!");
      router.push("/super-admin/article-categories");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

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
