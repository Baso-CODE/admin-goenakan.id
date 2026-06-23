"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BestPriceItemForm, {
  BestPriceItemFormValues,
} from "./bestPriceGuaranteeForm";

export default function AddBestPriceItem() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const handleAddItem = async (data: BestPriceItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/content/best-price-guarantee/items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create best price item");
      }

      toast.success("Best Price Item created successfully!");
      router.push("/super-admin/content/best-price-guarantee");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create item:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create item");
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Best Price Guarantee
      </h2>
      <BestPriceItemForm onSubmit={handleAddItem} />
    </div>
  );
}
