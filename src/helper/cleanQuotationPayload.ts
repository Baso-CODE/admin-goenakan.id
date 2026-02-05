import { QuotationFormValues } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";

export const cleanQuotationPayload = (data: QuotationFormValues) => {
  // 1. Clone data agar tidak mutasi state form asli
  const payload: any = { ...data };

  // 2. Buang field UI State yang hanya ada di frontend
  delete payload.isManualClient;

  // 3. Logic Hybrid Client
  if (!data.isManualClient && data.clientId) {
    // Jika pakai DB Client, hapus data manual
    delete payload.manualClientName;
    delete payload.manualClientCompany;
    delete payload.manualClientEmail;
    delete payload.manualClientPhone;
    delete payload.manualClientAddress;
  } else {
    // Jika manual, pastikan clientId null (untuk Prisma)
    payload.clientId = null;
  }

  // 4. Logic Items
  payload.items = data.items.map((item) => {
    const { isManualProduct, ...cleanItem }: any = { ...item };

    if (!isManualProduct && item.productId) {
      // Produk dari DB
    } else {
      // Produk Manual, paksa productId null
      cleanItem.productId = null;
    }

    // Pastikan tipe data benar
    cleanItem.quantity = Number(item.quantity);
    cleanItem.unitPrice = Number(item.unitPrice);
    cleanItem.discount = Number(item.discount || 0);

    return cleanItem;
  });

  // 5. Logic Notes
  // Pastikan notes dikirim. Jika undefined, kirim array kosong agar backend bisa melakukan 'reset' jika perlu.
  payload.notes = data.notes || [];

  return payload;
};
