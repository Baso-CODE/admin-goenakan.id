"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormArticle, { ArticleFormValues } from "./formArticles";

export default function AddArticle() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateArticle = async (
    values: ArticleFormValues,
    coverFile: File | null,
  ) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("Tidak ada token otentikasi");

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

      const res = await fetch(`${apiUrl}/articles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal membuat artikel");
      }

      toast.success("Artikel berhasil dibuat dan diunggah!");
      router.push("/super-admin/articles");
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
