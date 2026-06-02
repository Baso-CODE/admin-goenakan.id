"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Image as ImageIcon,
  Layers,
  Plus,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VariantImageDetail } from "./VariantImageDetail";

// --- SCHEMA & TYPE ---

const ImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  altText: z.string().nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  file: z.any().optional(),
  _isDeleted: z.boolean().optional(),
  fileIndex: z.number().nullable().optional(),
});

// ✨ TAMBAHAN BARU: Skema untuk Price Tier
const PriceTierSchema = z.object({
  id: z.string().optional(),
  minQuantity: z.coerce.number().min(1, "Minimal qty 1"),
  maxQuantity: z.coerce.number().min(1).nullable().optional(),
  price: z.coerce.number().min(0, "Harga tidak valid"),
});

const VariantSchema = z.object({
  variants: z.array(
    z.object({
      id: z.string().optional(),
      variantName: z.string().min(1, "Name is required"),
      description: z.string().optional().nullable(),
      sku: z.string().optional(),
      price: z.coerce.number().min(0, "Price must be non-negative"),
      stock: z.coerce
        .number()
        .int()
        .min(0, "Stock must be at least 0")
        .default(0),
      weight: z.coerce.number().min(0).optional().nullable(),
      width: z.coerce.number().min(0).optional().nullable(),
      height: z.coerce.number().min(0).optional().nullable(),
      length: z.coerce.number().min(0).optional().nullable(),
      _isDeleted: z.boolean().optional(),
      attributeValueIds: z.array(z.string()).optional(),
      images: z.array(ImageSchema).optional(),
      // ✨ TAMBAHAN BARU: Field Price Tiers untuk Variant
      priceTiers: z.array(PriceTierSchema).optional(),
    }),
  ),
});

export type VariantFormValues = z.infer<typeof VariantSchema>;

// ==========================================
// SUB-COMPONENT: NESTED PRICE TIERS
// ==========================================
function NestedVariantPriceTiers({ nestIndex }: { nestIndex: number }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${nestIndex}.priceTiers`,
  });

  return (
    <div className="pt-4 border-t border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <FormLabel className="text-sm font-bold text-gray-700 m-0">
            Harga Grosir (Wholesale)
          </FormLabel>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ minQuantity: 1, maxQuantity: null, price: 0 })
          }>
          <PlusCircle className="w-3 h-3 mr-1.5" /> Tambah Tier Varian
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="p-3 text-center text-xs text-gray-400 border border-dashed rounded-md bg-gray-50">
          Belum ada harga grosir khusus varian ini.
        </div>
      ) : (
        <div className="border rounded-md divide-y overflow-hidden shadow-sm">
          <div className="bg-muted/50 grid grid-cols-12 gap-2 p-2 px-3 text-[10px] font-bold text-gray-500 uppercase">
            <div className="col-span-3">Min Qty</div>
            <div className="col-span-3">Max Qty (Kosong = ∞)</div>
            <div className="col-span-5">Harga Satuan (Rp)</div>
            <div className="col-span-1 text-center">Aksi</div>
          </div>
          {fields.map((item, k) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 p-2 px-3 items-center bg-white">
              <div className="col-span-3">
                <FormField
                  control={control}
                  name={`variants.${nestIndex}.priceTiers.${k}.minQuantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 text-sm"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-3">
                <FormField
                  control={control}
                  name={`variants.${nestIndex}.priceTiers.${k}.maxQuantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="∞"
                          className="h-8 text-sm"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-5">
                <FormField
                  control={control}
                  name={`variants.${nestIndex}.priceTiers.${k}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="h-8 text-sm font-mono"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(k)}
                  className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT: FormUpdateVariants
// ==========================================
export default function FormUpdateVariants({
  initialData,
  onSubmit,
  isSubmitting,
  onGenerateClick,
}: {
  initialData?: any;
  onSubmit: (values: VariantFormValues) => void;
  isSubmitting: boolean;
  onGenerateClick: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(VariantSchema),
    defaultValues: { variants: [] },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const [editingImage, setEditingImage] = useState<{
    variantIndex: number;
    imageIndex: number;
  } | null>(null);

  // PREFILL DATA
  useEffect(() => {
    if (initialData?.productVariants) {
      form.reset({
        variants: initialData.productVariants.map((v: any) => ({
          id: v.id,
          variantName: v.variantName ?? "",
          description: v.description ?? "",
          sku: v.sku ?? "",
          price: Number(v.price) ?? 0,
          stock: v.stock ? Number(v.stock) : 0,
          _isDeleted: false,
          weight: v.weight ? Number(v.weight) : undefined,
          width: v.width ? Number(v.width) : undefined,
          height: v.height ? Number(v.height) : undefined,
          length: v.length ? Number(v.length) : undefined,
          attributeValueIds:
            v.attributeValues?.map((av: any) => av.attributeValueId) ?? [],

          // ✨ TAMBAHAN BARU: Prefill Price Tiers
          priceTiers:
            v.priceTiers?.map((pt: any) => ({
              id: pt.id,
              minQuantity: Number(pt.minQuantity),
              maxQuantity: pt.maxQuantity ? Number(pt.maxQuantity) : null,
              price: Number(pt.price),
            })) ?? [],

          images: v.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            altText: img.altText,
            isFeatured: img.isFeatured,
            file: undefined,
            _isDeleted: false,
          })),
        })),
      });
    }
  }, [initialData, form]);

  const handleRemoveVariant = (index: number) => {
    const v = form.getValues(`variants.${index}`);
    if (v.id) {
      update(index, { ...v, _isDeleted: true });
    } else {
      remove(index);
    }
  };

  const addVariant = () => {
    append({
      id: undefined,
      variantName: "",
      description: "",
      sku: "",
      price: 0,
      stock: 0,
      weight: undefined,
      width: undefined,
      height: undefined,
      length: undefined,
      _isDeleted: false,
      images: [],
      priceTiers: [], // Inisialisasi kosong
    });
  };

  const handleUploadNewImage = (variantIndex: number, files: FileList) => {
    const images = form.getValues(`variants.${variantIndex}.images`) ?? [];
    const newImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isFirstImage = images.length === 0 && newImages.length === 0;
      newImages.push({
        id: undefined,
        url: URL.createObjectURL(file),
        file,
        altText: null,
        isFeatured: isFirstImage,
        _isDeleted: false,
      });
    }
    form.setValue(`variants.${variantIndex}.images`, [...images, ...newImages]);
  };

  const handleDeleteImage = (variantIndex: number, imgIndex: number) => {
    const img = form.getValues(`variants.${variantIndex}.images.${imgIndex}`);
    if (img?.id) {
      form.setValue(
        `variants.${variantIndex}.images.${imgIndex}._isDeleted`,
        true,
      );
    } else {
      const imgs = form.getValues(`variants.${variantIndex}.images`);
      imgs?.splice(imgIndex, 1);
      form.setValue(`variants.${variantIndex}.images`, imgs);
    }
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 border p-6 rounded-xl bg-white shadow-sm">
          <h3 className="text-xl font-bold tracking-tight text-gray-800">
            📦 Product Variants Configuration
          </h3>
          <p className="text-sm text-gray-500">
            Define basic properties, wholesale pricing, and media for each
            product combination.
          </p>
          <hr />

          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              type="button"
              onClick={onGenerateClick}
              className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Generate Variants from Attributes</span>
            </Button>
            <Button variant="outline" type="button" onClick={addVariant}>
              Add Custom Variant
            </Button>
          </div>
          <hr />

          <div className="space-y-8">
            {fields.map((field, index) => {
              const deleted = form.watch(`variants.${index}._isDeleted`);
              const variantImages =
                form.watch(`variants.${index}.images`) || [];

              if (deleted) {
                return (
                  <div
                    key={field.id}
                    className="border border-red-300 p-3 rounded-lg bg-red-50 text-sm text-red-600 italic">
                    🗑️ Variant **
                    {form.getValues(`variants.${index}.variantName`)}** marked
                    for deletion.
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className="border p-6 rounded-xl bg-gray-50 space-y-6">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-semibold">
                      Variant #{index + 1}:
                      {form.watch(`variants.${index}.variantName`) ||
                        "New Variant"}
                    </h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveVariant(index)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>

                  {/* BASIC INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.variantName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Black • XL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (Rp)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={(field.value as number) ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={(field.value as number) ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : parseInt(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* ✨ RENDER SUB-COMPONENT PRICE TIERS DI SINI */}
                  <NestedVariantPriceTiers nestIndex={index} />

                  {/* DIMENSI & BERAT */}
                  <div className="pt-4 border-t border-gray-200">
                    <FormLabel className="mb-3 block text-gray-700">
                      Dimensi & Berat (Opsional)
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: "weight", label: "Berat (Gr)" },
                        { name: "length", label: "Length (Cm)" },
                        { name: "width", label: "Width (Cm)" },
                        { name: "height", label: "Height (Cm)" },
                      ].map((dim) => (
                        <FormField
                          key={dim.name}
                          control={form.control}
                          name={`variants.${index}.${dim.name}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-800">
                                {dim.label}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  {...field}
                                  value={(field.value as number) ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      ",",
                                      ".",
                                    );
                                    field.onChange(
                                      val === "" ? null : parseFloat(val),
                                    );
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name={`variants.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Deskripsi spesifik..."
                            className="resize-y min-h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* IMAGE SECTION */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-indigo-600" /> Variant
                      Media
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleUploadNewImage(index, e.target.files);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {variantImages.map((img: any, imgIndex) => {
                        if (img._isDeleted) return null;
                        return (
                          <div
                            key={imgIndex}
                            className="aspect-square border rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow group">
                            <img
                              src={img.url}
                              alt="Variant"
                              className="object-cover w-full h-full"
                            />
                            {img.isFeatured && (
                              <span className="absolute top-1 left-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                                Featured
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-gray-800"
                                onClick={() =>
                                  setEditingImage({
                                    variantIndex: index,
                                    imageIndex: imgIndex,
                                  })
                                }>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleDeleteImage(index, imgIndex)
                                }>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <hr />
          <Button disabled={isSubmitting}>
            {isSubmitting ? "Saving Variant Changes..." : "Save All Variants"}
          </Button>
        </form>
      </Form>

      {editingImage && (
        <VariantImageDetail
          variantIndex={editingImage.variantIndex}
          imageIndex={editingImage.imageIndex}
          onClose={() => setEditingImage(null)}
        />
      )}
    </FormProvider>
  );
}
