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

      const existingTagIds = article.articleTags
        ? article.articleTags.map((at: any) => at.tagId)
        : [];

      setInitialData({
        title: article.title,
        authorName: article.authorName || "",
        categoryId: article.categoryId,
        content: article.content,
        source: article.source || "",
        published: article.published,
        coverImage: article.coverImage,
        coverImageMobile: article.coverImageMobile || undefined,
        coverImageAlt: article.coverImageAlt || "",
        productIds: existingProductIds,
        tagIds: existingTagIds,
        focusKeywords: article.focusKeywords || "",

        // ✨ Data SEO diambil dari relasi backend
        seo: {
          metaTitle: article.seo?.metaTitle || "",
          metaDescription: article.seo?.metaDescription || "",
          keywords: article.seo?.keywords || "",
          canonicalUrl: article.seo?.canonicalUrl || "",
          ogTitle: article.seo?.ogTitle || "",
          ogDescription: article.seo?.ogDescription || "",
          ogImage: article.seo?.ogImage || "",
          robots: article.seo?.robots || "index, follow",
          structuredData: article.seo?.structuredData || "",
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Artikel tidak ditemukan atau terjadi kesalahan.");
      router.push("/admin-article/article");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, fetchApi, status]);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id, fetchArticle]);

  // Fungsi ketika tombol Update ditekan
  const handleUpdateArticle = async (
    values: ArticleFormValues,
    coverFile: File | null,
    coverMobileFile: File | null,
  ) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      // ==========================================
      // PROSES 1: UPDATE ARTIKEL UTAMA (FormData)
      // ==========================================
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("authorName", values.authorName);
      formData.append("content", values.content);
      formData.append("categoryId", values.categoryId);
      formData.append("published", String(values.published));
      formData.append("coverImageAlt", values.coverImageAlt || "");
      formData.append("focusKeywords", values.focusKeywords || "");

      if (values.source) {
        formData.append("source", values.source);
      }

      formData.append("productIds", values.productIds?.join(",") || "");
      formData.append("tagIds", values.tagIds?.join(",") || "");

      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

      if (coverMobileFile) {
        formData.append("coverMobileFile", coverMobileFile);
      }

      // Tembak API Artikel Utama
      const resArticle = await fetchApi(`/articles/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!resArticle.ok) {
        const errorData = await resArticle.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengupdate artikel utama");
      }

      // ==========================================
      // PROSES 2: UPSERT DATA SEO (JSON)
      // ==========================================
      if (values.seo) {
        // Tembak API SEO
        const resSeo = await fetchApi(`/article-seo/${id}`, {
          method: "POST", // Menggunakan POST karena controller kita Upsert
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values.seo),
        });

        if (!resSeo.ok) {
          const errorData = await resSeo.json().catch(() => ({}));
          // Jika artikel berhasil tapi SEO gagal, kita throw error agar ditangkap catch
          throw new Error(
            errorData.message ||
              "Artikel berhasil diupdate, tetapi gagal menyimpan pengaturan SEO",
          );
        }
      }

      // ==========================================
      // PROSES SELESAI
      // ==========================================
      toast.success("Artikel dan Pengaturan SEO berhasil diperbarui!");
      router.push("/admin-article/article");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

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
