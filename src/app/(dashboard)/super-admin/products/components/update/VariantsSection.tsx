"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const ImageSchema = z.object({
  id: z.string().optional(), // file baru tidak punya id
  url: z.string().optional(),
  altText: z.string().nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  file: z.any().optional(), // file upload
  _isDeleted: z.boolean().optional(),
});

const VariantSchema = z.object({
  variants: z.array(
    z.object({
      id: z.string().optional(),
      variantName: z.string().min(1, "Name is required"),
      sku: z.string().optional(),
      price: z.preprocess((v) => Number(v), z.number().nonnegative()),
      _isDeleted: z.boolean().optional(),

      images: z.array(ImageSchema).optional(),
    })
  ),
});

export type VariantFormValues = z.infer<typeof VariantSchema>;

export default function FormUpdateVariants({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData?: any;
  onSubmit: (values: VariantFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<VariantFormValues>({
    resolver: zodResolver(VariantSchema),
    defaultValues: { variants: [] },
  });

  console.log("ini adlaah initial data", initialData);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // PREFILL DATA
  useEffect(() => {
    if (initialData?.productVariants) {
      form.reset({
        variants: initialData.productVariants.map((v: any) => ({
          id: v.id,
          variantName: v.variantName ?? "",
          sku: v.sku ?? "",
          price: Number(v.price) ?? 0,
          _isDeleted: false,
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
      sku: "",
      price: 0,
      _isDeleted: false,
      images: [],
    });
  };

  // =========================
  // IMAGE HANDLING
  // =========================
  const handleUploadNewImage = (variantIndex: number, file: File) => {
    const images = form.getValues(`variants.${variantIndex}.images`) ?? [];

    // push file baru
    form.setValue(`variants.${variantIndex}.images`, [
      ...images,
      {
        id: undefined,
        url: URL.createObjectURL(file),
        file,
        altText: null,
        isFeatured: false,
        _isDeleted: false,
      },
    ]);
  };

  const handleDeleteImage = (variantIndex: number, imgIndex: number) => {
    const img = form.getValues(`variants.${variantIndex}.images.${imgIndex}`);

    if (img?.id) {
      form.setValue(
        `variants.${variantIndex}.images.${imgIndex}._isDeleted`,
        true
      );
    } else {
      // jika gambar baru (tidak ada id) → hapus langsung
      const imgs = form.getValues(`variants.${variantIndex}.images`);
      imgs?.splice(imgIndex, 1);
      form.setValue(`variants.${variantIndex}.images`, imgs);
    }
  };

  // =========================
  // FORM UI
  // =========================
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 border p-6 rounded-xl bg-white shadow-sm"
      >
        <h3 className="text-xl font-semibold tracking-tight">
          Manage Product Variants
        </h3>

        <div className="space-y-6">
          {fields.map((field, index) => {
            const deleted = form.watch(`variants.${index}._isDeleted`);
            const variantImages = form.watch(`variants.${index}.images`) || [];

            if (deleted) {
              return (
                <div
                  key={field.id}
                  className="border p-3 rounded bg-red-50 text-sm text-red-600 italic"
                >
                  Variant deleted — will be removed on save.
                </div>
              );
            }

            return (
              <div
                key={field.id}
                className="border p-4 rounded-lg bg-gray-50 space-y-4"
              >
                {/* BASIC INFO */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveVariant(index)}
                      className="w-full"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* IMAGE SECTION */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Variant Images</div>

                  {/* UPLOAD BUTTON */}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUploadNewImage(index, e.target.files[0]);
                      }
                    }}
                  />

                  {/* IMAGE LIST */}
                  <div className="flex gap-3 flex-wrap mt-3">
                    {variantImages.map((img: any, imgIndex) => {
                      if (img._isDeleted) return null; // hide deleted

                      return (
                        <div
                          key={imgIndex}
                          className="w-24 h-24 border rounded overflow-hidden relative"
                        >
                          <img
                            src={img.url}
                            className="object-cover w-full h-full"
                          />

                          {img.isFeatured && (
                            <span className="absolute top-1 left-1 text-xs bg-black/70 text-white px-1 rounded">
                              Featured
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(index, imgIndex)}
                            className="absolute top-1 right-1 bg-white/70 px-1 text-xs rounded"
                          >
                            X
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={addVariant}
          className="w-full"
        >
          + Add Variant
        </Button>

        <Button disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Updating..." : "Update Variants"}
        </Button>
      </form>
    </Form>
  );
}
