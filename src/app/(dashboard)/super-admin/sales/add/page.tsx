"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import SalesForm, { SalesFormValues } from "../components/FormSales";

export default function AddSalesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddSales = async (data: SalesFormValues, file?: File) => {
    setIsSubmitting(true);

    const formData = new FormData();

    if (file) {
      // Nama field harus sama dengan yang dipakai di Multer (di router: 'signature')
      formData.append("signature", file, file.name);
    }

    const { signatureFile, signatureUrl, ...salesData } = data;
    formData.append("data", JSON.stringify(salesData));

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const res = await fetch("http://localhost:8000/sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create sales person");
      }

      toast.success("Sales person created successfully!");

      router.push("/super-admin/sales");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add sales person"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase"></h2>

      <SalesForm onSubmit={handleAddSales} isSubmitting={isSubmitting} />
    </div>
  );
}
