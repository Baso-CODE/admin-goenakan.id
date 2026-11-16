import { QuotationFormValues } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";

type QuotationPayloadInput = QuotationFormValues & { notes?: any[] };

// MANUAL_QUOTATION_ITEM_SUPPORT_V2
export const cleanQuotationPayload = (data: QuotationPayloadInput) => {
  const payload: any = { ...data };
  delete payload.isManualClient;

  if (!data.isManualClient && data.clientId) {
    delete payload.manualClientName;
    delete payload.manualClientCompany;
    delete payload.manualClientEmail;
    delete payload.manualClientPhone;
    delete payload.manualClientAddress;
  } else {
    payload.clientId = null;
  }

  payload.items = data.items.map((item, index) => {
    const { isManualProduct, ...cleanItem }: any = { ...item };
    const itemNo = index + 1;
    const name = String(item.productName ?? "").trim();
    const selectedProductId = String(item.productId ?? "").trim();

    if (!name) {
      throw new Error(`Item ${itemNo}: Nama produk wajib diisi.`);
    }

    if (isManualProduct) {
      // Produk manual tidak harus ada di master produk.
      cleanItem.productId = null;
      cleanItem.variantId = null;
      cleanItem.selectedAttributes = {};
    } else {
      if (!selectedProductId) {
        throw new Error(
          `Item ${itemNo}: Pilih produk dari database atau aktifkan mode Manual.`,
        );
      }
      cleanItem.productId = selectedProductId;
      cleanItem.variantId = item.variantId || null;
    }

    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unitPrice ?? 0);
    const discount = Number(item.discount ?? 0);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Item ${itemNo}: Quantity harus lebih dari 0.`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Item ${itemNo}: Unit Price tidak valid.`);
    }
    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error(`Item ${itemNo}: Discount tidak valid.`);
    }

    cleanItem.productName = name;
    cleanItem.quantity = quantity;
    cleanItem.unitPrice = unitPrice;
    cleanItem.discount = discount;
    cleanItem.tiers = Array.isArray(item.tiers)
      ? item.tiers.map((tier, tierIndex) => {
          const minQuantity = Number(tier.minQuantity);
          const maxQuantity =
            tier.maxQuantity == null
              ? undefined
              : Number(tier.maxQuantity);
          const tierPrice = Number(tier.unitPrice ?? 0);

          if (!Number.isInteger(minQuantity) || minQuantity < 1) {
            throw new Error(`Item ${itemNo}, tier ${tierIndex + 1}: Minimum Qty tidak valid.`);
          }
          if (
            maxQuantity !== undefined &&
            (!Number.isInteger(maxQuantity) || maxQuantity < minQuantity)
          ) {
            throw new Error(`Item ${itemNo}, tier ${tierIndex + 1}: Maximum Qty tidak valid.`);
          }
          if (!Number.isFinite(tierPrice) || tierPrice < 0) {
            throw new Error(`Item ${itemNo}, tier ${tierIndex + 1}: Harga tidak valid.`);
          }
          return {
            minQuantity,
            maxQuantity,
            quantityLabel: tier.quantityLabel || "Pcs",
            unitPrice: tierPrice,
          };
        })
      : [];

    return cleanItem;
  });

  payload.notes = data.notes || [];
  return payload;
};
