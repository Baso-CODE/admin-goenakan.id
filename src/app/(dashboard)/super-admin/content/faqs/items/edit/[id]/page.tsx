"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FaqItemForm, {
  FaqItemFormValues,
} from "../../../components/faqItemForm";

export default function EditFaqItem() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [faqData, setFaqData] = useState<FaqItemFormValues | undefined>(
    undefined,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/content/faqs/items/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch FAQ data");
        }

        const data = await res.json();

        setFaqData({
          questionId: data.questionId,
          questionEn: data.questionEn,
          answerId: data.answerId,
          answerEn: data.answerEn,
          categoryId: data.categoryId.toString(),
          displayOrder: data.displayOrder,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
        });
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        toast.error(err.message || "Failed to load FAQ data.");
        router.push("/super-admin/content/faqs/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateFaq = async (formValues: FaqItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/content/faqs/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update FAQ item");
      }

      toast.success("FAQ Item updated successfully!");

      router.push("/super-admin/content/faqs/");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update FAQ item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit FAQ Item
      </h2>

      <FaqItemForm
        initialData={faqData}
        onSubmit={handleUpdateFaq}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
