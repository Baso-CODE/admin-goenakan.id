"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AddItemCategoryModal } from "../../item-categories-product/components/addItemCategoryModal";
import { AddItemNameModal } from "../../item-names-product/components/addItemNameModal";
import CreateCategoryModal from "../../product-categories/components/createCategoryModal";
import { AttributeSelector } from "./AttributeSelector";
import { PriceTiers } from "./PriceTiers";
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";

// === Tipe Data ===
type Category = {
  id: string;
  name: string;
  code?: string;
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

const variantMetaSchema = z.object({
  variantIndex: z.number(),
  isFeatured: z.boolean().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  stock: z.number().min(0, "Stock minimal 0").default(0),
  altText: z.string().optional(),
  description: z.string().optional(),
  weight: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  length: z.number().optional(),
  priceTiers: z.array(priceTierSchema).optional(),
});

// Video meta schema tetap sama
const videoMetaSchema = z.object({
  url: z.string().optional(),
  publicId: z.string().optional(),
  title: z.string().optional(),
  altText: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  itemCategoryId: z.string().min(1, "Item Category wajib dipilih"),
  itemNameId: z.string().min(1, "Item Name wajib dipilih"),
  tagIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be >= 0"),
  isCustom: z.boolean().optional(),
  materialTypeId: z.string().min(1, "Material wajib dipilih"),
  stock: z.number().min(0, "Stock minimal 0").optional().default(0),
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
      }),
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
    [[]] as T[][],
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
    },
  ) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi, status } = useApi();

  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [itemNames, setItemNames] = useState<any[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [materialTypes, setMaterialTypes] = useState<
    { id: string; name: string; code?: string }[]
  >([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemCategoryModalOpen, setIsItemCategoryModalOpen] = useState(false);
  const [isItemNameModalOpen, setIsItemNameModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      if (status === "loading" || status === "unauthenticated") return;

      try {
        // Fetch Categories
        const catRes = await fetchApi("/product-categories/list");
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const data = await catRes.json();
        setCategories(data);

        // Fetch Tags
        const tagRes = await fetchApi("/product-tags/list");
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData);
        }

        const matRes = await fetchApi("/material-types/list");
        if (matRes.ok) {
          const matData = await matRes.json();
          setMaterialTypes(matData);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load categories.");
      }
    };

    fetchCategories();
  }, [status, fetchApi]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      itemCategoryId: "",
      itemNameId: "",
      tagIds: [],
      description: "",
      basePrice: 0,
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      isCustom: false,
      materialTypeId: "",
      stock: 0,
      attributes: [],
      priceTiers: [],
      imagesMetadata: [],
      videosMetadata: [],
      variantImagesMetadata: [],
    } as ProductFormValues,
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedItemCategoryId = form.watch("itemCategoryId");

  useEffect(() => {
    const fetchItemCategories = async () => {
      if (!selectedCategoryId) {
        setItemCategories([]);
        return;
      }
      try {
        const res = await fetchApi(
          `/item-categories?productCategoryId=${selectedCategoryId}&take=100`,
        );
        const result = await res.json();
        setItemCategories(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil Item Categories:", error);
      }
    };

    fetchItemCategories();
  }, [selectedCategoryId, fetchApi]);

  useEffect(() => {
    const fetchItemNames = async () => {
      if (!selectedItemCategoryId) {
        setItemNames([]);
        return;
      }
      try {
        const res = await fetchApi(
          `/item-names?itemCategoryId=${selectedItemCategoryId}&take=100`,
        );
        const result = await res.json();
        setItemNames(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil Item Names:", error);
      }
    };

    fetchItemNames();
  }, [selectedItemCategoryId, fetchApi]);

  const isCustomProduct = form.watch("isCustom");

  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[] }[]
  >(form.getValues("attributes") ?? []);

  const [combinations, setCombinations] = useState<
    { label: string; valueIds: string[] }[]
  >([]);

  const [attributesList, setAttributesList] = useState<any[]>([]);

  const [variantMetas, setVariantMetas] = useState<
    {
      variantIndex: number;
      price: number;
      stock: number;
      isFeatured?: boolean;
      altText?: string;
    }[]
  >([]);

  const [variantFilesMap, setVariantFilesMap] = useState<File[][]>([]);
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isCustomProduct) {
      setAttributeSelections([]);
      setCombinations([]);
      setVariantMetas([]);
      setVariantFilesMap([]);
      form.setValue("attributes", []);
      form.setValue("variantImagesMetadata", []);
    } else {
      form.setValue("stock", 0);
    }
  }, [isCustomProduct, form]);

  useEffect(() => {
    if (!isCustomProduct) {
      setAttributeSelections([]);
      setCombinations([]);
      setVariantMetas([]);
      setVariantFilesMap([]);
      form.setValue("attributes", []);
      form.setValue("variantImagesMetadata", []);
    }
  }, [isCustomProduct, form]);

  // --- UPDATE GENERATE SKU ---
  const handleGenerateSku = async () => {
    const values = form.getValues();

    // Validasi Nama
    if (!values.name || values.name.length < 3) {
      toast.error("Mohon isi Nama Produk minimal 3 karakter.");
      return;
    }

    if (
      !values.categoryId ||
      !values.itemCategoryId ||
      !values.itemNameId ||
      !values.materialTypeId
    ) {
      toast.error(
        "Pastikan Kategori, Item Category, Item Name, dan Material sudah dipilih!",
      );
      return;
    }

    if (status !== "authenticated") return;

    try {
      setIsGeneratingSku(true);
      const res = await fetchApi("/products/generate-sku", {
        method: "POST",
        body: JSON.stringify({
          productName: values.name,
          categoryId: values.categoryId,
          itemCategoryId: values.itemCategoryId,
          itemNameId: values.itemNameId,
          materialTypeId: values.materialTypeId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal generate SKU");
      }

      const data = await res.json();
      form.setValue("sku", data.sku);
      toast.success(`SKU Generated: ${data.sku}`);
    } catch (error: any) {
      console.error("❌ Generate SKU Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat generate SKU");
    } finally {
      setIsGeneratingSku(false);
    }
  };

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
    const currentBasePrice = Number(form.getValues("basePrice")) || 0;

    const newVariantMetas = comboObjects.map((_, idx) => ({
      variantIndex: idx,
      price: currentBasePrice,
      stock: 0,
      isFeatured: false,
      altText: "",
      description: "",
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      priceTiers: [],
    }));

    setVariantMetas(newVariantMetas);
    form.setValue("variantImagesMetadata", newVariantMetas);
    setVariantFilesMap(comboObjects.map(() => []));
  };

  const handleUpdateVariantMeta = (
    index: number,
    field: string,
    value: any,
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

  const handleVariantImagesChange = (filesMap: File[][]) => {
    setVariantFilesMap(filesMap);
  };

  const submit = async (values: ProductFormValues) => {
    try {
      const finalAttributes = isCustomProduct ? attributeSelections : undefined;
      const finalVariantMetas = isCustomProduct ? variantMetas : [];
      const finalVariantFiles = isCustomProduct ? variantFilesMap : [];

      const payload: ProductFormValues = {
        ...values,
        basePrice: Number(values.basePrice),
        stock: isCustomProduct ? 0 : Number(values.stock || 0),
        weight: values.weight ? Number(values.weight) : 0,
        width: values.width ? Number(values.width) : 0,
        height: values.height ? Number(values.height) : 0,
        length: values.length ? Number(values.length) : 0,
        attributes: finalAttributes?.length ? finalAttributes : undefined,
        priceTiers: values.priceTiers?.length ? values.priceTiers : undefined,
        imagesMetadata: values.imagesMetadata?.length
          ? values.imagesMetadata
          : undefined,
        videosMetadata: values.videosMetadata,
        variantImagesMetadata: finalVariantMetas,
      };

      const filesToSubmit = {
        images: productImagesFiles.length > 0 ? productImagesFiles : null,
        videos: null,
        variantImages: finalVariantFiles,
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
              {/* NAMA PRODUK */}
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

              {/* KATEGORI */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Produk</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        // ✨ LOGIKA PINTAR: Tangkap jika user klik opsi "Tambah Baru"
                        if (val === "ADD_NEW_CATEGORY") {
                          setIsCategoryModalOpen(true);
                          return; // Berhenti di sini, jangan ubah value form
                        }

                        field.onChange(val);
                        // Reset child ketika parent berubah
                        form.setValue("itemCategoryId", "");
                        form.setValue("itemNameId", "");
                      }}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} {cat.code && `(${cat.code})`}
                          </SelectItem>
                        ))}

                        {/* ✨ PEMBATAS & TOMBOL TAMBAH DI DALAM DROPDOWN */}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_CATEGORY"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Kategori Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ITEM CATEGORY  */}
              <FormField
                control={form.control}
                name="itemCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Category</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        if (val === "ADD_NEW_ITEM_CATEGORY") {
                          setIsItemCategoryModalOpen(true);
                          return;
                        }

                        field.onChange(val);
                        form.setValue("itemNameId", "");
                      }}
                      value={field.value}
                      disabled={!selectedCategoryId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemCategories.length === 0 && (
                          <div className="py-2 text-center text-xs text-muted-foreground italic">
                            Belum ada item.
                          </div>
                        )}
                        {itemCategories.map((ic) => (
                          <SelectItem key={ic.id} value={ic.id}>
                            {ic.name} {ic.code && `(${ic.code})`}
                          </SelectItem>
                        ))}

                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_ITEM_CATEGORY"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Item Category Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ITEM NAME  */}
              <FormField
                control={form.control}
                name="itemNameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(val) => {
                        // ✨ TANGKAP KLIK "TAMBAH BARU"
                        if (val === "ADD_NEW_ITEM_NAME") {
                          setIsItemNameModalOpen(true);
                          return;
                        }
                        field.onChange(val);
                      }}
                      disabled={!selectedItemCategoryId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item name..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemNames.length === 0 && (
                          <div className="py-2 text-center text-xs text-muted-foreground italic">
                            Belum ada item.
                          </div>
                        )}
                        {itemNames.map((inm) => (
                          <SelectItem key={inm.id} value={inm.id}>
                            {inm.name} {inm.code && `(${inm.code})`}
                          </SelectItem>
                        ))}

                        {/* ✨ TOMBOL TAMBAH DI DALAM DROPDOWN */}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_ITEM_NAME"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Item Name Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MATERIAL TYPE */}
              <FormField
                control={form.control}
                name="materialTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis material..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialTypes.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name} {mat.code && `(${mat.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SKU (Digeser setelah input yang dibutuhkan siap) */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Contoh: ELE-LAP-MAC-ALU-MA0001"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateSku}
                        disabled={isGeneratingSku}
                        title="Auto Generate SKU dari Hirarki Produk"
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

              {/* BASE PRICE */}
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

              {/* STOCK (Only for Standard Product) */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Stok
                      {form.watch("isCustom") && (
                        <span className="text-[10px] text-amber-600 font-normal italic">
                          (Diatur per Varian)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={form.watch("isCustom")}
                        placeholder={
                          form.watch("isCustom") ? "0" : "Masukkan jumlah stok"
                        }
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SWITCH CUSTOM */}
              <FormField
                control={form.control}
                name="isCustom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Produk</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3 h-10 border rounded-md px-3 bg-white">
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
                          onCheckedChange={field.onChange}
                        />

                        <span
                          className={`text-sm cursor-pointer transition-colors ${
                            field.value
                              ? "font-bold text-primary"
                              : "text-gray-400"
                          }`}
                          onClick={() => field.onChange(true)}>
                          Custom
                        </span>
                      </div>
                    </FormControl>
                    <p className="text-[0.8rem] text-muted-foreground">
                      {field.value
                        ? "Varian memiliki stok masing-masing."
                        : "Stok dikelola secara global di sini."}
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* TAGS (Sama seperti sebelumnya) */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => {
                const selectedTags = field.value || [];
                return (
                  <FormItem className="flex flex-col col-span-1 md:col-span-3 mt-4">
                    <FormLabel>Product Tags</FormLabel>
                    <Popover
                      open={tagSearchOpen}
                      onOpenChange={setTagSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={tagSearchOpen}
                            className={cn(
                              "w-full justify-between h-auto min-h-10 text-left bg-white",
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
                                        className="mr-1 mb-1 flex items-center gap-1 px-2 py-0.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newTags = selectedTags.filter(
                                            (id) => id !== tagId,
                                          );
                                          field.onChange(newTags);
                                        }}>
                                        {tagInfo.name}
                                        <X className="h-3 w-3 text-slate-500 hover:text-red-500 cursor-pointer" />
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
                            value={tagSearchQuery}
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
                                    value={tag.name}
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
                                    <Check
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

            {/* DIMENSI & DESKRIPSI & MEDIA - TIDAK BERUBAH */}
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
                        step="any"
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
            <div className="mt-6">
              <PriceTiers />
            </div>

            {/* Media Produk */}
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
                    label="Video Promosi Produk"
                    max={3}
                  />
                </div>
              </div>
            </div>

            {isCustomProduct && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="border rounded p-4 bg-gray-50/50">
                  <h3 className="font-semibold mb-3 text-lg">
                    Konfigurasi Varian
                  </h3>
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
                  <div className="border rounded p-4 mt-4 bg-gray-50/50">
                    <VariantList
                      combinations={combinations}
                      variantMetas={variantMetas}
                      onUpdateVariantMeta={handleUpdateVariantMeta}
                      onChangeMeta={handleVariantImagesChange}
                    />
                  </div>
                )}
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

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={(newCategory) => {
          const formattedCategory = {
            ...newCategory,
            name: newCategory.name_id || newCategory.name,
          };

          setCategories((prev) => [...prev, formattedCategory]);
          form.setValue("categoryId", formattedCategory.id);
          form.setValue("itemCategoryId", "");
          form.setValue("itemNameId", "");
        }}
      />
      <AddItemCategoryModal
        isOpen={isItemCategoryModalOpen}
        onClose={() => setIsItemCategoryModalOpen(false)}
        parentCategoryId={selectedCategoryId}
        onSuccess={(newItemCategory) => {
          setItemCategories((prev) => [...prev, newItemCategory]);
          form.setValue("itemCategoryId", newItemCategory.id);
          form.setValue("itemNameId", "");
        }}
      />

      <AddItemNameModal
        isOpen={isItemNameModalOpen}
        onClose={() => setIsItemNameModalOpen(false)}
        parentCategoryId={selectedCategoryId}
        parentItemCategoryId={selectedItemCategoryId}
        productCategories={categories}
        itemCategories={itemCategories}
        onSuccess={(newItemName) => {
          setItemNames((prev) => [...prev, newItemName]);
          form.setValue("itemNameId", newItemName.id);
        }}
      />
    </Card>
  );
}
