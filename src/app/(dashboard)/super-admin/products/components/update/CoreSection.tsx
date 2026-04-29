"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { CheckCheck, ChevronsUpDown, X } from "lucide-react";

const FormCoreSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.preprocess(
    (v) => Number(v),
    z.number().nonnegative("Harga harus angka valid"),
  ),
  isCustom: z.boolean().optional(),
  materialTypeId: z.string().min(1, "Material wajib dipilih").optional(),
  stock: z.preprocess(
    (v) => Number(v),
    z
      .number()
      .int()
      .nonnegative("Stok harus berupa angka bulat dan tidak boleh negatif")
      .default(0),
  ),
  materialType: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  tagIds: z.array(z.string()).optional().default([]),

  weight: z.coerce.number().min(0).optional(),
  length: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  height: z.coerce.number().min(0).optional(),
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
  const { fetchApi, status } = useApi();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tags, setTags] = useState<any[]>([]);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

  const form = useForm<ProductCoreFormValues>({
    resolver: zodResolver(FormCoreSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      basePrice: 0,
      stock: 0,
      isCustom: false,
      materialTypeId: "",
      materialType: "",
      categoryId: "",
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
    },
  });

  const isCustomProduct = form.watch("isCustom");
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description ?? "",
        sku: initialData.sku ?? "",
        basePrice: initialData.basePrice ?? 0,
        stock: initialData.stock ?? 0,
        isCustom: initialData.isCustom ?? false,
        materialTypeId: initialData.materialTypeId ?? "",
        categoryId: initialData.categoryId ?? "",
        tagIds: initialData.tags ? initialData.tags.map((t: any) => t.id) : [],
        weight: initialData.weight ?? 0,
        length: initialData.length ?? 0,
        width: initialData.width ?? 0,
        height: initialData.height ?? 0,
      });
    }
  }, [initialData, categories, form]);

  // Fetch kategori, tags, & material types
  useEffect(() => {
    const fetchFormData = async () => {
      if (status === "loading" || status === "unauthenticated") return;

      setLoadingData(true);
      try {
        const [catRes, tagRes, matRes] = await Promise.all([
          fetchApi("/product-categories/list"),
          fetchApi("/product-tags/list"),
          fetchApi("/material-types/list"),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags((await tagRes.json()) || []);
        if (matRes.ok) setMaterialTypes((await matRes.json()) || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load form data.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchFormData();
  }, [status, fetchApi]);
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 border p-6 rounded-md bg-white shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
          Core Product Data
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Name - Span 2 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingData ? "Loading..." : "Pilih kategori"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✨ Material Type Select */}
          <FormField
            control={form.control}
            name="materialTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingData ? "Loading..." : "Pilih material"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {materialTypes.map((mat) => (
                      <SelectItem key={mat.id} value={String(mat.id)}>
                        {mat.name}
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
                <FormLabel>Harga Dasar (Rp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Stok{" "}
                  {isCustomProduct && (
                    <span className="text-[10px] text-amber-600 font-normal italic">
                      (Diatur per Varian)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={isCustomProduct}
                    placeholder={isCustomProduct ? "0" : "Masukkan jumlah stok"}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Product Toggle - Span 2 */}
          <FormField
            control={form.control}
            name="isCustom"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Tipe Produk</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white">
                    <span
                      className={`text-sm cursor-pointer transition-colors ${
                        !field.value
                          ? "font-bold text-primary"
                          : "text-gray-400"
                      }`}
                      onClick={() => field.onChange(false)}>
                      Standard
                    </span>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) form.setValue("stock", 0); // Reset stock if custom
                      }}
                    />
                    <span
                      className={`text-sm cursor-pointer transition-colors ${
                        field.value ? "font-bold text-primary" : "text-gray-400"
                      }`}
                      onClick={() => field.onChange(true)}>
                      Custom
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Tags - Full Width */}
          <FormField
            control={form.control}
            name="tagIds"
            render={({ field }) => {
              const selectedTags = field.value || [];
              return (
                <FormItem className="flex flex-col md:col-span-3">
                  <FormLabel>Product Tags</FormLabel>
                  <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-auto min-h-11 text-left bg-white",
                            selectedTags.length === 0 &&
                              "text-muted-foreground",
                          )}>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {selectedTags.length > 0
                              ? selectedTags.map((tagId) => {
                                  const tagInfo = tags.find(
                                    (t) => t.id === tagId,
                                  );
                                  if (!tagInfo) return null;
                                  return (
                                    <Badge
                                      key={tagId}
                                      variant="secondary"
                                      className="flex items-center gap-1 px-2 py-1">
                                      {tagInfo.name}
                                      <X
                                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          field.onChange(
                                            selectedTags.filter(
                                              (id) => id !== tagId,
                                            ),
                                          );
                                        }}
                                      />
                                    </Badge>
                                  );
                                })
                              : "Pilih tag produk..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start">
                      <Command>
                        <CommandInput
                          placeholder="Cari tag..."
                          onValueChange={setTagSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>Tag tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {tags.map((tag) => {
                              const isSelected = selectedTags.includes(tag.id);
                              return (
                                <CommandItem
                                  key={tag.id}
                                  onSelect={() => {
                                    field.onChange(
                                      isSelected
                                        ? selectedTags.filter(
                                            (id) => id !== tag.id,
                                          )
                                        : [...selectedTags, tag.id],
                                    );
                                    setTagSearchQuery("");
                                  }}>
                                  <CheckCheck
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {tag.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Dimension Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6">
          {["weight", "length", "width", "height"].map((dim) => (
            <FormField
              key={dim}
              control={form.control}
              name={dim as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">
                    {dim === "weight" ? "Berat (gr)" : dim + " (cm)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Produk</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Jelaskan detail produk..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-8">
            {isSubmitting ? "Updating..." : "Update Core Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
