"use client";

import { apiUrl } from "@/helper/apiurl";
import { cleanQuotationPayload } from "@/helper/cleanQuotationPayload";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QuotationForm, {
  QuotationFormValues,
} from "../../components/quotationForm";

export default function EditQuotationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<QuotationFormValues | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/quotations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch quotation details");

        const data = await res.json();

        // === DATA TRANSFORMATION (API -> FORM) ===
        const formattedData: any = {
          date: new Date(data.date),
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          status: data.status,

          notes: data.notes || [],

          isManualClient: !data.clientId,
          clientId: data.clientId || "",
          manualClientName: data.manualClientName || "",
          manualClientCompany: data.manualClientCompany || "",
          manualClientEmail: data.manualClientEmail || "",
          manualClientPhone: data.manualClientPhone || "",
          manualClientAddress: data.manualClientAddress || "",

          items: data.items.map((item: any) => ({
            isManualProduct: !item.productId,
            productId: item.productId || "",
            productName: item.productName,
            description: item.description || "",
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
          })),
        };

        setInitialData(formattedData);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data penawaran");
        router.push("/super-admin/quotations");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchQuotation();
  }, [id, router]);

  const handleUpdate = async (data: QuotationFormValues) => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Gunakan helper yang sudah diupdate
      const payload = cleanQuotationPayload(data);

      const res = await fetch(`${apiUrl}/quotations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update");
      }

      toast.success("Quotation updated successfully!");
      router.push("/admin-invoice/quotations"); // Sesuaikan dengan route list Anda
      router.refresh(); // Paksa refresh data server
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Memuat data penawaran...</p>
      </div>
    );
  }

  return (
    <div className=" mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Quotation</h1>
      </div>

      {initialData && (
        <QuotationForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
