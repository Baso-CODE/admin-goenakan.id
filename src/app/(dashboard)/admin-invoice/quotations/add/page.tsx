"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import QuotationAddForm, {
  AddQuotationFormValues,
} from "../components/quotationFormAdd";

export default function AddQuotationPage() {
  const router = useRouter();

  const handleCreate = async (data: AddQuotationFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/quotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create quotation");

      toast.success("Quotation created successfully!");
      router.push("/admin-invoice/quotations");
    } catch (error) {
      toast.error("Error creating quotation");
      console.error(error);
    }
  };

  return (
    <div className=" mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Create New Quotation
      </h1>
      <QuotationAddForm onSubmit={handleCreate} isLoading={false} />
    </div>
  );
}
