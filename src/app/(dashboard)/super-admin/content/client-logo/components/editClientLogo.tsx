"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ClientLogoForm from "../components/clientLogoForm";

export default function EditClientLogo() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchLogo = async () => {
      if (!id || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const res = await fetchApi(`/brand-clients/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch data");
        }

        const result = await res.json();
        setInitialData(result);
      } catch (error: any) {
        console.error("❌ Fetch Error:", error);
        toast.error(error.message || "Failed to load logo data");
        router.push("/super-admin/content/client-logo");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [id, status, fetchApi, router]); // Tambahkan dependensi auth

  // === 2. HANDLE UPDATE ===
  const handleUpdate = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSaving(true);
    try {
      const res = await fetchApi(`/brand-clients/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update brand client");
      }

      toast.success("Client logo updated successfully!");
      router.push("/super-admin/content/client-logo");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Update Error:", err);
      toast.error(err.message || "Failed to update logo");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C4A48E]" />
        <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest">
          Fetching Client Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Edit Brand Client
      </h1>
      {initialData && (
        <ClientLogoForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isSubmitting={isSaving}
        />
      )}
    </div>
  );
}
