"use client";

import { cleanQuotationPayload } from "@/helper/cleanQuotationPayload";
import { useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import QuotationForm, {
  QuotationFormValues,
} from "../../components/quotationForm";

export default function EditQuotationPage() {
  const { data: session } = useSession();
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();
  const [initialData, setInitialData] = useState<
    | (QuotationFormValues & {
        signerName?: string | null;
      })
    | null
  >(null);

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
        signerUserId: data.signerUserId || "",
        signerName: data.signerName || null,
        items: data.items.map((item: any) => ({
          isManualProduct: !item.productId,
          productId: item.productId || "",
          variantId: item.variantId || "",
          id: item.id,
          imageUrl: item.imageUrl || "",
          selectedAttributes: item.selectedAttributes || {},
          productName: item.productName,
          description: item.description || "",

          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),

          discount: Number(item.discount || 0),
          remarks: item.remarks || "",

          tiers:
            item.tiers && item.tiers.length > 0
              ? item.tiers.map((t: any) => ({
                  minQuantity: Number(t.minQuantity || 1),
                  maxQuantity: t.maxQuantity
                    ? Number(t.maxQuantity)
                    : undefined,
                  quantityLabel: t.quantityLabel || "",
                  unitPrice: Number(t.unitPrice || 0),
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

  // ==========================================
  // UPDATE DATA
  // ==========================================
  const handleUpdate = async (
    data: QuotationFormValues & { notes?: any[] },
    itemImages: Record<number, File | null>,
  ) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = cleanQuotationPayload(data);

      // Jangan mengirim ulang signer lama ketika
      // user hanya mengedit item, notes, atau harga.
      const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

      const previousSignerId = initialData?.signerUserId || "";

      const nextSignerId = data.signerUserId || "";

      const signerChanged =
        isSuperAdmin &&
        Boolean(nextSignerId) &&
        nextSignerId !== previousSignerId;

      if (signerChanged) {
        payload.signerUserId = nextSignerId;
      } else {
        delete payload.signerUserId;
      }

      payload.items = payload.items.map((item: any, index: number) => ({
        ...item,
        imageUploadExpected: Boolean(itemImages[index]),
      }));

      const formData = new FormData();

      formData.append("data", JSON.stringify(payload));

      Object.entries(itemImages).forEach(([idx, file]) => {
        if (file) {
          formData.append(`items[${idx}][image]`, file, file.name);
        }
      });

      const res = await fetchApi(`/quotations/${id}`, {
        method: "PATCH",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Gagal memperbarui quotation");
      }

      toast.success("Quotation berhasil diperbarui!");

      router.push("/admin-invoice/quotations");
      router.refresh();
    } catch (error) {
      console.error("Update quotation failed:", error);

      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui quotation",
      );
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
