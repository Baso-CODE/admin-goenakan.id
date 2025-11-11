"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ClipboardList,
  Trash2,
  Package,
  Barcode,
  DollarSign,
  Layers,
  Settings,
  BarChart,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadVideos } from "./upload-videos";
import { UploadImages } from "./upload-images";

// === Tipe Data (Asumsi dari Kategori) ===
type Category = {
  id: string;
  name: string;
};

// === ZOD SCHEMA (Relasi) ===
const attributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required."),
  value: z.string().min(1, "Attribute value is required."),
});

const priceTierSchema = z.object({
  // Gunakan z.coerce.number() untuk konversi input string/number ke number
  minQuantity: z.coerce.number().min(1, "Min quantity must be at least 1."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
});

// === ZOD SCHEMA (Produk) ===
const productSchema = z.object({
  // Core
  name: z.string().min(2, "Product name must be at least 2 characters."),
  sku: z.string().min(2, "SKU must be at least 2 characters."),
  categoryId: z.string().min(1, "Category is required."),
  description: z.string().optional(),
  // Paksa konversi ke number untuk validasi
  basePrice: z.coerce.number().min(0.01, "Base price is required."),
  isCustom: z.boolean().default(false),
  materialType: z.string().optional(),

  // Relasi (Opsional saat create)
  attributes: z.array(attributeSchema).optional(),
  priceTiers: z.array(priceTierSchema).optional(),

  // Files (Hanya untuk frontend, RHF akan menangani FileList)
  imageFiles: z.any().optional(),
  videoFiles: z.any().optional(),
});

// Tipe data form yang di-infer dari Zod
export type ProductFormValues = z.infer<typeof productSchema>;

// Tipe data yang diterima dari server (termasuk relasi)
interface ProductDataFromServer
  extends Omit<ProductFormValues, "basePrice" | "priceTiers"> {
  basePrice: string | number; // Dari Prisma bisa jadi string (Decimal)
  priceTiers?: {
    minQuantity: number;
    price: string | number; // Dari Prisma bisa jadi string (Decimal)
  }[];
  images?: { id: string; url: string; isFeatured: boolean }[];
  videos?: { id: string; url: string }[];
}

// Tipe data props untuk onSubmit
type FileUploads = {
  images?: FileList;
  videos?: FileList;
};

export default function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
  onMediaDeleted,
}: {
  initialData?: ProductDataFromServer;
  onSubmit: (data: ProductFormValues, files: FileUploads) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onMediaDeleted?: (mediaId: string, type: "image" | "video") => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: initialData
      ? {
          ...initialData,

          basePrice: Number(initialData.basePrice ?? 0),

          attributes: initialData.attributes || [],
          priceTiers:
            initialData.priceTiers?.map((t) => ({
              minQuantity: Number(t.minQuantity),
              price: Number(t.price),
            })) || [],
        }
      : {
          // Mode Create
          name: "",
          sku: "",
          categoryId: "",
          description: "",
          basePrice: 0,
          isCustom: false,
          materialType: "",
          attributes: [],
          priceTiers: [],
        },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        // Menggunakan endpoint "list" yang Anda buat sebelumnya
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

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const {
    fields: priceTierFields,
    append: appendPriceTier,
    remove: removePriceTier,
  } = useFieldArray({
    control: form.control,
    name: "priceTiers",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        basePrice: Number(initialData.basePrice ?? 0),
        attributes: initialData.attributes || [],
        priceTiers:
          initialData.priceTiers?.map((t) => ({
            minQuantity: Number(t.minQuantity),
            price: Number(t.price),
          })) || [],
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: ProductFormValues) => {
    const filesToUpload: FileUploads = {
      images: values.imageFiles,
      videos: values.videoFiles,
    };

    // Pisahkan file dari data utama
    const { imageFiles, videoFiles, ...dataToSend } = values;

    // Mengikuti pola SalesForm:
    // Jika mode update, JANGAN kirim data array (relasi)
    if (initialData) {
      const { attributes, priceTiers, ...coreUpdateData } = dataToSend;
      onSubmit(coreUpdateData as ProductFormValues, filesToUpload);
    } else {
      // Mode create, kirim semua data
      onSubmit(dataToSend, filesToUpload);
    }
  };

  const handleDeleteMedia = async (
    mediaId: string,
    type: "image" | "video"
  ) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const url =
        type === "image"
          ? `http://localhost:8000/products/image/${mediaId}`
          : `http://localhost:8000/products/video/${mediaId}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);

      toast.success(
        `${type === "image" ? "Gambar" : "Video"} berhasil dihapus`
      );

      if (onMediaDeleted) onMediaDeleted(mediaId, type);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus media");
    }
  };

  return (
    <Card className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
            encType="multipart/form-data"
          >
            {/* === Bagian 1: Data Inti Produk === */}
            <div className="space-y-6 rounded-lg border p-4">
              <FormLabel className="text-lg font-semibold">
                Informasi Utama Produk
              </FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> Nama Produk
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nama produk..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Barcode className="h-4 w-4" /> SKU
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Kategori
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={isLoading || isSubmitting}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Base Price */}
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Harga Dasar (IDR)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="100"
                          placeholder="50000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Material Type */}
                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Material (Opsional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cth: Katun, Stainless"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* isCustom */}
                <FormField
                  control={form.control}
                  name="isCustom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Produk</FormLabel>
                      <div className="flex items-center gap-3 pt-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? "Produk Kustom" : "Produk Standar"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detail produk..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* === Bagian 2: Media (Files) === */}
            <div className="space-y-6 rounded-lg border p-4 items-start">
              <FormLabel className="text-lg font-semibold">
                Media Produk
              </FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-2 border rounded-lg bg-card">
                  <UploadImages form={form} name="imageFiles" />
                </div>

                <div className="p-2 border rounded-lg bg-card">
                  <UploadVideos form={form} name="videoFiles" />
                </div>

                {initialData && (initialData.images || initialData.videos) && (
                  <div className="md:col-span-2 space-y-2">
                    <FormLabel>Media Saat Ini</FormLabel>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                      {initialData.images?.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={img.url}
                            alt="Product Image"
                            className="h-16 w-16 rounded object-cover border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5"
                            onClick={() => handleDeleteMedia(img.id, "image")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {initialData.videos?.map((vid) => (
                        <div
                          key={vid.id}
                          className="relative h-16 w-16 rounded bg-gray-800 text-white flex items-center justify-center"
                        >
                          <VideoIcon className="h-6 w-6" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5"
                            onClick={() => handleDeleteMedia(vid.id, "video")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* === Bagian 3 & 4: Atribut & Price Tier (Hanya di Mode Create) === */}
            {/* Sesuai pola SalesForm, sembunyikan ini di mode Edit */}
            {!initialData && (
              <>
                {/* === Atribut Dinamis === */}
                <div className="space-y-4 rounded-lg border p-4">
                  <FormLabel className="flex items-center gap-2 text-lg font-semibold">
                    <Settings className="h-5 w-5" /> Atribut Produk
                  </FormLabel>
                  {attributeFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-end gap-4 p-2 border rounded"
                    >
                      <FormField
                        control={form.control}
                        name={`attributes.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Nama</FormLabel>
                            <Input {...field} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`attributes.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Nilai</FormLabel>
                            <Input {...field} />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeAttribute(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAttribute({ name: "", value: "" })}
                  >
                    + Tambah Atribut
                  </Button>
                </div>
                {/* === Price Tiers Dinamis === */}
                <div className="md:col-span-2 space-y-4 rounded-lg border p-4">
                  <FormLabel className="flex items-center gap-2 text-lg font-semibold">
                    <BarChart className="h-5 w-5" /> Harga Bertingkat (Opsional)
                  </FormLabel>
                  {priceTierFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-end gap-4 p-2 border rounded"
                    >
                      <FormField
                        control={form.control}
                        name={`priceTiers.${index}.minQuantity`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Kuantitas Minimal</FormLabel>
                            <Input type="number" placeholder="10" {...field} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`priceTiers.${index}.price`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Harga (IDR)</FormLabel>
                            <Input
                              type="number"
                              placeholder="45000"
                              {...field}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removePriceTier(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendPriceTier({ minQuantity: 1, price: 0 })
                    }
                  >
                    + Tambah Tingkat Harga
                  </Button>
                </div>
              </>
            )}

            {/* === Tombol Submit === */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Produk" : "Simpan Produk"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
