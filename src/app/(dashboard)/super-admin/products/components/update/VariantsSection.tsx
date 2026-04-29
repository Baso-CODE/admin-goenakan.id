"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Image as ImageIcon, Plus, Trash2 } from "lucide-react"; // Import ikon
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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

// --- SCHEMA & TYPE (Tetap Sama) ---

const ImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  altText: z.string().nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  file: z.any().optional(),
  _isDeleted: z.boolean().optional(),
  fileIndex: z.number().nullable().optional(),
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
      attributeValueIds: z.array(z.string()).optional(), // Penting untuk update
      images: z.array(ImageSchema).optional(),
    }),
  ),
});

export type VariantFormValues = z.infer<typeof VariantSchema>;

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

  // State untuk mengelola Image Detail Editor
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
  }, [initialData]);

  // =========================
  // DELETE / REPLACE VARIANT
  // =========================
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
    });
  };

  // =========================
  // IMAGE HANDLING
  // =========================
  const handleUploadNewImage = (variantIndex: number, files: FileList) => {
    const images = form.getValues(`variants.${variantIndex}.images`) ?? [];
    const newImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Set gambar pertama sebagai Featured jika belum ada yang Featured
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

  // =========================
  // FORM UI
  // =========================
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
            Define basic properties and media for each product combination.
          </p>
          <hr />

          {/* GENERATE BUTTON */}
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
                    for deletion — will be removed on save.
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className="border p-6 rounded-xl bg-gray-50 space-y-6">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-semibold">
                      Variant #{index + 1}:{" "}
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
                            <Input
                              placeholder="SKU Code (Auto-generated if empty)"
                              {...field}
                            />
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
                              value={(field.value as number) ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value);
                                field.onChange(val);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
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
                          <FormLabel className=" font-semibold">
                            Stock
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className=" focus:border-border"
                              placeholder="0"
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
                  <div className="pt-4 border-t border-gray-200">
                    <FormLabel className="mb-3 block text-gray-700">
                      Dimensi & Berat (Opsional)
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              Berat (gram)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={(field.value as number) ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? null
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
                        name={`variants.${index}.length`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              Panjang (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={(field.value as number) ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? null
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
                        name={`variants.${index}.width`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              Lebar (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={(field.value as number) ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? null
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
                        name={`variants.${index}.height`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              Tinggi (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={(field.value as number) ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? null
                                      : parseFloat(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                            placeholder="Deskripsi spesifik untuk varian ini..."
                            className="resize-y min-h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* IMAGE SECTION */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-indigo-600" /> Variant
                      Media
                    </div>

                    {/* UPLOAD BUTTON AREA */}
                    <div className="flex gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleUploadNewImage(index, e.target.files);
                            e.target.value = ""; // Reset input
                          }
                        }}
                      />
                    </div>

                    {/* IMAGE LIST - Grid Tampilan Rapi */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {variantImages.map((img: any, imgIndex) => {
                        if (img._isDeleted) return null;

                        return (
                          <div
                            key={imgIndex}
                            className="aspect-square border rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow group">
                            <img
                              src={img.url}
                              alt={img.altText || "Variant Image"}
                              className="object-cover w-full h-full"
                            />

                            {/* Badge Featured */}
                            {img.isFeatured && (
                              <span className="absolute top-1 left-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                                Featured
                              </span>
                            )}

                            {/* Aksi Overlay (Minimalis) */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                              {/* Edit Button */}
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
                              {/* Delete Button */}
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
          <Button disabled={isSubmitting} className="">
            {isSubmitting ? "Saving Variant Changes" : " Save All Variants"}
          </Button>
        </form>
      </Form>

      {/* RENDER IMAGE DETAIL EDITOR */}
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
