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
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";

// === Tipe Data (Asumsi dari Kategori) ===
type Category = {
  id: string;
  name: string;
};

// -----------------------------
// Zod schema (frontend validation)
// -----------------------------
const attributeSelectionSchema = z.object({
  attributeId: z.string().min(1, "Attribute required"),
  valueIds: z.array(z.string()).min(1, "Choose at least one value"),
});

const variantMetaSchema = z.object({
  variantIndex: z.number(),
  isFeatured: z.boolean().optional(),
  altText: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be >= 0"),
  isCustom: z.boolean().optional(),
  materialType: z.string().optional(),

  // === OPSIONAL ===
  attributes: z.array(attributeSelectionSchema).optional(),
  priceTiers: z.array(z.any()).optional(),
  imagesMetadata: z
    .array(
      z.object({
        isFeatured: z.boolean().optional(),
        altText: z.string().optional(),
      })
    )
    .optional(),
  variantImagesMetadata: z.array(variantMetaSchema).optional(),
});

// Tipe untuk data FORM
export type ProductFormValues = z.infer<typeof productSchema> & {
  variantImagesMetadata?: z.infer<typeof variantMetaSchema>[];
};

// -----------------------------
// Helper: cartesian product
// -----------------------------
function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]] as T[][]
  );
}

// -----------------------------
// MAIN ProductFormV2 component
// -----------------------------
export default function ProductFormV2({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: Partial<ProductFormValues> & {
    basePrice?: number;
    images?: any[];
    videos?: any[];
  };
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
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          basePrice: Number(initialData.basePrice ?? 0),
          attributes: initialData.attributes ?? [],
          priceTiers: initialData.priceTiers ?? [],
          imagesMetadata: initialData.imagesMetadata ?? [],
          variantImagesMetadata: initialData.variantImagesMetadata ?? [],
        }
      : {
          name: "",
          sku: "",
          categoryId: "",
          description: "",
          basePrice: 0,
          isCustom: false,
          materialType: "",
          attributes: [],
          priceTiers: [],
          imagesMetadata: [],
          variantImagesMetadata: [],
        },
  });

  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[] }[]
  >(form.getValues("attributes") ?? []); // generated combination list: each entry { label, valueIds[] }

  const [combinations, setCombinations] = useState<
    { label: string; valueIds: string[] }[]
  >([]);

  const [attributesList, setAttributesList] = useState<any[]>([]);

  const [variantMetas, setVariantMetas] = useState<
    { variantIndex: number; isFeatured?: boolean; altText?: string }[]
  >([]);
  const [variantFilesMap, setVariantFilesMap] = useState<File[][]>([]);

  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [productVideosFiles, setProductVideosFiles] = useState<File[]>([]);

  useEffect(() => {
    // Daftarkan 'attributes' secara manual karena tidak ada input visualnya
    form.register("attributes"); // Daftarkan 'variantImagesMetadata'
    form.register("variantImagesMetadata");
  }, [form]);

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

    // generate cartesian product
    const combos = cartesianProduct(groups);

    // jika tidak ada kombinasi, return kosong
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

    const newVariantMetas = comboObjects.map((_, idx) => ({
      variantIndex: idx,
      isFeatured: false,
      altText: "",
    }));

    setVariantMetas(newVariantMetas);
    form.setValue("variantImagesMetadata", newVariantMetas);
    setVariantFilesMap(comboObjects.map(() => []));
  };

  const handleVariantMetaChange = (
    metas: { variantIndex: number; isFeatured?: boolean; altText?: string }[],
    filesMap: File[][]
  ) => {
    setVariantMetas(metas);
    form.setValue("variantImagesMetadata", metas);
    setVariantFilesMap(filesMap);
  };

  const submit = async (values: ProductFormValues) => {
    try {
      const payload: ProductFormValues = {
        ...values,
        basePrice: Number(values.basePrice),
        attributes:
          attributeSelections.length > 0 ? attributeSelections : undefined,
        priceTiers: values.priceTiers?.length ? values.priceTiers : undefined,
        imagesMetadata: values.imagesMetadata?.length
          ? values.imagesMetadata
          : undefined,
        variantImagesMetadata: form.getValues("variantImagesMetadata")?.length
          ? form.getValues("variantImagesMetadata")
          : undefined,
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
    // ... (JSX tidak diubah, tetap gunakan form.handleSubmit(submit))
    <Card className="w-full">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
            {/* Core fields */}
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
                      value={field.value ?? ""}
                    >
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
                        value={field.value} // pastikan terikat dengan state
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

            <div className="space-y-6 rounded-xl border border-gray-200 p-6  shadow-sm">
              <h3 className="text-xl font-bold tracking-tight text-gray-800 border-b pb-3 mb-3">
                📸 Media Produk
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kolom 1: Gambar */}
                <div className="border border-gray-100 p-4 rounded-lg  shadow-sm">
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

                {/* Kolom 2: Video */}
                <div className="border border-gray-100 p-4 rounded-lg  shadow-sm">
                  <UploadVideos
                    form={form}
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
            {/* Attribute selector */}
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
                    onClick={handleGenerateVariants}
                  >
                    Generate Variants
                  </Button>
                </div>
              </div>
            </div>
            {combinations.length > 0 && (
              <div className="border rounded p-4">
                <VariantList
                  combinations={combinations}
                  onChangeMeta={handleVariantMetaChange}
                />
              </div>
            )}
            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {initialData ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
