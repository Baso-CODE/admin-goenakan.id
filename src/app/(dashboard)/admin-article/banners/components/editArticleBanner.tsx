"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import FormArticleBanner, {
  ArticleBannerFormValues,
} from "./formArticleBanner";

export default function EditArticleBanner() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [bannerData, setBannerData] = useState<
    ArticleBannerFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FETCH EXISTING DATA ===
  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    setIsLoading(true);
    try {
      const res = await fetchApi(`/articles-banners/${id}`);

      if (!res.ok) throw new Error("Failed to fetch banner data");

      const response = await res.json();
      const data = response.data || response;

      // Memasukkan data dari database ke dalam state Form
      setBannerData({
        articleId: data.articleId,
        backgroundColor: data.backgroundColor || "#C4A48E",
        buttonText: data.buttonText || "Baca Selengkapnya",
        ctaLink: data.ctaLink || "",
        isActive: data.isActive ?? false,
      });
    } catch (err) {
      console.error("❌ Failed to load data:", err);
      setBannerData(undefined);
      toast.error("Failed to load banner data.");
    } finally {
      setIsLoading(false);
    }
  }, [id, status, fetchApi]);

  useEffect(() => {
    if (id) fetchData();
  }, [fetchData]);

  // === SUBMIT UPDATE DATA ===
  const handleUpdateBanner = async (data: ArticleBannerFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi dengan method PATCH
      const res = await fetchApi(`/articles-banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update banner");
      }

      toast.success("Article Banner updated successfully!");
      router.push("/admin-article/banners");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update banner");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Article Banner
      </h2>

      <FormArticleBanner
        initialData={bannerData}
        onSubmit={handleUpdateBanner}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
