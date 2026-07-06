"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PolicyCategoryForm, {
  PolicyCategoryFormValues,
} from "./policyCategoryForm";

export default function AddPolicyCategory() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (data: PolicyCategoryFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/content/policies/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create Policy category");
      }

      toast.success("Policy Category created successfully!");
      router.push("/super-admin/content/policies/categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create Policy category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Policy Category
      </h2>

      <PolicyCategoryForm
        onSubmit={handleAddCategory}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
