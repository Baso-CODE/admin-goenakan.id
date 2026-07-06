"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CategoryBestPriceGuaranteeForm, {
  BestPriceCategoryFormValues,
} from "./categortBestPriceGuaranteeForm";

export default function AddCategoryBestPriceGuarantee() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const handleAddCategory = async (data: BestPriceCategoryFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/content/best-price-guarantee/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || "Failed to create Best Price Category",
        );
      }

      toast.success("Category created successfully!");
      // Sesuaikan route redirect ini dengan URL tabel kategori Anda
      router.push("/super-admin/content/best-price-guarantee/categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Best Price Category
      </h2>

      <CategoryBestPriceGuaranteeForm onSubmit={handleAddCategory} />
    </div>
  );
}
