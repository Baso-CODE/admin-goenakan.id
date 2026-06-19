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

  console.log("ini adalah data initial data", initialData);

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

      setInitialData({
        title: article.title_id,
        title_en: article.title_en || "",
        content: article.content_id,
        content_en: article.content_en || "",
        focusKeywords_id: article.focusKeywords_id || "",
        focusKeywords_en: article.focusKeywords_en || "",
        autoTranslate: false,
        authorName: article.authorName || "",
        categoryId: article.categoryId,
        published: article.published,
        source: article.source || "",
        coverImage: article.coverImage,
        coverImageMobile: article.coverImageMobile || undefined,
        coverImageAlt: article.coverImageAlt || "",
        productIds:
          article.relatedProducts?.map((rp: any) => rp.productId) || [],
        tagIds: article.articleTags?.map((at: any) => at.tagId) || [],
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
      toast.error("Artikel tidak ditemukan.");
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
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("title_en", values.title_en || "");
      formData.append("content", values.content);
      formData.append("content_en", values.content_en || "");
      formData.append("focusKeywords_id", values.focusKeywords_id || "");
      formData.append("focusKeywords_en", values.focusKeywords_en || "");
      formData.append("autoTranslate", String(values.autoTranslate || false));

      formData.append("authorName", values.authorName);
      formData.append("categoryId", values.categoryId);
      formData.append("published", String(values.published));
      formData.append("coverImageAlt", values.coverImageAlt || "");

      if (values.source) formData.append("source", values.source);
      formData.append("productIds", values.productIds?.join(",") || "");
      formData.append("tagIds", values.tagIds?.join(",") || "");

      if (coverFile) formData.append("coverFile", coverFile);
      if (coverMobileFile) formData.append("coverMobileFile", coverMobileFile);

      const resArticle = await fetchApi(`/articles/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!resArticle.ok) throw new Error("Gagal mengupdate artikel");

      if (values.seo) {
        await fetchApi(`/article-seo/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values.seo),
        });
      }

      toast.success("Artikel berhasil diperbarui!");
      router.push("/admin-article/article");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
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
