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
import { apiUrl } from "@/helper/apiurl";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tags, setTags] = useState<any[]>([]);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

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
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
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
        tagIds: initialData.tags ? initialData.tags.map((t: any) => t.id) : [],
        weight: initialData.weight ?? 0,
        length: initialData.length ?? 0,
        width: initialData.width ?? 0,
        height: initialData.height ?? 0,
      });
    }
  }, [initialData, categories, form]);

  // Fetch kategori
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const catRes = await fetch(`${apiUrl}/product-categories/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const data = await catRes.json();
        setCategories(data);

        const tagRes = await fetch(`${apiUrl}/product-tags/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tagData = await tagRes.json();
        setTags(tagData || []);
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
        className="space-y-6 border p-4 rounded-md">
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
                    disabled={loadingCategories}>
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
              <FormItem>
                <FormLabel>Tipe Produk</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-3 h-10 border rounded-md px-3">
                    <span
                      className={`text-sm cursor-pointer transition-colors ${
                        !field.value ? "font-bold text-black" : "text-gray-400"
                      }`}
                      onClick={() => field.onChange(false)}>
                      Standard
                    </span>

                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />

                    <span
                      className={`text-sm cursor-pointer transition-colors ${
                        field.value ? "font-bold text-black" : "text-gray-400"
                      }`}
                      onClick={() => field.onChange(true)}>
                      Custom
                    </span>
                  </div>
                </FormControl>
                <p className="text-[0.8rem] text-muted-foreground">
                  {field.value
                    ? "Produk memiliki varian & attribut (Warna, Ukuran, dll)."
                    : "Produk standar tanpa variasi."}
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tagIds"
            render={({ field }) => {
              const selectedTags = field.value || [];
              return (
                <FormItem className="flex flex-col col-span-1 md:col-span-3">
                  <FormLabel>Product Tags</FormLabel>
                  <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={tagSearchOpen}
                          className={cn(
                            "w-full justify-between h-auto min-h-10 text-left",
                            selectedTags.length === 0 &&
                              "text-muted-foreground",
                          )}>
                          <div className="flex flex-wrap gap-1 items-center">
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
                                      className="flex items-center gap-1 px-2 py-0.5">
                                      {tagInfo.name}
                                      <div
                                        className="rounded-full hover:bg-red-200 p-0.5 transition-colors cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newTags = selectedTags.filter(
                                            (id) => id !== tagId,
                                          );
                                          field.onChange(newTags);
                                        }}>
                                        <X className="h-3 w-3" />
                                      </div>
                                    </Badge>
                                  );
                                })
                              : "Pilih tag produk..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Cari tag..."
                          value={tagSearchQuery}
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
                                  value={tag.name}
                                  onSelect={() => {
                                    if (isSelected) {
                                      field.onChange(
                                        selectedTags.filter(
                                          (id) => id !== tag.id,
                                        ),
                                      );
                                    } else {
                                      field.onChange([...selectedTags, tag.id]);
                                    }
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Berat (gram)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    {...field}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                    }}
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
                    step="any"
                    min={0}
                    {...field}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                    }}
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
                    step="any"
                    min={0}
                    {...field}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                    }}
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
                    step="any"
                    min={0}
                    {...field}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                    }}
                  />
                </FormControl>
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
