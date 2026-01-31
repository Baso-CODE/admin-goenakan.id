"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ClientLogoForm, {
  ClientLogoFormValues,
} from "../components/clientLogoForm";

export default function AddClientLogo() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: ClientLogoFormValues, file?: File) => {
    // 1. Validasi File: Wajib ada saat Create
    if (!file) {
      toast.error("Please select a logo image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No auth token found");

      // 2. Gunakan FormData (Karena ada file upload)
      const formData = new FormData();

      // Append Text Fields
      formData.append("name", data.name);
      if (data.altText) formData.append("altText", data.altText);
      if (data.websiteUrl) formData.append("websiteUrl", data.websiteUrl);

      formData.append("displayOrder", data.displayOrder.toString());
      formData.append("isActive", data.isActive.toString());

      formData.append("image", file);

      // 3. Hit API
      const res = await fetch(`${apiUrl}/content/client-logos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || "Failed to create logo");
        } catch {
          throw new Error(errText || "Unknown error occurred");
        }
      }

      toast.success("Client logo added successfully!");
      router.push("/super-admin/content/client-logo");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add client logo",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto  py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Add New Client Logo
      </h1>
      <ClientLogoForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </div>
  );
}
