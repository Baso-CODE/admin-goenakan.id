"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import QuotationAddForm from "../components/quotationFormAdd";

export default function AddQuotationPage() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (formData: FormData) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchApi("/quotations", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat quotation");
      }

      toast.success("Quotation berhasil dibuat!");
      router.push("/admin-invoice/quotations");
      router.refresh();
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
