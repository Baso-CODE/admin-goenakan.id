"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormArticle, { ArticleFormValues } from "./formArticles";

export default function AddArticle() {
  const router = useRouter();
  const { fetchApi, status } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateArticle = async (
    values: ArticleFormValues,
    coverFile: File | null,
  ) => {
    if (status !== "authenticated") {
      toast.error("Sesi anda berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("categoryId", values.categoryId);
      formData.append("published", String(values.published));

      if (values.source) {
        formData.append("source", values.source);
      }

      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      const res = await fetchApi("/articles", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal membuat artikel");
      }

      toast.success("Artikel berhasil dibuat dan diunggah!");
      router.push("/admin-article/article");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        Tulis Artikel Baru ✍️
      </h2>
      <FormArticle onSubmit={handleCreateArticle} isSubmitting={isSubmitting} />
    </div>
  );
}
