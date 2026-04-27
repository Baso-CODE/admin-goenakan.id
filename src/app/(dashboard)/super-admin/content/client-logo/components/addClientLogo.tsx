"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ClientLogoForm from "../components/clientLogoForm";

export default function AddClientLogo() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (status !== "authenticated") return;
      const res = await fetchApi("/brand-clients", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create client logo");
      }

      toast.success("Client logo added successfully!");

      // 3. Redirect ke halaman list
      router.push("/super-admin/content/client-logo");
      router.refresh();
    } catch (err) {
      console.error("❌ Error adding client logo:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add client logo",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Add New Brand Client
      </h1>
      <ClientLogoForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </div>
  );
}
