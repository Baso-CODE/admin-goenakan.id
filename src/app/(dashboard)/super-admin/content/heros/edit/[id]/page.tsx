"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../../components/heroForm";

export default function EditHero() {
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
      try {
        setIsLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/content/heros/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch hero data");

        const data = await res.json();

        setHeroData({
          title: data.title,
          altText: data.altText,
          ctaText: data.ctaText,
          ctaLink: data.ctaLink,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
          imageUrl: data.imageUrl, // Penting untuk preview
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hero data.");
        router.push("/super-admin/content/heros");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  // === 2. HANDLE UPDATE ===
  const handleUpdateHero = async (data: HeroFormValues, file?: File) => {
    try {
      setIsSubmitting(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token found");

      // === GUNAKAN FORM DATA ===
      const formData = new FormData();
      formData.append("title", data.title);

      formData.append("altText", data.altText || "");
      formData.append("ctaText", data.ctaText || "");
      formData.append("ctaLink", data.ctaLink || "");

      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", String(data.isActive));

      // Append File HANYA JIKA ada file baru
      if (file) {
        formData.append("image", file);
      }

      const res = await fetch(`${apiUrl}/content/heros/${id}`, {
        method: "PATCH", // Gunakan PATCH untuk update partial
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type otomatis multipart/form-data
        },
        body: formData,
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

      toast.success("Hero slide updated successfully!");
      router.push("/super-admin/content/heros");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update slide",
      );
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
