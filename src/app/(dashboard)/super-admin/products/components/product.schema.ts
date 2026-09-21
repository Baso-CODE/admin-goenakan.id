import { z } from "zod";

// === TIPE DATA ===
export type Category = {
  id: string;
  name: string;
  code?: string;
};

// === SCHEMAS ===
export const priceTierSchema = z.object({
  minQuantity: z.number().min(1, "Min qty wajib diisi"),
  maxQuantity: z.number().min(1).nullable().optional(),
  discount: z.coerce.number().min(0).optional(),
  price: z
    .string()
    .or(z.number())
    .transform((val) => String(val))
    .optional(),
});

export const attributeSelectionSchema = z.object({
  attributeId: z.string().min(1, "Attribute required"),
  valueIds: z.array(z.string()).min(1, "Choose at least one value"),
  priceModifiers: z.record(z.string(), z.number()).optional(),
});

export const variantMetaSchema = z.object({
  variantIndex: z.number(),
  isFeatured: z.boolean().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  stock: z.number().min(0, "Stock minimal 0").default(0),
  altText: z.string().optional(),
  description: z.string().optional(),
  weight: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  length: z.number().optional(),
  priceTiers: z.array(priceTierSchema).optional(),
});

export const videoMetaSchema = z.object({
  url: z.string().optional(),
  publicId: z.string().optional(),
  title: z.string().optional(),
  altText: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  itemCategoryId: z.string().min(1, "Item Category wajib dipilih"),
  itemNameId: z.string().min(1, "Item Name wajib dipilih"),
  tagIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be >= 0"),
  isSample: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  isMadeByOrder: z.boolean().optional(),
  isActive: z.boolean().optional(),
  materialTypeId: z.string().min(1, "Material wajib dipilih"),
  stock: z.number().min(0, "Stock minimal 0").optional().default(0),
  materialType: z.string().optional(),
  weight: z.number().min(0, "Weight must be >= 0").optional(),
  width: z.number().min(0, "Width must be >= 0").optional(),
  height: z.number().min(0, "Height must be >= 0").optional(),
  length: z.number().min(0, "Length must be >= 0").optional(),
  priceTiers: z.array(priceTierSchema).optional(),
  attributes: z.array(attributeSelectionSchema).optional(),
  imagesMetadata: z
    .array(
      z.object({
        isFeatured: z.boolean().optional(),
        altText: z.string().optional(),
      }),
    )
    .optional(),
  videosMetadata: z.array(videoMetaSchema).optional(),
  variantImagesMetadata: z.array(variantMetaSchema).optional(),
  mockupAreaX: z.number().optional().nullable(),
  mockupAreaY: z.number().optional().nullable(),
  mockupAreaWidth: z.number().optional().nullable(),
  mockupAreaHeight: z.number().optional().nullable(),
  mockupSides: z.array(z.any()).optional(),
  colorMockupTrigger: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema> & {
  variantImagesMetadata?: z.infer<typeof variantMetaSchema>[];
  videosMetadata?: z.infer<typeof videoMetaSchema>[];
};

// === UTILS ===
export function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]] as T[][],
  );
}
