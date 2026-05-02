"use client";

// Sesuaikan path import ini dengan struktur folder project-mu
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import BannerProductForm, {
  BannerProductFormValues,
} from "./formBannerProduct";

export default function AddBannerProduct() {
  const { fetchApi } = useApi();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBanner = async (
    data: BannerProductFormValues,
    file?: File,
  ) => {
    if (!file) {
      toast.error("Gambar banner wajib diunggah.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (data.title) formData.append("title", data.title);
      if (data.subtitle) formData.append("subtitle", data.subtitle);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      formData.append("sortOrder", data.sortOrder.toString());
      formData.append("isActive", data.isActive.toString());

      formData.append("image", file);
      const res = await fetchApi("/banner-products", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat banner");
      }
      toast.success("Banner berhasil dibuat!");
      router.push("/super-admin/content/banner-products");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto ">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase text-stone-800">
          Add Banner Product
        </h2>
      </div>
      <BannerProductForm
        onSubmit={handleAddBanner}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
