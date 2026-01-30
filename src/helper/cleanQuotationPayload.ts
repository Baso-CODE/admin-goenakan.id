import { QuotationFormValues } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";

export const cleanQuotationPayload = (data: QuotationFormValues) => {
  // Gunakan 'any' sebentar agar kita bisa men-delete property tanpa error TypeScript
  const payload: any = { ...data };

  // === FIX UTAMA: HAPUS FIELD UI STATE ===
  // Field ini tidak ada di database, jadi harus dibuang
  delete payload.isManualClient;

  // LOGIC HYBRID CLIENT
  // (Menggunakan data asli 'data.isManualClient' untuk pengecekan logic)
  if (!data.isManualClient && data.clientId) {
    payload.manualClientName = undefined;
    payload.manualClientCompany = undefined;
    payload.manualClientEmail = undefined;
    payload.manualClientPhone = undefined;
    payload.manualClientAddress = undefined;
  } else {
    payload.clientId = undefined;
  }

  // LOGIC ITEMS
  payload.items = data.items.map((item) => {
    const cleanItem: any = { ...item };

    // === FIX ITEM: HAPUS FIELD UI STATE DI ITEM JUGA ===
    delete cleanItem.isManualProduct;

    if (!item.isManualProduct && item.productId) {
      // Produk dari DB
    } else {
      // Produk Manual
      cleanItem.productId = undefined;
    }

    // Pastikan angka
    cleanItem.quantity = Number(item.quantity);
    cleanItem.unitPrice = Number(item.unitPrice);
    cleanItem.discount = Number(item.discount || 0);

    return cleanItem;
  });

  return payload;
};
