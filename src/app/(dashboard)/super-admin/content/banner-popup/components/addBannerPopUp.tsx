"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PopupBannerForm, {
  PopupBannerFormValues,
} from "../components/popUpBannerForm";

export default function AddPopupBanner() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPopup = async (
    data: PopupBannerFormValues,
    files: { desktop?: File; mobile?: File },
  ) => {
    if (!files.desktop || !files.mobile) {
      toast.error("Both Desktop and Mobile images are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!token) throw new Error("No auth token found");

      const formData = new FormData();

      // --- Text Fields ---
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      formData.append("isActive", data.isActive.toString());

      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);

      formData.append("desktopImage", files.desktop);
      formData.append("mobileImage", files.mobile);

      const res = await fetchApi("/content/popup-banners", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create banner");
      }
      toast.success("Popup banner created successfully!");
      router.push("/super-admin/content/banner-popup");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create popup banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase">
          Add Popup Banner
        </h2>
      </div>

      <PopupBannerForm onSubmit={handleAddPopup} isSubmitting={isSubmitting} />
    </div>
  );
}
