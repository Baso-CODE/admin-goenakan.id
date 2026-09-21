"use client";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../../components/heroForm";

export default function EditHero() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  // 1. UPDATE TIPE STATE: Tambahkan imageMobileUrl dan imageTabletUrl
  const [heroData, setHeroData] = useState<
    | (HeroFormValues & {
        imageUrl?: string;
        imageMobileUrl?: string;
        imageTabletUrl?: string | null;
      })
    | undefined
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

        // 2. UPDATE SET DATA: Masukkan juga URL gambar untuk Mobile dan Tablet
        setHeroData({
          title: data.title,
          altText: data.altText,
          ctaText: data.ctaText,
          ctaLink: data.ctaLink,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
          imageUrl: data.imageUrl,
          imageMobileUrl: data.imageMobileUrl,
          imageTabletUrl: data.imageTabletUrl,
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
  // 3. UPDATE PARAMETER FILE: Tangkap file desktop, mobile, dan tablet
  const handleUpdateHero = async (
    data: HeroFormValues,
    files: { desktop?: File; mobile?: File; tablet?: File },
  ) => {
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

      // 4. APPEND FILES JIKA ADA PERUBAHAN
      if (files.desktop) {
        formData.append("imageDesktop", files.desktop);
      }
      if (files.mobile) {
        formData.append("imageMobile", files.mobile);
      }
      if (files.tablet) {
        formData.append("imageTablet", files.tablet);
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
    <div className="space-y-4 mx-auto">
      <Link
        href="/super-admin/content/heros"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Hero
      </Link>

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
