"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormArticleBanner, {
  ArticleBannerFormValues,
} from "./formArticleBanner";

const AddArticleBanner = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBanner = async (data: ArticleBannerFormValues) => {
    try {
      setIsSubmitting(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // Asumsi route backend Anda bernama /article-banners
      const res = await fetch(`${apiUrl}/articles-banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
