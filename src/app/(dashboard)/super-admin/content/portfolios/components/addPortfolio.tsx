"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import PortfolioForm from "./formPortfolio";
export default function AddPortfolio() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      // 1. Ambil Auth Token
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No auth token found");

      // 2. Hit API Portfolios
      const res = await fetch(`${apiUrl}/portfolios`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create portfolio");
      }

      toast.success("Portfolio added successfully!");

      // 3. Redirect ke halaman list portfolio
      router.push("/super-admin/content/portfolios");
      router.refresh();
    } catch (err) {
      console.error(err);
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
