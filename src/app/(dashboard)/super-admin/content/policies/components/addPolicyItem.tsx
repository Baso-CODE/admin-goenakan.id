"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PolicyForm, { PolicyItemFormValues } from "./policyItemForm";

export default function AddPolicyItem() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPolicy = async (data: PolicyItemFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const payload = {
        titleId: data.titleId,
        titleEn: data.titleEn,
        contentId: data.contentId,
        contentEn: data.contentEn,
        categoryId: Number(data.categoryId),
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      };

      const res = await fetchApi("/content/policies/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat Policy item");
      }

      toast.success("Policy Item created successfully!");
      router.push("/super-admin/content/policies");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create Policy item:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create Policy item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Policy Item
      </h2>
      <PolicyForm onSubmit={handleAddPolicy} isSubmitting={isSubmitting} />
    </div>
  );
}
