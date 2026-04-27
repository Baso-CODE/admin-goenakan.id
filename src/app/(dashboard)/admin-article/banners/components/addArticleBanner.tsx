"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormArticleBanner, {
  ArticleBannerFormValues,
} from "./formArticleBanner";

const AddArticleBanner = () => {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBanner = async (data: ArticleBannerFormValues) => {
    // 🛑 Jangan kirim jika sesi belum siap
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetchApi("/articles-banners", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create banner");
      }

      toast.success("Article Banner created successfully!");
      router.push("/admin-article/banners");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Article Banner
      </h2>
      <FormArticleBanner
        onSubmit={handleAddBanner}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddArticleBanner;
