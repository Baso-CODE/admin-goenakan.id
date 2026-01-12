"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NoteTemplateForm, {
  NoteTemplateFormValues,
} from "../../components/notesTemplateForm";

export default function EditNoteTemplatePage() {
  const { id } = useParams(); // Menggunakan ID (bukan slug) untuk template
  const router = useRouter();

  const [initialData, setInitialData] = useState<
    NoteTemplateFormValues | undefined
  >(undefined);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data Template & Categories
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel Fetching agar lebih cepat
        const [templateRes, catRes] = await Promise.all([
          fetch(`http://localhost:8000/invoice-notes/templates/${id}`, {
            headers,
          }),
          fetch(`http://localhost:8000/invoice-notes/categories/list`, {
            headers,
          }),
        ]);

        if (!templateRes.ok) throw new Error("Failed to fetch template");

        const templateData = await templateRes.json();
        const catData = await catRes.json();

        // Backend biasanya membungkus dalam object { data: ... }
        const template = templateData.data || templateData;

        setInitialData({
          categoryId: template.categoryId,
          title: template.title,
          content: template.content,
          isActive: template.isActive,
        });

        setCategories(catData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
        router.push("/super-admin/invoice-notes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // 2. Handle Update
  const handleUpdateTemplate = async (formValues: NoteTemplateFormValues) => {
    try {
      setIsSubmitting(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `http://localhost:8000/invoice-notes/templates/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formValues),
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update template");
      }

      toast.success("Template updated successfully!");
      router.push("/super-admin/invoice-notes");
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
