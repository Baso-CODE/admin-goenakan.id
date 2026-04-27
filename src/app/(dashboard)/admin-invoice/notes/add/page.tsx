"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import NoteTemplateForm, {
  NoteTemplateFormValues,
} from "../components/notesTemplateForm";

export default function AddNoteTemplatePage() {
  const router = useRouter();
  const { fetchApi, status } = useApi();
  const [categories, setCategories] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    try {
      setLoadingInit(true);
      const res = await fetchApi("/invoice-notes/categories/list");

      if (!res.ok) throw new Error("Gagal memuat kategori");

      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat list kategori");
    } finally {
      setLoadingInit(false);
    }
  }, [status, fetchApi]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 2. Handle Submit
  const handleAddTemplate = async (data: NoteTemplateFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      const res = await fetchApi("/invoice-notes/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to create template");
      }

      toast.success("Template created successfully!");
      router.push("/admin-invoice/notes");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
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
            Add Note Template
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a reusable note text.
          </p>
        </div>
      </div>

      <NoteTemplateForm
        onSubmit={handleAddTemplate}
        categories={categories}
        isLoading={loadingInit}
      />
    </div>
  );
}
