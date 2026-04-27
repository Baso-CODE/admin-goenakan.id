"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PortfolioForm from "./formPortfolio";
export default function AddPortfolio() {
  const { fetchApi, status } = useApi();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/portfolios", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create portfolio");
      }

      toast.success("Portfolio added successfully!");

      router.push("/super-admin/content/portfolios");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Portfolio Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add portfolio",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Add New Portfolio Project
      </h1>
      <PortfolioForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </div>
  );
}
