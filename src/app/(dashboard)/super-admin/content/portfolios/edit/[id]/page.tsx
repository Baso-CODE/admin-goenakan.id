"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PortfolioForm from "../../components/formPortfolio";

export default function EditPortfolio() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const res = await fetchApi(`/portfolios/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch data");
        }

        const result = await res.json();
        setInitialData(result);
      } catch (error: any) {
        console.error("❌ Fetch Error:", error);
        toast.error(error.message || "Gagal memuat data portofolio");
        router.push("/super-admin/content/portfolios");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [id, status, fetchApi, router]);

  // === 2. HANDLE UPDATE ===
  const handleUpdate = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSaving(true);
    try {
      const res = await fetchApi(`/portfolios/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update portfolio");
      }

      toast.success("Portfolio berhasil diperbarui!");
      router.push("/super-admin/content/portfolios");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Gagal memperbarui portfolio");
    } finally {
      setIsSaving(false);
    }
  };

  // === TAMPILAN LOADING SEBELUM DATA MUNCUL ===
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C4A48E]" />
        <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest">
          Fetching Project Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Edit Portfolio Project
      </h1>

      {initialData && (
        <PortfolioForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isSubmitting={isSaving}
        />
      )}
    </div>
  );
}
