"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ReplacementOrderForm, {
  ReplacementFormValues,
} from "./formReplacementOrder";

export default function AddReplacementOrder() {
  const { fetchApi } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ReplacementFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi("/replacement-orders", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat Replacement Order");
      }

      toast.success("Replacement Order berhasil dibuat!");
      router.push("/super-admin/replacement-orders");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" mx-auto space-y-4">
      <ReplacementOrderForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
