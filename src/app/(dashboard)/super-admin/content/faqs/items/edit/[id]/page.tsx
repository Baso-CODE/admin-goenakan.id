"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FaqItemForm, {
  FaqItemFormValues,
} from "../../../components/faqItemForm";

export default function EditFaqItem() {
  const { id } = useParams();
  const router = useRouter();

  const [faqData, setFaqData] = useState<FaqItemFormValues | undefined>(
    undefined,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // 1. FETCH DATA (Load Initial Data)
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Ambil Token
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        // Fetch Data FAQ by ID
        const res = await fetch(`${apiUrl}/content/faqs/items/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch FAQ data");

        const data = await res.json();

        // Map data dari API ke format Form Values
        setFaqData({
          question: data.question,
          answer: data.answer,
          categoryId: data.categoryId,
          displayOrder: data.displayOrder,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load FAQ data.");
        router.push("/super-admin/content/faqs/");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  const handleUpdateFaq = async (formValues: FaqItemFormValues) => {
    try {
      setIsSubmitting(true);

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // Kirim Request PATCH
      const res = await fetch(`${apiUrl}/content/faqs/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || errText);
        } catch {
          throw new Error(errText);
        }
      }

      toast.success("FAQ Item updated successfully!");
      router.push("/super-admin/content/faqs/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update FAQ item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4  mx-auto">
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
