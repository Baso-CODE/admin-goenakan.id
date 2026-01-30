"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PopupBannerForm, {
  PopupBannerFormValues,
} from "../components/popUpBannerForm";

export default function AddPopupBanner() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPopup = async (
    data: PopupBannerFormValues,
    files: { desktop?: File; mobile?: File },
  ) => {
    // 1. Validasi Manual: Wajib ada kedua gambar saat Create
    if (!files.desktop || !files.mobile) {
      toast.error("Both Desktop and Mobile images are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No auth token found");

      // 2. Gunakan FormData untuk Multiple Files + Body
      const formData = new FormData();

      // --- Text Fields ---
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      // Boolean convert ke string
      formData.append("isActive", data.isActive.toString());

      // Date Fields (Kirim string ISO/Format dari form)
      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);

      // --- File Fields ---
      // Nama field ("desktopImage", "mobileImage") harus SAMA PERSIS
      // dengan konfigurasi Multer di Router Anda.
      formData.append("desktopImage", files.desktop);
      formData.append("mobileImage", files.mobile);

      // 3. Hit API
      const res = await fetch(`${apiUrl}/content/popup-banners`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Jangan set Content-Type secara manual saat pakai FormData!
          // Browser akan otomatis set boundary-nya.
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || "Failed to create banner");
        } catch {
          throw new Error(errText || "Unknown error occurred");
        }
      }

      toast.success("Popup banner created successfully!");
      router.push("/super-admin/content/popup-banner");
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
