"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ArticleTagForm, { ArticleTagFormValues } from "./formArticleTag";

export default function AddArticleTag() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = async (data: ArticleTagFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetchApi("/article-tags", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create tag");
      }

      toast.success("Article Tag created successfully!");
      router.push("/admin-article/tags");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Article Tag
      </h2>
      <ArticleTagForm onSubmit={handleAddTag} isSubmitting={isSubmitting} />
    </div>
  );
}
