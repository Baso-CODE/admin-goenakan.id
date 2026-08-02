"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ReplacementOrderForm, {
  ReplacementFormValues,
} from "./formReplacementOrder";

export default function EditReplacementOrder() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<ReplacementFormValues | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. FETCH DATA BY ID SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id || status !== "authenticated") return;
      try {
        setIsLoading(true);
        const res = await fetchApi(`/replacement-orders/${id}`);

        if (!res.ok) throw new Error("Gagal mengambil data detail");

        const result = await res.json();
        const data = result.data || result;

        // Format data agar sesuai dengan Zod schema kita
        const formattedData: ReplacementFormValues = {
          referenceOrderId: data.referenceOrderId,
          clientId: data.clientId,
          clientB2BPICId: data.clientB2BPICId || undefined,
          replacementReason: data.replacementReason,
          remarks: data.remarks || "",
          sendToCustDate: data.sendToCustDate
            ? data.sendToCustDate.split("T")[0]
            : undefined,
          arrivalInCustDate: data.arrivalInCustDate
            ? data.arrivalInCustDate.split("T")[0]
            : undefined,
          items: data.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            remarks: item.remarks || "",
            customization: item.customization || "",
            selectedAttributes: item.selectedAttributes || {},
          })),
        };

        setInitialData(formattedData);
      } catch (error: any) {
        toast.error("Data tidak ditemukan");
        // router.push("/super-admin/replacement-orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id, status, fetchApi, router]);

  // 2. FUNGSI HANDLE UPDATE (PATCH)
  const handleUpdate = async (data: ReplacementFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/replacement-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || "Gagal memperbarui Replacement Order",
        );
      }

      toast.success("Replacement Order berhasil diperbarui!");
      router.push("/super-admin/replacement-orders");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <p className="text-muted-foreground">Memuat data form...</p>
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-4">
      {initialData && (
        <ReplacementOrderForm
          initialData={initialData}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
