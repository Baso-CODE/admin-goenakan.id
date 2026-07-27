"use client";

import { cleanQuotationPayload } from "@/helper/cleanQuotationPayload";
import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import QuotationForm, {
  QuotationFormValues,
} from "../../components/quotationForm";

export default function EditQuotationPage() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<QuotationFormValues | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  const fetchQuotation = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !id) return;

    try {
      setIsLoading(true);

      const res = await fetchApi(`/quotations/${id}`);

      if (!res.ok) throw new Error("Failed to fetch quotation details");

      const data = await res.json();

      const formattedData: any = {
        date: new Date(data.date),
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        status: data.status,
        notes: data.notes || [],
        currencyCode: data.currencyCode || "IDR",
        paymentTerms: data.paymentTerms || "",
        isManualClient: !data.clientId,
        clientId: data.clientId || "",
        picId: data.picId || "",
        manualClientName: data.manualClientName || "",
        manualClientCompany: data.manualClientCompany || "",
        manualClientEmail: data.manualClientEmail || "",
        manualClientPhone: data.manualClientPhone || "",
        manualClientAddress: data.manualClientAddress || "",
        items: data.items.map((item: any) => ({
          isManualProduct: !item.productId,
          productId: item.productId || "",
          variantId: item.variantId || "",
          selectedAttributes: item.selectedAttributes || {},
          productName: item.productName,
          description: item.description || "",
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          discount: Number(item.discount || 0),
          remarks: item.remarks || "",
          tiers:
            item.tiers && item.tiers.length > 0
              ? item.tiers.map((t: any) => ({
                  minQuantity: Number(t.minQuantity),
                  maxQuantity: t.maxQuantity
                    ? Number(t.maxQuantity)
                    : undefined,
                  quantityLabel: t.quantityLabel || "",
                  unitPrice: Number(t.unitPrice),
                }))
              : [
                  {
                    minQuantity: 1,
                    maxQuantity: undefined,
                    quantityLabel: "Pcs",
                    unitPrice: 0,
                  },
                ],
        })),
      };

      setInitialData(formattedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data penawaran");
      router.push("/admin-invoice/quotations");
    } finally {
      setIsLoading(false);
    }
  }, [id, status, fetchApi, router]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdate = async (data: QuotationFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = cleanQuotationPayload(data);

      const res = await fetchApi(`/quotations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update");
      }

      toast.success("Quotation updated successfully!");
      router.push("/admin-invoice/quotations");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Memuat data quotation...
      </div>
    );
  }

  return (
    <div className="mx-auto py-6 space-y-6">
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
