"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FaqCategoryForm, {
  FaqCategoryFormValues,
} from "../component/formFaqCategories";

export default function AddFaqCategory() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddCategory = async (data: FaqCategoryFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/content/faqs/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat kategori FAQ");
      }

      toast.success("FAQ Category created successfully!");
      router.push("/super-admin/content/faqs/categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create FAQ category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    }
  };

  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add FAQ Category
      </h2>

      <FaqCategoryForm onSubmit={handleAddCategory} />
    </div>
  );
}
