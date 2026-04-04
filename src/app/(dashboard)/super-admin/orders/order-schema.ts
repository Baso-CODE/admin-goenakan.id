import { z } from "zod";

export const orderSchema = z.object({
  dateOrder: z.string().min(1, "Date order is required"),
  salesCategory: z.enum(["SALES", "SAMPLE"]),
  poNumber: z.string().min(1, "PO Number is required"),
  clientId: z.string().min(1, "Client is required"),
  clientB2BPICId: z.string().optional(),
  purchaseChannelId: z.string().optional(),

  phone: z.string().optional(),
  shippingAddress: z.string().min(1, "Shipping address required"),
  salesId: z.string().min(1, "Sales PIC is required"),

  vendorIds: z.array(z.string()).min(1, "At least one vendor required"),
  products: z
    .array(
      z.object({
        productId: z.string().min(1, "Product required"),
        variantId: z.string().optional(),

        quantity: z.number().min(1, "Qty must be at least 1"),
        price: z.number().min(0, "Price cannot be negative"),
        customization: z.string().optional(),
        remarks: z.string().optional(),
      }),
    )
    .min(1, "At least one product required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
