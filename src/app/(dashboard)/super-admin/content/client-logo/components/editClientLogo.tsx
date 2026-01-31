"use client";

import { apiUrl } from "@/helper/apiurl";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ClientLogoForm, { ClientLogoFormValues } from "./clientLogoForm";

export default function EditClientLogo() {
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === 1. FETCH DATA ===
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/content/client-logos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch data");

        const result = await res.json();
        setInitialData(result);
      } catch (error) {
        toast.error("Failed to load logo data");
        router.push("/super-admin/content/client-logo");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchLogo();
  }, [id, router]);

  // === 2. HANDLE UPDATE ===
  const handleUpdate = async (data: ClientLogoFormValues, file?: File) => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const formData = new FormData();

      // Append Fields
      formData.append("name", data.name);
      if (data.altText) formData.append("altText", data.altText);
      if (data.websiteUrl) formData.append("websiteUrl", data.websiteUrl);
      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", data.isActive.toString());

      // Append File HANYA JIKA user upload baru
      if (file) {
        formData.append("image", file);
      }

      const res = await fetch(`${apiUrl}/content/client-logos/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update logo");
      }

      toast.success("Client logo updated!");
      router.push("/super-admin/content/client-logo");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update logo");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Edit Client Logo
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
