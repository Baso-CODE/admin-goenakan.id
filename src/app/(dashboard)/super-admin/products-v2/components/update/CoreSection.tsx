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
import { CheckCheck, ChevronsUpDown, RefreshCw, X } from "lucide-react";


const FormCoreSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.preprocess(
    (v) => Number(v),
    z.number().nonnegative("Harga harus angka valid"),
  ),
  isCustom: z.boolean().optional(),
  isMadeByOrder: z.boolean().optional(),
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
  itemCategoryId: z.string().min(1, "Item Category wajib dipilih"),
  itemNameId: z.string().min(1, "Item Name wajib dipilih"),
  tagIds: z.array(z.string()).optional().default([]),

  weight: z.coerce.number().min(0).optional(),
  length: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  height: z.coerce.number().min(0).optional(),
  mockupAreaX: z.number().optional().nullable(),
  mockupAreaY: z.number().optional().nullable(),
  mockupAreaWidth: z.number().optional().nullable(),
  mockupAreaHeight: z.number().optional().nullable(),
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

  // States
  const [categories, setCategories] = useState<any[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [itemNames, setItemNames] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);

  const form = useForm<ProductCoreFormValues>({
    resolver: zodResolver(FormCoreSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      basePrice: 0,
      stock: 0,
      isCustom: false,
      isMadeByOrder: false,
      materialTypeId: "",
      categoryId: "",
      itemCategoryId: "",
      itemNameId: "",
      tagIds: [],
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      mockupAreaX: null,
      mockupAreaY: null,
      mockupAreaWidth: null,
      mockupAreaHeight: null,
    },
  });

  const isCustomProduct = form.watch("isCustom");

  // ✨ 1. INITIALIZATION API FETCH (Tanpa Race Condition)
  useEffect(() => {
    let isMounted = true; // Keamanan agar state tidak bocor jika komponen ditutup

    const initializeForm = async () => {
      if (status === "loading" || status === "unauthenticated") return;
      setLoadingData(true);

      try {
        // A. Ambil data Master (Category Induk, Tag, Material)
        const [catRes, tagRes, matRes] = await Promise.all([
          fetchApi("/product-categories/list"),
          fetchApi("/product-tags/list"),
          fetchApi("/material-types/list"),
        ]);

        const cats = await catRes.json();
        const tagsData = await tagRes.json();
        const mats = await matRes.json();

        if (!isMounted) return;
        setCategories(cats || []);
        setTags(tagsData || []);
        setMaterialTypes(mats || []);

        // B. Jika Mode Edit, ambil data turunannya
        let fetchedItemCats: any[] = [];
        let fetchedItemNames: any[] = [];

        if (initialData) {
          if (initialData.categoryId) {
            const resIC = await fetchApi(
              `/item-categories?productCategoryId=${initialData.categoryId}&take=100`,
            );
            const dataIC = await resIC.json();
            fetchedItemCats = dataIC.data || [];
          }

          if (initialData.itemCategoryId) {
            const resIN = await fetchApi(
              `/item-names?itemCategoryId=${initialData.itemCategoryId}&take=100`,
            );
            const dataIN = await resIN.json();
            fetchedItemNames = dataIN.data || [];
          }
        }

        if (!isMounted) return;

        // Simpan ke state
        setItemCategories(fetchedItemCats);
        setItemNames(fetchedItemNames);

        // C. Kunci Utama: Beri React waktu (50ms) untuk menggambar <SelectItem> ke layar, baru jalankan reset()
        setTimeout(() => {
          if (!isMounted) return;

          if (initialData) {
            form.reset({
              name: initialData.name || "",
              description: initialData.description || "",
              sku: initialData.sku || "",
              basePrice: initialData.basePrice || 0,
              stock: initialData.stock || 0,
              isCustom: initialData.isCustom || false,
              isMadeByOrder: initialData.isMadeByOrder || false,
              materialTypeId: initialData.materialTypeId || "",
              categoryId: initialData.categoryId || "",
              itemCategoryId: initialData.itemCategoryId || "",
              itemNameId: initialData.itemNameId || "",
              tagIds: initialData.tags
                ? initialData.tags.map((t: any) => t.id)
                : [],
              weight: initialData.weight || 0,
              length: initialData.length || 0,
              width: initialData.width || 0,
              height: initialData.height || 0,
              mockupAreaX: initialData.mockupAreaX ?? null,
              mockupAreaY: initialData.mockupAreaY ?? null,
              mockupAreaWidth: initialData.mockupAreaWidth ?? null,
              mockupAreaHeight: initialData.mockupAreaHeight ?? null,
            });
          }

          setLoadingData(false); // Buka kunci form
        }, 50);
      } catch (error) {
        toast.error("Gagal memuat data awal.");
        setLoadingData(false);
      }
    };

    initializeForm();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchApi, initialData]); // Dibatasi ketat hanya render saat data inisialisasi masuk

  // ✨ 2. FUNGSI HANDLER MANUAL UNTUK DROPDOWN (Lebih stabil dari useEffect)
  const handleCategoryChange = async (val: string) => {
    form.setValue("categoryId", val);
    form.setValue("itemCategoryId", ""); // Kosongkan anak
    form.setValue("itemNameId", ""); // Kosongkan cucu
    setItemCategories([]);
    setItemNames([]);

    if (!val) return;
    try {
      const res = await fetchApi(
        `/item-categories?productCategoryId=${val}&take=100`,
      );
      const result = await res.json();
      setItemCategories(result.data || []);
    } catch (e) {
      toast.error("Gagal memuat item categories");
    }
  };

  const handleItemCategoryChange = async (val: string) => {
    form.setValue("itemCategoryId", val);
    form.setValue("itemNameId", ""); // Kosongkan cucu
    setItemNames([]);

    if (!val) return;
    try {
      const res = await fetchApi(`/item-names?itemCategoryId=${val}&take=100`);
      const result = await res.json();
      setItemNames(result.data || []);
    } catch (e) {
      toast.error("Gagal memuat item names");
    }
  };

  // 3. Fungsi Generate SKU
  const handleGenerateSku = async () => {
    const vals = form.getValues();
    if (
      !vals.name ||
      !vals.categoryId ||
      !vals.itemCategoryId ||
      !vals.itemNameId ||
      !vals.materialTypeId
    ) {
      toast.error(
        "Mohon lengkapi Nama, Hirarki Kategori, dan Material untuk generate SKU",
      );
      return;
    }

    try {
      setIsGeneratingSku(true);
      const res = await fetchApi("/products/generate-sku", {
        method: "POST",
        body: JSON.stringify({
          productName: vals.name,
          categoryId: vals.categoryId,
          itemCategoryId: vals.itemCategoryId,
          itemNameId: vals.itemNameId,
          materialTypeId: vals.materialTypeId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        form.setValue("sku", data.sku);
        toast.success("SKU berhasil dibuat!");
      } else {
        throw new Error(data.message || "Gagal generate SKU");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGeneratingSku(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 border p-6 rounded-md bg-white shadow-sm">
        {/* SECTION 1: IDENTITAS PRODUK */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
            Identitas Produk
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Meja Kayu Jati" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>SKU</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Auto / Manual" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateSku}
                      disabled={isGeneratingSku}
                      className="shrink-0">
                      <RefreshCw
                        className={`h-4 w-4 ${isGeneratingSku ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 2: HIRARKI KATEGORI & MATERIAL */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
            Hirarki & Material
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori Utama</FormLabel>
                  {/* Panggil fungsi manual di onValueChange */}
                  <Select
                    value={field.value || ""}
                    onValueChange={handleCategoryChange}
                    disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name_id || cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Category</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={handleItemCategoryChange}
                    disabled={loadingData || itemCategories.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Sub Kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemCategories.map((ic) => (
                        <SelectItem key={ic.id} value={String(ic.id)}>
                          {ic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemNameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={loadingData || itemNames.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Nama Item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemNames.map((inm) => (
                        <SelectItem key={inm.id} value={String(inm.id)}>
                          {inm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materialTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Material" />
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
          </div>
        </div>

        {/* SECTION 3: HARGA, STOK & TAGS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
            Harga, Stok & Label
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Stok Global
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
                      placeholder={
                        isCustomProduct ? "0" : "Masukkan jumlah stok"
                      }
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
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
                    <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white">
                      <span
                        className={`text-sm cursor-pointer ${!field.value ? "font-bold text-primary" : "text-gray-400"}`}
                        onClick={() => field.onChange(false)}>
                        Standard
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) form.setValue("stock", 0);
                        }}
                      />
                      <span
                        className={`text-sm cursor-pointer ${field.value ? "font-bold text-primary" : "text-gray-400"}`}
                        onClick={() => field.onChange(true)}>
                        Custom
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isMadeByOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistem Order saat Stok Habis</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm text-stone-600">
                        Made by Order / Pre-Order (Bisa dipesan walaupun stok habis)
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => {
                const selectedTags = field.value || [];
                return (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Product Tags</FormLabel>
                    <Popover
                      open={tagSearchOpen}
                      onOpenChange={setTagSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-auto min-h-10 text-left bg-white",
                              selectedTags.length === 0 &&
                                "text-muted-foreground",
                            )}>
                            <div className="flex flex-wrap gap-1.5 items-center py-1">
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
                                const isSelected = selectedTags.includes(
                                  tag.id,
                                );
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
                                        isSelected
                                          ? "opacity-100"
                                          : "opacity-0",
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
        </div>

        {/* SECTION 4: DIMENSI & DESKRIPSI */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
            Dimensi & Deskripsi
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-4">
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
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-10 h-11">
            {isSubmitting ? "Menyimpan Data..." : "Simpan Data Core"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
