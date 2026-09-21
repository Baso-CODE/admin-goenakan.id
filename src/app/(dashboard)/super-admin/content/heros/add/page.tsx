"use client";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../components/heroForm";

export default function AddHero() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  // 1. Update tipe parameter onSubmit untuk menerima object files
  const handleAddHero = async (
    data: HeroFormValues,
    files: { desktop?: File; mobile?: File; tablet?: File },
  ) => {
    if (status !== "authenticated") return;

    try {
      // 2. Validasi file wajib (Desktop dan Mobile) di frontend
      if (!files.desktop || !files.mobile) {
        toast.error("Please select both desktop and mobile images.");
        return;
      }

      // 3. Gunakan FormData
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.ctaText) formData.append("ctaText", data.ctaText);
      if (data.ctaLink) formData.append("ctaLink", data.ctaLink);
      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", data.isActive.toString());

      // 4. Append gambar sesuai dengan nama field di backend
      formData.append("imageDesktop", files.desktop);
      formData.append("imageMobile", files.mobile);
      if (files.tablet) formData.append("imageTablet", files.tablet);

      const res = await fetchApi("/content/heros", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create slide");
      }

      toast.success("Hero slide created successfully!");
      router.push("/super-admin/content/heros");
      router.refresh();
    } catch (err) {
      console.error("❌ Create Hero Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create slide",
      );
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
        Add Hero Slide
      </h2>
      <HeroForm onSubmit={handleAddHero} />
    </div>
  );
}
