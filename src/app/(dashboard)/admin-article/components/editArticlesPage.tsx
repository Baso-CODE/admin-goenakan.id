"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import FormArticle, {
  ArticleFormValues,
  ArticleInitialData,
} from "./formArticles";

export default function EditArticle() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<ArticleInitialData | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    try {
      setIsLoading(true);
      const res = await fetchApi(`/articles/${id}`);

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
        coverImageAlt: article.coverImageAlt,
        productIds: existingProductIds,
      });
    } catch (error) {
      console.error(error);
      toast.error("Artikel tidak ditemukan atau terjadi kesalahan.");
      router.push("/admin-article/");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, fetchApi, status]);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id, fetchArticle]);

  // ✨ 2. Fungsi ketika tombol Update ditekan
  const handleUpdateArticle = async (
    values: ArticleFormValues,
    coverFile: File | null,
  ) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("categoryId", values.categoryId);
      formData.append("published", String(values.published));
      formData.append("coverImageAlt", values.coverImageAlt || "");

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

      // ✨ Gunakan fetchApi dengan method PATCH
      const res = await fetchApi(`/articles/${id}`, {
        method: "PATCH",
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

  // Render loading state jika session masih loading atau data artikel sedang diambil
  if (status === "loading" || isLoading) {
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
