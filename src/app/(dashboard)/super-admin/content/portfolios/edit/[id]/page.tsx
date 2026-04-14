"use client";

import { apiUrl } from "@/helper/apiurl";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PortfolioForm from "../../components/formPortfolio";

export default function EditPortfolio() {
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/portfolios/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch data");

        const result = await res.json();
        setInitialData(result);
      } catch (error) {
        toast.error("Gagal memuat data portofolio");
        router.push("/super-admin/content/portfolio");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPortfolio();
  }, [id, router]);

  // === 2. HANDLE UPDATE ===
  const handleUpdate = async (formData: FormData) => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/portfolios/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      console.error(err);
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
