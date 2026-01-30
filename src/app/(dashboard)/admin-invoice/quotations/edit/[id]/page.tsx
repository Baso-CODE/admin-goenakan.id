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

  // === 1. FETCH DATA BY ID ===
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

        // === 2. DATA TRANSFORMATION (API -> FORM) ===
        // Kita harus mengubah data dari database agar cocok dengan Schema Zod Form
        const formattedData: QuotationFormValues = {
          date: new Date(data.date), // Convert string ISO ke Date
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          status: data.status,
          notes: data.notes || "",
          internalNotes: data.internalNotes || "",

          // Logic Hybrid Client
          isManualClient: !data.clientId, // Jika clientId null, berarti manual
          clientId: data.clientId || "",
          manualClientName: data.manualClientName || "",
          manualClientCompany: data.manualClientCompany || "",
          manualClientEmail: data.manualClientEmail || "",
          manualClientPhone: data.manualClientPhone || "",
          manualClientAddress: data.manualClientAddress || "",

          // Logic Items
          items: data.items.map((item: any) => ({
            isManualProduct: !item.productId, // Jika productId null, berarti manual
            productId: item.productId || "",
            productName: item.productName, // Ini snapshot name
            description: item.description || "",
            // Convert Decimal/String ke Number
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
          })),
        };

        setInitialData(formattedData);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data penawaran");
        router.push("/super-admin/quotations"); // Redirect jika error
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchQuotation();
  }, [id, router]);

  // === 3. HANDLE UPDATE ===
  const handleUpdate = async (data: QuotationFormValues) => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const payload = cleanQuotationPayload(data);
      // Gunakan method PATCH untuk update
      const res = await fetch(`${apiUrl}/quotations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update");
      }

      toast.success("Quotation updated successfully!");
      router.push("/admin-invoice/quotations");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update quotation",
      );
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
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Quotation</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui data penawaran yang sudah ada.
          </p>
        </div>
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
