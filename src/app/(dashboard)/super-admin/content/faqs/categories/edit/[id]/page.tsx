"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FaqCategoryForm, {
  FaqCategoryFormValues,
} from "../../component/formFaqCategories";

export default function EditFaqCategory() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<
    FaqCategoryFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/content/faqs/categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch category data");
        }

        const data = await res.json();

        setCategoryData({
          nameId: data.nameId,
          nameEn: data.nameEn,
          descriptionId: data.descriptionId || "",
          descriptionEn: data.descriptionEn || "",
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        toast.error(err.message || "Failed to load category data.");
        router.push("/super-admin/content/faqs/categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateCategory = async (formValues: FaqCategoryFormValues) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      const res = await fetchApi(`/content/faqs/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      router.push("/super-admin/faqs/categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit FAQ Category
      </h2>

      <FaqCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
