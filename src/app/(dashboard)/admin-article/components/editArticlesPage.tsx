"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FormArticle, {
  ArticleFormValues,
  ArticleInitialData,
} from "./formArticles";

export default function EditArticle() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<ArticleInitialData | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch data artikel yang mau diedit
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/articles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data artikel");

        const responseData = await res.json();
        const article = responseData.data || responseData;

        const existingProductIds = article.relatedProducts
          ? article.relatedProducts.map((rp: any) => rp.productId)
          : [];

        setInitialData({
          title: article.title,
          categoryId: article.categoryId,
          content: article.content,
          source: article.source || "",
          published: article.published,
          coverImage: article.coverImage,
          productIds: existingProductIds,
        });
      } catch (error) {
        console.error(error);
        toast.error("Artikel tidak ditemukan atau terjadi kesalahan.");
        router.push("/admin-article/");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchArticle();
  }, [id, router]);

  // 2. Fungsi ketika tombol Update ditekan
  const handleUpdateArticle = async (
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

      if (values.productIds && values.productIds.length > 0) {
        formData.append("productIds", values.productIds.join(","));
      } else {
        formData.append("productIds", "");
      }

      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      const res = await fetch(`${apiUrl}/articles/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengupdate artikel");
      }

      toast.success("Artikel berhasil diperbarui!");
      router.push("/admin-article/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Memuat data artikel...
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-8 text-center text-red-500">Gagal memuat artikel.</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Edit Artikel 📝</h2>
      <FormArticle
        onSubmit={handleUpdateArticle}
        isSubmitting={isSubmitting}
        initialData={initialData}
        isEditing={true}
      />
    </div>
  );
}
