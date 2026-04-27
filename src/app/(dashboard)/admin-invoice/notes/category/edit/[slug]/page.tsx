"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import NoteCategoryForm, {
  NoteCategoryFormValues,
} from "../../../components/noteCategoryForm";

const EditNoteCategoryPage = () => {
  const { fetchApi, status } = useApi();
  const { slug } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<
    NoteCategoryFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await fetchApi(`/invoice-notes/categories/${slug}`);

      if (!res.ok) throw new Error("Failed to fetch category data");

      const response = await res.json();
      const data = response.data || response;

      setInitialData({
        name: data.name,
        isActive: data.isActive ?? true,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load category data.");
      router.push("/admin-invoice/notes");
    } finally {
      setIsLoading(false);
    }
  }, [slug, status, fetchApi, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateCategory = async (formValues: NoteCategoryFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      setIsSubmitting(true); // ✨ Tetap kita gunakan sesuai kode asli Anda

      // ✨ Gunakan fetchApi dengan method PATCH
      const res = await fetchApi(`/invoice-notes/categories/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      router.push("/admin-invoice/notes");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setIsSubmitting(false); // ✨ Tetap kita kembalikan ke false di sini
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Edit Note Category
          </h2>
          <p className="text-sm text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
            Slug: {slug}
          </p>
        </div>
      </div>

      <NoteCategoryForm
        initialData={initialData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditNoteCategoryPage;
