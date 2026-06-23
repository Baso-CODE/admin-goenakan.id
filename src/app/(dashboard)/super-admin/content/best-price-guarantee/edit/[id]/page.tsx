"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import BestPriceItemForm, {
  BestPriceItemFormValues,
} from "../../components/bestPriceGuaranteeForm";

export default function EditBestPriceItem() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [itemData, setItemData] = useState<BestPriceItemFormValues | undefined>(
    undefined,
  );
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

        const res = await fetchApi(`/content/best-price-guarantee/items/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch item data");
        }

        const data = await res.json();

        // Update mapping untuk bilingual fields
        setItemData({
          titleId: data.titleId,
          titleEn: data.titleEn,
          contentId: data.contentId,
          contentEn: data.contentEn,
          categoryId: data.categoryId.toString(), // Select value harus string
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        toast.error(err.message || "Failed to load item data.");
        router.push("/super-admin/content/best-price-guarantee/items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // ============================
  // 2. UPDATE DATA
  // ============================
  const handleUpdateItem = async (formValues: BestPriceItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      const res = await fetchApi(`/content/best-price-guarantee/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update item");
      }

      toast.success("Best Price Item updated successfully!");

      router.push("/super-admin/content/best-price-guarantee/items");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Best Price Guarantee
      </h2>

      <BestPriceItemForm
        initialData={itemData}
        onSubmit={handleUpdateItem}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
