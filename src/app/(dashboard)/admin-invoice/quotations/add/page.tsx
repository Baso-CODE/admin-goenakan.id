"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import QuotationAddForm from "../components/quotationFormAdd";

export default function AddQuotationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/quotations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat quotation");
      }

      toast.success("Quotation berhasil dibuat!");
      router.push("/admin-invoice/quotations");
    } catch (error: any) {
      toast.error(error.message || "Error creating quotation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Create New Quotation
      </h1>
      <QuotationAddForm onSubmit={handleCreate} isLoading={isLoading} />
    </div>
  );
}
