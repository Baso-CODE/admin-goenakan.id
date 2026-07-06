"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PolicyCategoryForm, {
  PolicyCategoryFormValues,
} from "./policyCategoryForm";

export default function EditPolicyCategory() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<
    PolicyCategoryFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // 1. FETCH DATA (Load Initial Data)
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/content/policies/categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch category data");
        }

        const data = await res.json();

        // Menyesuaikan mapping dengan skema PolicyCategory (Bilingual)
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
        router.push("/super-admin/content/policies/categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // ============================
  // 2. UPDATE DATA
  // ============================
  const handleUpdateCategory = async (formValues: PolicyCategoryFormValues) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      const res = await fetchApi(`/content/policies/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Policy Category updated successfully!");

      router.push("/super-admin/content/policies/categories");
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
    <div className="space-y-4 mx-auto w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Policy Category
      </h2>

      <PolicyCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
