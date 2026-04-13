"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiUrl } from "@/helper/apiurl";
import FormArticleBanner, {
  ArticleBannerFormValues,
} from "./formArticleBanner";

export default function EditArticleBanner() {
  const { id } = useParams();
  const router = useRouter();

  const [bannerData, setBannerData] = useState<
    ArticleBannerFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FETCH EXISTING DATA ===
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/articles-banners/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch banner data");

        const data = await res.json();

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
    };

    if (id) fetchData();
  }, [id]);

  // === SUBMIT UPDATE DATA ===
  const handleUpdateBanner = async (data: ArticleBannerFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/article-banners/${id}`, {
        method: "PATCH", // Menggunakan method PATCH sesuai controller Anda
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update banner");
      }

      toast.success("Article Banner updated successfully!");
      router.push("/admin-article/banners"); // Sesuaikan URL list banner Anda
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
