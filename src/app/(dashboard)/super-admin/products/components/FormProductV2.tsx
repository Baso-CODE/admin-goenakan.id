"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AttributeSelector } from "./AttributeSelector";
import { PriceTiers } from "./PriceTiers";
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";

// === Tipe Data ===
type Category = {
  id: string;
  name: string;
};

export const priceTierSchema = z.object({
  minQuantity: z.number().min(1, "Min qty wajib diisi"),
  maxQuantity: z.number().min(1).nullable().optional(),
  price: z
    .string()
    .or(z.number())
    .transform((val) => String(val))
    .refine((val) => val.length > 0, "Harga wajib diisi"),
});

const attributeSelectionSchema = z.object({
  attributeId: z.string().min(1, "Attribute required"),
  valueIds: z.array(z.string()).min(1, "Choose at least one value"),
});

// Update Schema: Price
const variantMetaSchema = z.object({
  variantIndex: z.number(),
  isFeatured: z.boolean().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  altText: z.string().optional(),
});

const videoMetaSchema = z.object({
  title: z.string().optional(),
  altText: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be >= 0"),
  isCustom: z.boolean().optional(),
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
      })
    )
    .optional(),
  videosMetadata: z.array(videoMetaSchema).optional(),
  variantImagesMetadata: z.array(variantMetaSchema).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema> & {
  variantImagesMetadata?: z.infer<typeof variantMetaSchema>[];
  videosMetadata?: z.infer<typeof videoMetaSchema>[];
};

function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]] as T[][]
  );
}

// === COMPONENT: ProductFormV2 (Create Only) ===
export default function ProductFormV2({
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  onSubmit: (
    data: ProductFormValues,
    files: {
      images: File[] | null;
      videos: File[] | null;
      variantImages: File[][];
    }
  ) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const catRes = await fetch(
          "http://localhost:8000/product-categories/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const data = await catRes.json();
        setCategories(data);
      } catch (error) {
        toast.error("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      description: "",
      basePrice: 0,
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      isCustom: false,
      materialType: "",
      attributes: [],
      priceTiers: [],
      imagesMetadata: [],
      videosMetadata: [],
      variantImagesMetadata: [],
    } as ProductFormValues,
  });

  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[] }[]
  >(form.getValues("attributes") ?? []);

  const [combinations, setCombinations] = useState<
    { label: string; valueIds: string[] }[]
  >([]);

  const [attributesList, setAttributesList] = useState<any[]>([]);

  // State Meta (Price, dll)
  const [variantMetas, setVariantMetas] = useState<
    {
      variantIndex: number;
      price: number;
      isFeatured?: boolean;
      altText?: string;
    }[]
  >([]);

  const [variantFilesMap, setVariantFilesMap] = useState<File[][]>([]);
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [productVideosFiles, setProductVideosFiles] = useState<File[]>([]);

  useEffect(() => {
    form.register("attributes");
    form.register("variantImagesMetadata");
    form.register("videosMetadata");
  }, [form]);

  // Handler Generate Varian
  const handleGenerateVariants = () => {
    if (!attributeSelections || attributeSelections.length === 0) {
      toast.error("Tambahkan minimal 1 attribute sebelum generate variant.");
      return;
    }

    const groups = attributeSelections.map((a) => a.valueIds);
    if (groups.some((g) => g.length === 0)) {
      toast.error("Pastikan semua attribute memiliki nilai yang dipilih.");
      return;
    }

    const combos = cartesianProduct(groups);

    if (combos.length === 0) {
      setCombinations([]);
      setVariantMetas([]);
      form.setValue("variantImagesMetadata", []);
      setVariantFilesMap([]);
      return;
    }

    const comboObjects = combos.map((combo) => {
      const names: string[] = [];
      attributesList.forEach((attr: any) => {
        combo.forEach((valueId) => {
          const found = attr.values.find((v: any) => v.id === valueId);
          if (found) names.push(`${attr.name} - ${found.value}`);
        });
      });
      return { valueIds: combo, label: names.join(" | ") };
    });

    setCombinations(comboObjects);

    // [PENTING] Set Default Price = Base Price
    const currentBasePrice = Number(form.getValues("basePrice")) || 0;

    const newVariantMetas = comboObjects.map((_, idx) => ({
      variantIndex: idx,
      price: currentBasePrice,
      isFeatured: false,
      altText: "",
    }));

    setVariantMetas(newVariantMetas);
    form.setValue("variantImagesMetadata", newVariantMetas);

    // Reset file map sesuai jumlah varian
    setVariantFilesMap(comboObjects.map(() => []));
  };

  // [CALLBACK] Update Metadata (Price) dari Child
  const handleUpdateVariantMeta = (
    index: number,
    field: string,
    value: any
  ) => {
    const updatedMetas = variantMetas.map((meta) => {
      if (meta.variantIndex === index) {
        return { ...meta, [field]: value };
      }
      return meta;
    });
    setVariantMetas(updatedMetas);
    form.setValue("variantImagesMetadata", updatedMetas);
  };

  // [CALLBACK] Update Files dari Child
  const handleVariantImagesChange = (filesMap: File[][]) => {
    setVariantFilesMap(filesMap);
  };

  const submit = async (values: ProductFormValues) => {
    try {
      const payload: ProductFormValues = {
        ...values,
        basePrice: Number(values.basePrice),
        weight: Number(values.weight || 0),
        width: Number(values.width || 0),
        height: Number(values.height || 0),
        length: Number(values.length || 0),
        attributes:
          attributeSelections.length > 0 ? attributeSelections : undefined,
        priceTiers: values.priceTiers?.length ? values.priceTiers : undefined,
        imagesMetadata: values.imagesMetadata?.length
          ? values.imagesMetadata
          : undefined,
        videosMetadata: form.getValues("videosMetadata")?.length
          ? form.getValues("videosMetadata")
          : undefined,
        // Pastikan meta dari state dikirim
        variantImagesMetadata: variantMetas,
      };

      const filesToSubmit = {
        images: productImagesFiles.length > 0 ? productImagesFiles : null,
        videos: productVideosFiles.length > 0 ? productVideosFiles : null,
        variantImages: variantFilesMap,
      };
      await onSubmit(payload, filesToSubmit);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit product form");
    }
  };

  const handleAddAttributeToForm = (attrs: any, fullAttributes: any) => {
    setAttributeSelections(attrs);
    form.setValue("attributes", attrs);
    setAttributesList(fullAttributes);
  };

  return (
    <Card className="w-full">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isCustom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Produk</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <PriceTiers />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 mt-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berat (gram)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panjang (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebar (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tinggi (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-6 rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold tracking-tight text-gray-800 border-b pb-3 mb-3">
                📸 Media Produk
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-100 p-4 rounded-lg shadow-sm">
                  <UploadImages
                    form={form}
                    metadataName="imagesMetadata"
                    name="imageFiles"
                    label="Gambar Utama Produk"
                    max={10}
                    onFilesChange={(files) => {
                      setProductImagesFiles(files);
                    }}
                  />
                </div>
                <div className="border border-gray-100 p-4 rounded-lg shadow-sm">
                  <UploadVideos
                    form={form}
                    metadataName="videosMetadata"
                    name="videoFiles"
                    label="Video Promosi Produk"
                    max={3}
                    onFilesChange={(files) => {
                      setProductVideosFiles(files);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <AttributeSelector
                value={attributeSelections}
                onChange={handleAddAttributeToForm}
              />
              <div className="border-t mt-3 pt-3">
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleGenerateVariants}>
                    Generate Variants
                  </Button>
                </div>
              </div>
            </div>

            {combinations.length > 0 && (
              <div className="border rounded p-4">
                <VariantList
                  combinations={combinations}
                  variantMetas={variantMetas}
                  onUpdateVariantMeta={handleUpdateVariantMeta}
                  onChangeMeta={handleVariantImagesChange}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                Create Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
