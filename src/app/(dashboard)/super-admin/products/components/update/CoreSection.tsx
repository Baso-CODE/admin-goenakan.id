"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const FormCoreSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.preprocess(
    (v) => Number(v),
    z.number().nonnegative("Harga harus angka valid")
  ),
  isCustom: z.boolean().optional(),
  materialType: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
});

export type ProductCoreFormValues = z.infer<typeof FormCoreSchema>;

export default function FormProductCore({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData?: any;
  onSubmit: (values: ProductCoreFormValues) => void;
  isSubmitting: boolean;
}) {
  console.log(
    "ini adalah data dari intial di form update product",
    initialData
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const form = useForm<ProductCoreFormValues>({
    resolver: zodResolver(FormCoreSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      basePrice: 0,
      isCustom: false,
      materialType: "",
      categoryId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description ?? "",
        sku: initialData.sku ?? "",
        basePrice: initialData.basePrice ?? 0,
        isCustom: initialData.isCustom ?? false,
        materialType: initialData.materialType ?? "",
        categoryId: initialData.categoryId ?? "",
      });
    }
  }, [initialData, categories]);

  // Fetch kategori
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
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
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 border p-4 rounded-md"
      >
        <h3 className="text-lg font-semibold tracking-tight">
          Core Product Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Produk</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Produk" {...field} />
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
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="SKU (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Select */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingCategories
                            ? "Loading kategori..."
                            : "Pilih kategori"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
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
                <FormLabel>Harga Dasar</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
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
                <FormLabel>Material</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Material (ex: Kayu, Kain, Bambu)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Custom Product */}
          <FormField
            control={form.control}
            name="isCustom"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
                <FormLabel>Produk Custom?</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Deskripsi produk..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="">
          {isSubmitting ? "Updating..." : "Update Core Data"}
        </Button>
      </form>
    </Form>
  );
}
