import { z } from "zod";

export const orderSchema = z.object({
  dateOrder: z.string().min(1, "Date order is required"),
  salesCategory: z.enum(["SALES", "SAMPLE"]),
  poNumber: z.string().min(1, "PO Number is required"),
  clientId: z.string().min(1, "Client is required"),
  shippingAddress: z.string().min(1, "Shipping address required"),
  salesId: z.string().min(1, "Sales PIC is required"),
  vendorIds: z.array(z.string()).min(1, "At least one vendor required"),
  products: z
    .array(
      z.object({
        productId: z.string().min(1, "Product required"),
        quantity: z.coerce.number().min(1, "Quantity must be > 0"),
        price: z.coerce.number().min(0, "Price must be ≥ 0"),
        customization: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .min(1, "At least one product required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
