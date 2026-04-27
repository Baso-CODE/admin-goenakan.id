"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PopupBannerForm, { PopupBannerFormValues } from "./popUpBannerForm";

export default function EditPopupBanner() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === 1. FETCH DATA BY ID ===
  useEffect(() => {
    const fetchBanner = async () => {
      // 🛑 Guard: Jangan jalan jika ID tidak ada atau sesi belum siap
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);
        // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi(`/content/popup-banners/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch banner details");
        }

        const result = await res.json();
        setInitialData(result);
      } catch (error: any) {
        console.error("❌ Error fetching banner:", error);
        toast.error(error.message || "Gagal memuat data banner");
        router.push("/super-admin/content/popup-banner");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
  }, [id, status, fetchApi, router]); // Tambahkan dependensi lengkap

  // === 2. HANDLE UPDATE ===
  const handleUpdate = async (
    data: PopupBannerFormValues,
    files: { desktop?: File; mobile?: File },
  ) => {
    setIsSaving(true);
    try {
      if (!token) throw new Error("No token found");

      // Gunakan FormData untuk mengirim File + Text
      const formData = new FormData();

      // --- Append Text Fields ---
      formData.append("title", data.title);
      if (data.altText) formData.append("altText", data.altText);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      formData.append("isActive", data.isActive.toString());

      // Kirim tanggal hanya jika ada isinya
      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);

      if (files.desktop) {
        formData.append("desktopImage", files.desktop);
      }
      if (files.mobile) {
        formData.append("mobileImage", files.mobile);
      }

      // --- Fetch API (PATCH) ---
      const res = await fetchApi(`/content/popup-banners/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update banner");
      }

      toast.success("Popup banner updated successfully!");
      router.push("/super-admin/content/banner-popup");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update banner",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading banner data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight uppercase">
            Edit Popup Banner
          </h2>
          <p className="text-sm text-muted-foreground">
            Make changes to your campaign banner.
          </p>
        </div>
      </div>

      {initialData && (
        <PopupBannerForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isSubmitting={isSaving}
        />
      )}
    </div>
  );
}
