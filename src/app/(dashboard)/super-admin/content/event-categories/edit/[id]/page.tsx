"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EventCategoryForm from "../../components/eventCategoryForm";

export default function EditEventCategory() {
  const { fetchApi, status } = useApi();
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === FETCH EXISTING DATA ===
  useEffect(() => {
    const fetchCategory = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const res = await fetchApi(`/event-categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch data");
        }

        const result = await res.json();
        setInitialData(result);
      } catch (error: any) {
        console.error("❌ Fetch Error:", error);
        toast.error(error.message || "Gagal memuat data kategori");
        router.push("/super-admin/content/event-categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id, status, fetchApi, router]);

  // === HANDLE UPDATE ===
  const handleUpdate = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/event-categories/${id}`, {
        method: "PATCH", // atau PUT, sesuaikan backend Anda
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update category");
      }

      toast.success("Event Category berhasil diperbarui!");
      router.push("/super-admin/content/event-categories");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Gagal memperbarui kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Edit Event Category
      </h1>
      <EventCategoryForm
        initialData={initialData}
        onSubmit={handleUpdate}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
