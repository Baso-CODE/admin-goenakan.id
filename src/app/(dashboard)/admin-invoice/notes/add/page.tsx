"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NoteTemplateForm, {
  NoteTemplateFormValues,
} from "../components/notesTemplateForm";

export default function AddNoteTemplatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // 1. Fetch Categories untuk Dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Gunakan endpoint LIST yang ringan (tanpa pagination)
        const res = await fetch(
          "http://localhost:8000/invoice-notes/categories/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        toast.error("Gagal memuat list kategori");
      } finally {
        setLoadingInit(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. Handle Submit
  const handleAddTemplate = async (data: NoteTemplateFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch("http://localhost:8000/invoice-notes/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to create template");
      }

      toast.success("Template created successfully!");
      router.push("/super-admin/invoice-notes"); // Balik ke halaman utama notes
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
        categories={categories} // Pass kategori ke form
        isLoading={loadingInit}
      />
    </div>
  );
}
