import { QuotationFormValues } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";

type QuotationPayloadInput = QuotationFormValues & { notes?: any[] };

export const cleanQuotationPayload = (data: QuotationPayloadInput) => {
  // 1. Clone data
  const payload: any = { ...data };

  // 2. Buang field UI State
  delete payload.isManualClient;

  // 3. Logic Hybrid Client
  if (!data.isManualClient && data.clientId) {
    delete payload.manualClientName;
    delete payload.manualClientCompany;
    delete payload.manualClientEmail;
    delete payload.manualClientPhone;
    delete payload.manualClientAddress;
  } else {
    payload.clientId = null;
  }

  // 4. Logic Items
  payload.items = data.items.map((item) => {
    // Pisahkan isManualProduct agar tidak ikut terkirim ke backend
    const { isManualProduct, ...cleanItem }: any = { ...item };

    if (!isManualProduct && item.productId) {
      // Produk dari DB — biarkan productId (dan variantId jika ada)
    } else {
      // Jika produk manual, kosongkan relasi ke DB
      cleanItem.productId = null;
      cleanItem.variantId = null;
    }

    cleanItem.discount = Number(item.discount || 0);

    if (item.tiers && item.tiers.length > 0) {
      cleanItem.tiers = item.tiers.map((tier: any) => ({
        quantity: Number(tier.quantity || 0),
        unitPrice: Number(tier.unitPrice || 0),
      }));
    }

    return cleanItem;
  });

  payload.notes = data.notes || [];

  return payload;
};
