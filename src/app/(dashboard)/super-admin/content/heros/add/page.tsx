"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import HeroForm, { HeroFormValues } from "../components/heroForm";

export default function AddHero() {
  const router = useRouter();

  const handleAddHero = async (data: HeroFormValues, file?: File) => {
    try {
      // Validasi Manual: File wajib ada saat Create
      if (!file) {
        toast.error("Please select an image for the slide.");
        return;
      }

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token found");

      // === GUNAKAN FORM DATA (Bukan JSON) ===
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.ctaText) formData.append("ctaText", data.ctaText);
      if (data.ctaLink) formData.append("ctaLink", data.ctaLink);
      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", data.isActive.toString());

      formData.append("image", file);

      const res = await fetch(`${apiUrl}/content/heros`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

      toast.success("Hero slide created successfully!");
      router.push("/super-admin/content/heros");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create slide",
      );
      console.error(err);
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
