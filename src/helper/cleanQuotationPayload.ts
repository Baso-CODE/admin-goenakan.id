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
    const { isManualProduct, ...cleanItem }: any = { ...item };

    if (!isManualProduct && item.productId) {
      // Produk dari DB — biarkan productId
    } else {
      cleanItem.productId = null;
    }

    cleanItem.quantity = Number(item.quantity);
    cleanItem.unitPrice = Number(item.unitPrice);
    cleanItem.discount = Number(item.discount || 0);

    return cleanItem;
  });

  payload.notes = data.notes || [];

  return payload;
};
