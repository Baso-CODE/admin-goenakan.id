"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../../components/heroForm";

export default function EditHero() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  // Tipe data state mencakup imageUrl untuk preview
  const [heroData, setHeroData] = useState<
    (HeroFormValues & { imageUrl: string }) | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 1. FETCH EXISTING DATA ===
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/content/heros/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch hero data");
        }

        const data = await res.json();

        setHeroData({
          title: data.title,
          altText: data.altText,
          ctaText: data.ctaText,
          ctaLink: data.ctaLink,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
          imageUrl: data.imageUrl,
        });
      } catch (err: any) {
        console.error("❌ Fetch Error:", err);
        toast.error(err.message || "Failed to load hero data.");
        router.push("/super-admin/content/heros");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  // === 2. HANDLE UPDATE ===
  const handleUpdateHero = async (data: HeroFormValues, file?: File) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      // === GUNAKAN FORM DATA ===
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("altText", data.altText || "");
      formData.append("ctaText", data.ctaText || "");
      formData.append("ctaLink", data.ctaLink || "");
      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", String(data.isActive));

      if (file) {
        formData.append("image", file);
      }

      const res = await fetchApi(`/content/heros/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update slide");
      }

      toast.success("Hero slide updated successfully!");
      router.push("/super-admin/content/heros");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Failed to update slide");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Hero Slide
      </h2>
      <HeroForm
        initialData={heroData}
        onSubmit={handleUpdateHero}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
