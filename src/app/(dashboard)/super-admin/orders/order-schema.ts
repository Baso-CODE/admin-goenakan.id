import { z } from "zod";

export const orderSchema = z.object({
  dateOrder: z.string().min(1, "Date order is required"),
  salesCategory: z.enum(["SALES", "SAMPLE"]),
  clientId: z.string().min(1, "Client is required"),
  clientB2BPICId: z.string().optional(),
  purchaseChannelId: z.string().optional(),

  phone: z.string().optional(),
  shippingAddress: z.string().min(1, "Shipping address required"),
  clientPoNumber: z.string().optional(),

  clientPoFile: z.any().optional(),

  remark: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  referenceQuotationId: z.string().optional(),
  referenceSampleId: z.string().optional(),

  warrantyDays: z
    .number()
    .int()
    .min(0, "Warranty days cannot be negative")
    .default(30),

  products: z
    .array(
      z.object({
        productId: z.string().min(1, "Product required"),
        variantId: z.string().optional(),
        quantity: z.number().min(1, "Qty must be at least 1"),
        price: z.number().min(0, "Price cannot be negative"),
        customization: z.string().optional(),
        remarks: z.string().optional(),
        selectedAttributes: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1, "At least one product required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
