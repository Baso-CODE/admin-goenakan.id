"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import BannerProductForm, {
  BannerProductFormValues,
} from "./formBannerProduct";

export default function EditBannerProduct() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const res = await fetchApi(`/banner-products/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch banner details");
        }

        const result = await res.json();
        setInitialData(result);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Gagal memuat data banner");
        router.push("/super-admin/content/banner-product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
  }, [id, status, fetchApi, router]);

  const handleUpdate = async (data: BannerProductFormValues, file?: File) => {
    setIsSaving(true);
    try {
      const formData = new FormData();

      if (data.title) formData.append("title", data.title);
      if (data.subtitle) formData.append("subtitle", data.subtitle);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      formData.append("sortOrder", data.sortOrder.toString());
      formData.append("isActive", data.isActive.toString());

      if (file) {
        formData.append("image", file);
      }

      const res = await fetchApi(`/banner-products/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update banner");
      }

      toast.success("Banner berhasil diperbarui!");
      router.push("/super-admin/content/banner-products");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui banner",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-stone-500" />
        <p className="text-stone-500">Memuat data banner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight uppercase text-stone-800">
            Edit Banner Product
          </h2>
          <p className="text-sm text-stone-500">
            Perbarui detail atau ganti gambar banner promosi Anda.
          </p>
        </div>
      </div>

      {initialData && (
        <BannerProductForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isSubmitting={isSaving}
        />
      )}
    </div>
  );
}
