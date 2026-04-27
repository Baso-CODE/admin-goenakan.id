"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../components/heroForm";

export default function AddHero() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddHero = async (data: HeroFormValues, file?: File) => {
    if (status !== "authenticated") return;

    try {
      if (!file) {
        toast.error("Please select an image for the slide.");
        return;
      }

      // === GUNAKAN FORM DATA (Bukan JSON) ===
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.ctaText) formData.append("ctaText", data.ctaText);
      if (data.ctaLink) formData.append("ctaLink", data.ctaLink);
      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", data.isActive.toString());
      formData.append("image", file);

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
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Hero Slide
      </h2>
      <HeroForm onSubmit={handleAddHero} />
    </div>
  );
}
