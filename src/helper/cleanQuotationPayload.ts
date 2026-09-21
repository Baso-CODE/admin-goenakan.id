import { QuotationFormValues } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";

type QuotationPayloadInput = QuotationFormValues & { notes?: any[] };

export const cleanQuotationPayload = (data: QuotationPayloadInput) => {
  const payload: any = { ...data };

  // 1. Buang field UI State
  delete payload.isManualClient;

  // 2. Logic Hybrid Client
  if (!data.isManualClient && data.clientId) {
    delete payload.manualClientName;
    delete payload.manualClientCompany;
    delete payload.manualClientEmail;
    delete payload.manualClientPhone;
    delete payload.manualClientAddress;
  } else {
    payload.clientId = null;
  }

  payload.items = data.items.map((item) => {
    const { isManualProduct, ...cleanItem }: any = { ...item };

    // productId: null jika manual product
    if (!isManualProduct && item.productId) {
      // dari DB — biarkan productId
    } else {
      cleanItem.productId = null;
      cleanItem.variantId = null;
    }

    cleanItem.quantity = Number(item.quantity || 1);
    cleanItem.unitPrice = Number(item.unitPrice || 0);
    cleanItem.discount = Number(item.discount || 0);

    // Format tiers sebagai acuan harga grosir
    if (cleanItem.tiers && cleanItem.tiers.length > 0) {
      cleanItem.tiers = cleanItem.tiers.map((tier: any) => ({
        minQuantity: Number(tier.minQuantity) || 1,
        maxQuantity: tier.maxQuantity ? Number(tier.maxQuantity) : undefined,
        quantityLabel: tier.quantityLabel || null,
        unitPrice: Number(tier.unitPrice) || 0,
      }));
    } else {
      cleanItem.tiers = [
        {
          minQuantity: 1,
          maxQuantity: undefined,
          quantityLabel: "Pcs",
          unitPrice: 0,
        },
      ];
    }

    return cleanItem;
  });

  // 4. Notes dari store
  payload.notes = data.notes || [];

  return payload;
};
