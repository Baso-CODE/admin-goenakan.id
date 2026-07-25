"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import NoteTemplateForm, {
  NoteTemplateFormValues,
} from "../../components/notesTemplateForm";

export default function EditNoteTemplatePage() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<
    NoteTemplateFormValues | undefined
  >(undefined);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data Template & Categories
  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !id) return;

    try {
      setIsLoading(true);

      const [templateRes, catRes] = await Promise.all([
        fetchApi(`/invoice-notes/templates/${id}`),
        fetchApi("/invoice-notes/categories/list"),
      ]);

      if (!templateRes.ok) throw new Error("Failed to fetch template");

      const templateData = await templateRes.json();
      const catData = await catRes.json();

      const template = templateData.data || templateData;

      setInitialData({
        categoryId: template.categoryId,
        title: template.title,
        content: template.content,
        isActive: template.isActive ?? true,
      });

      setCategories(catData.data || catData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data.");
      router.push("/admin-invoice/notes");
    } finally {
      setIsLoading(false);
    }
  }, [id, status, fetchApi, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Handle Update
  const handleUpdateTemplate = async (formValues: NoteTemplateFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      setIsSubmitting(true);

      //  Gunakan fetchApi dengan method PATCH
      const res = await fetchApi(`/invoice-notes/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update template");
      }

      toast.success("Template updated successfully!");
      router.push("/admin-invoice/notes");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
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
            Edit Note Template
          </h2>
          <p className="text-sm text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
            ID: {id}
          </p>
        </div>
      </div>

      <NoteTemplateForm
        initialData={initialData}
        categories={categories}
        onSubmit={handleUpdateTemplate}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
