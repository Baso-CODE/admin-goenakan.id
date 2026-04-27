"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FaqItemForm, { FaqItemFormValues } from "../../components/faqItemForm";

export default function AddFaqItem() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddFaq = async (data: FaqItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/content/faqs/items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat FAQ item");
      }

      toast.success("FAQ Item created successfully!");
      router.push("/super-admin/content/faqs");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create FAQ item:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create FAQ item",
      );
    }
  };
  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add FAQ Item
      </h2>
      <FaqItemForm onSubmit={handleAddFaq} />
    </div>
  );
}
