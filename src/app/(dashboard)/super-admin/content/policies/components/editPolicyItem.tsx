"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PolicyForm, { PolicyItemFormValues } from "./policyItemForm";

export default function EditPolicyItem() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [policyData, setPolicyData] = useState<
    PolicyItemFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/content/policies/items/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch Policy data");
        }

        const data = await res.json();
        setPolicyData({
          titleId: data.titleId,
          titleEn: data.titleEn,
          contentId: data.contentId,
          contentEn: data.contentEn,
          categoryId: String(data.categoryId),
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        toast.error(err.message || "Failed to load Policy data.");
        router.push("/super-admin/content/policies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // ============================
  // 2. UPDATE DATA
  // ============================
  const handleUpdatePolicy = async (formValues: PolicyItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      const payload = {
        titleId: formValues.titleId,
        titleEn: formValues.titleEn,
        contentId: formValues.contentId,
        contentEn: formValues.contentEn,
        categoryId: Number(formValues.categoryId),
        displayOrder: formValues.displayOrder,
        isActive: formValues.isActive,
      };

      const res = await fetchApi(`/content/policies/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update Policy item");
      }

      toast.success("Policy Item updated successfully!");

      router.push("/super-admin/content/policies");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update Policy item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Policy Item
      </h2>

      <PolicyForm
        initialData={policyData}
        onSubmit={handleUpdatePolicy}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
