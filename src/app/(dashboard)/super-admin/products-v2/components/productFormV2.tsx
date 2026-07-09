"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useProductFormV2 } from "@/hooks/useProductFormV2";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, RefreshCw, X, Layers } from "lucide-react";
import { AddItemCategoryModal } from "../../item-categories-product/components/addItemCategoryModal";
import { AddItemNameModal } from "../../item-names-product/components/addItemNameModal";
import CreateCategoryModal from "../../product-categories/components/createCategoryModal";
import MaterialTypeForm from "../../product-materials/components/materialTypeForm";
import { AttributeSelector } from "./AttributeSelector";
import { PriceTiers } from "./PriceTiers";
import { ProductFormValues } from "./product.schema";
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";
import FormUpdateAttributes from "./update/AttributesSection";
import FormUpdateVariants from "./update/VariantsSection";
import { toast } from "sonner";
import { ProductMockupModal } from "./ProductMockupModal";
import { MockupAreaSelector } from "./MockupAreaSelector";

export default function ProductFormV2({
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  onSubmit: (data: ProductFormValues, files: any) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // Panggil Custom Hook
  const { form, submit, state, setters, handlers } = useProductFormV2(onSubmit);

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  useEffect(() => {
    if (state.productImagesFiles && state.productImagesFiles.length > 0) {
      const url = URL.createObjectURL(state.productImagesFiles[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(undefined);
    }
  }, [state.productImagesFiles]);

  const [productData, setProductData] = useState<any>({
    isCustom: false,
    images: [],
    productVariants: [],
    attributeValues: [],
  });

  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentFullList, setCurrentFullList] = useState<any[]>([]);

  // Sync isCustom and basePrice to productData
  const isCustomProduct = state.isCustomProduct;
  const basePrice = form.watch("basePrice") || 0;

  useEffect(() => {
    setProductData((prev: any) => ({
      ...prev,
      isCustom: isCustomProduct,
      basePrice: basePrice,
    }));
  }, [isCustomProduct, basePrice]);

  // Sync uploaded images to productData
  useEffect(() => {
    if (state.productImagesFiles) {
      setProductData((prev: any) => ({
        ...prev,
        images: state.productImagesFiles.map((file, idx) => {
          // If file is already mocked, preserve url to avoid revoking
          const existing = prev.images?.find((img: any) => img.id === file.name);
          return {
            id: file.name,
            url: existing?.url || URL.createObjectURL(file),
            altText: file.name,
            isFeatured: idx === 0,
            mockupAreas: existing?.mockupAreas || [],
          };
        }),
      }));
    }
  }, [state.productImagesFiles]);

  useEffect(() => {
    form.setValue("productData", productData);
  }, [productData, form]);

  const handleUpdateAttributesLocal = async (payload: any) => {
    // Save to form attributes schema
    const mappedAttrs = currentSelections.map((sel) => ({
      attributeId: sel.attributeId,
      valueIds: sel.valueIds,
      priceModifiers: sel.priceModifiers || {},
    }));
    form.setValue("attributes", mappedAttrs);

    // Update productData.attributeValues
    const mappedVals = currentSelections.flatMap((sel: any) =>
      sel.valueIds.map((valId: string) => ({
        attributeId: sel.attributeId,
        attributeValueId: valId,
        priceModifier: sel.priceModifiers?.[valId] || 0,
        weight: sel.weights?.[valId] || 0,
        width: sel.widths?.[valId] || 0,
        height: sel.heights?.[valId] || 0,
        length: sel.lengths?.[valId] || 0,
      }))
    );

    setProductData((prev: any) => ({
      ...prev,
      attributeValues: mappedVals,
    }));

    toast.success("Attributes saved locally");
  };

  const handleUpdateMediaMockupsLocal = async (mediaId: string, mockups: any[]) => {
    setProductData((prev: any) => ({
      ...prev,
      images: prev.images.map((img: any) =>
        img.id === mediaId ? { ...img, mockupAreas: mockups } : img
      ),
    }));
    toast.success("Mockup areas saved locally");
  };

  const handleUpdateMockupSettingsLocal = async (settings: any) => {
    setProductData((prev: any) => ({
      ...prev,
      ...settings,
    }));
    toast.success("Mockup settings saved locally");
  };

  const handleUpdateMediaMetadataLocal = async (mediaId: string, updates: any) => {
    setProductData((prev: any) => ({
      ...prev,
      images: prev.images.map((img: any) =>
        img.id === mediaId ? { ...img, ...updates } : img
      ),
    }));
    toast.success("Media metadata saved locally");
  };

  const handleUpdateVariantsLocal = async (values: any) => {
    const newVariantMetas = values.variants.map((v: any, idx: number) => ({
      variantIndex: idx,
      price: Number(v.price),
      stock: Number(v.stock),
      description: v.description || "",
      weight: v.weight ? Number(v.weight) : undefined,
      width: v.width ? Number(v.width) : undefined,
      height: v.height ? Number(v.height) : undefined,
      length: v.length ? Number(v.length) : undefined,
      priceTiers: (v.priceTiers || []).map((t: any) => ({
        minQuantity: Number(t.minQuantity),
        maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
        price: String(t.price),
      })),
    }));

    setters.setVariantMetas(newVariantMetas);
    form.setValue("variantImagesMetadata", newVariantMetas);

    const filesMap = values.variants.map((v: any) =>
      (v.images || []).map((img: any) => img.file).filter(Boolean)
    );
    setters.setVariantFilesMap(filesMap);

    setProductData((prev: any) => ({
      ...prev,
      productVariants: values.variants.map((v: any, idx: number) => ({
        ...v,
        variantName: v.variantName,
        attributeValueIds: v.attributeValueIds,
        images: (v.images || []).map((img: any) => ({
          id: img.id || `temp-${idx}-${Date.now()}-${Math.random()}`,
          url: img.url || (img.file ? URL.createObjectURL(img.file) : ""),
          altText: img.altText || "",
          isFeatured: img.isFeatured || false,
          file: img.file,
        })),
      })),
    }));

    toast.success("Variants configuration saved locally");
  };

  const handleGenerateVariantsLocal = () => {
    const variantGeneratingSelections = currentSelections.filter(
      (sel) => sel.isVariantGenerator !== false
    );
    if (variantGeneratingSelections.length === 0) {
      toast.error("Tambahkan minimal 1 attribute dengan isVariantGenerator = true.");
      return;
    }

    const activeAttributes = currentFullList
      .filter((attr) => variantGeneratingSelections.some((sel) => sel.attributeId === attr.id))
      .map((attr) => ({
        ...attr,
        values: attr.values.filter((val: any) =>
          variantGeneratingSelections
            .find((sel) => sel.attributeId === attr.id)
            ?.valueIds.includes(val.id)
        ),
      }))
      .filter((attr) => attr.values.length > 0);

    if (activeAttributes.length === 0) return;

    const combine = (arr: any[]): any[] => {
      if (arr.length === 0) return [];
      if (arr.length === 1) return arr[0].values.map((v: any) => [v]);

      const [first, ...rest] = arr;
      const subCombinations = combine(rest);

      const combinations: any[] = [];
      for (const val of first.values) {
        for (const sub of subCombinations) {
          combinations.push([val, ...(Array.isArray(sub) ? sub : [sub])]);
        }
      }
      return combinations;
    };

    const rawCombinations = combine(activeAttributes);
    const newCombinations = rawCombinations.map((combination: any[]) => {
      const attributeMap: Record<string, string> = {};
      const nameParts: string[] = [];

      combination.forEach((val) => {
        attributeMap[val.attributeId] = val.id;
        nameParts.push(val.value);
      });

      return {
        attributeMap,
        variantName: nameParts.join(" • "),
      };
    });

    const existingVariants = productData.productVariants || [];
    const newVariantsState: any[] = [];
    const usedExistingVariantIds = new Set();

    const getVariantSignature = (variant: any) => {
      if (variant.attributeValues) {
        return variant.attributeValues
          .map((av: any) => av.attributeValueId)
          .sort()
          .join("|");
      }
      if (variant.attributeValueIds) {
        return [...variant.attributeValueIds].sort().join("|");
      }
      return "";
    };

    for (const newComb of newCombinations) {
      const valueIdsInCombo = Object.values(newComb.attributeMap) as string[];
      const newCombAttributeIds = Object.values(newComb.attributeMap)
        .sort()
        .join("|");

      const existingMatch = existingVariants.find((v: any) => {
        if (v._isDeleted) return false;
        const existingSignature = getVariantSignature(v);
        if (existingSignature && existingSignature !== "") {
          return existingSignature === newCombAttributeIds;
        }
        const normalizeName = (name: string) =>
          name?.toLowerCase().replace(/[\s•·\-\/]/g, "") || "";
        return normalizeName(v.variantName) === normalizeName(newComb.variantName);
      });

      if (existingMatch) {
        newVariantsState.push({
          ...existingMatch,
          _isDeleted: false,
          attributeValueIds: valueIdsInCombo,
        });
        if (existingMatch.id) usedExistingVariantIds.add(existingMatch.id);
      } else {
        let modifierSum = 0;
        currentSelections.forEach((selection: any) => {
          if (selection.isVariantGenerator !== false) {
            selection.valueIds.forEach((valId: string) => {
              if (valueIdsInCombo.includes(valId)) {
                const modVal = selection.priceModifiers?.[valId];
                if (modVal !== undefined) {
                  modifierSum += Number(modVal) || 0;
                }
              }
            });
          }
        });

        newVariantsState.push({
          id: undefined,
          variantName: newComb.variantName,
          sku: "",
          price: Number(productData.basePrice || 0) + modifierSum,
          images: [],
          _isDeleted: false,
          attributeValueIds: valueIdsInCombo,
        });
      }
    }

    const variantsToKeep = existingVariants
      .filter((v: any) => v.id && !usedExistingVariantIds.has(v.id))
      .map((v: any) => ({
        ...v,
        _isDeleted: true,
      }));

    const finalVariantsState = [...variantsToKeep, ...newVariantsState];

    setProductData((prev: any) => ({
      ...prev,
      productVariants: finalVariantsState,
    }));

    toast.info(`Generated ${newCombinations.length} variants.`);
  };

  return (
    <Card className="w-full pt-2">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
            <Tabs defaultValue="identity" className="w-full space-y-6">
              <TabsList className="grid w-full grid-cols-4 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <TabsTrigger value="identity" className="font-semibold text-xs sm:text-sm">1. Informasi Utama</TabsTrigger>
                <TabsTrigger value="media" className="font-semibold text-xs sm:text-sm">2. Media & Visual</TabsTrigger>
                <TabsTrigger value="pricing" className="font-semibold text-xs sm:text-sm">3. Harga & Tiers</TabsTrigger>
                <TabsTrigger value="customization" disabled={!state.isCustomProduct} className="font-semibold text-xs sm:text-sm">4. Kustomisasi & Varian</TabsTrigger>
              </TabsList>

              {/* Tab 1: Informasi Utama */}
              <TabsContent value="identity" forceMount className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight border-b pb-2 mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-200">
                    📝 Informasi Utama
                  </h3>

                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm flex items-start gap-2">
                    <span className="font-semibold text-blue-900 dark:text-blue-200 shrink-0">Catatan:</span>
                    <span>Semua pengaturan di dalam tab ini akan memengaruhi konfigurasi produk utama/dasar (base product configuration).</span>
                  </div>

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
                                onClick={handlers.handleGenerateSku}
                                disabled={state.isGeneratingSku}
                                className="shrink-0">
                                <RefreshCw
                                  className={`h-4 w-4 ${state.isGeneratingSku ? "animate-spin" : ""}`}
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
                            <Select
                              onValueChange={(val) => {
                                if (val === "ADD_NEW_CATEGORY")
                                  return setters.setIsCategoryModalOpen(true);
                                field.onChange(val);
                                form.setValue("itemCategoryId", "");
                                form.setValue("itemNameId", "");
                              }}
                              value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {state.categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name} {cat.code && `(${cat.code})`}
                                  </SelectItem>
                                ))}
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

                      <FormField
                        control={form.control}
                        name="itemCategoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Category</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                if (val === "ADD_NEW_ITEM_CATEGORY")
                                  return setters.setIsItemCategoryModalOpen(true);
                                field.onChange(val);
                                form.setValue("itemNameId", "");
                              }}
                              value={field.value}
                              disabled={!state.selectedCategoryId}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Sub Kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {state.itemCategories.map((ic) => (
                                  <SelectItem key={ic.id} value={ic.id}>
                                    {ic.name}
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

                      <FormField
                        control={form.control}
                        name="itemNameId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={(val) => {
                                if (val === "ADD_NEW_ITEM_NAME")
                                  return setters.setIsItemNameModalOpen(true);
                                field.onChange(val);
                              }}
                              disabled={!state.selectedItemCategoryId}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Nama Item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {state.itemNames.map((inm) => (
                                  <SelectItem key={inm.id} value={inm.id}>
                                    {inm.name}
                                  </SelectItem>
                                ))}
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

                      <FormField
                        control={form.control}
                        name="materialTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                if (val === "ADD_NEW_MATERIAL")
                                  return setters.setIsMaterialModalOpen(true);
                                field.onChange(val);
                              }}
                              value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Material" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {state.materialTypes.map((mat) => (
                                  <SelectItem key={mat.id} value={mat.id}>
                                    {mat.name}
                                  </SelectItem>
                                ))}
                                <div className="h-px bg-stone-200 my-1 mx-1" />
                                <SelectItem
                                  value="ADD_NEW_MATERIAL"
                                  className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                  + Tambah Material Baru
                                </SelectItem>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                                min={0}
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
                              {state.isCustomProduct && (
                                <span className="text-[10px] text-amber-600 font-normal italic">
                                  (Diatur per Varian)
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={
                                  state.isCustomProduct ? "0" : "Masukkan jumlah stok"
                                }
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                                disabled={state.isCustomProduct}
                                min={0}
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
                              <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white dark:bg-stone-950">
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
                              <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white dark:bg-stone-950">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="text-xs text-stone-600 truncate" title="Made by Order / Pre-Order (Bisa dipesan walaupun stok habis)">
                                  Made by Order / PO
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* TAGS */}
                      <FormField
                        control={form.control}
                        name="tagIds"
                        render={({ field }) => {
                          const selectedTags = field.value || [];
                          return (
                            <FormItem className="md:col-span-4">
                              <FormLabel>Product Tags</FormLabel>
                              <Popover
                                open={state.tagSearchOpen}
                                onOpenChange={setters.setTagSearchOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between h-auto min-h-10 text-left bg-white dark:bg-stone-950",
                                        selectedTags.length === 0 &&
                                          "text-muted-foreground",
                                      )}>
                                      <div className="flex flex-wrap gap-1.5 items-center py-1">
                                        {selectedTags.length > 0
                                          ? selectedTags.map((tagId) => {
                                              const tagInfo = state.tags.find(
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
                                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  className="w-[--radix-popover-trigger-width] p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder="Cari tag..."
                                      value={state.tagSearchQuery}
                                      onValueChange={setters.setTagSearchQuery}
                                    />
                                    <CommandList>
                                      <CommandEmpty>Tag tidak ditemukan.</CommandEmpty>
                                      <CommandGroup>
                                        {state.tags.map((tag) => (
                                          <CommandItem
                                            key={tag.id}
                                            onSelect={() => {
                                              field.onChange(
                                                selectedTags.includes(tag.id)
                                                  ? selectedTags.filter(
                                                      (id) => id !== tag.id,
                                                    )
                                                  : [...selectedTags, tag.id],
                                              );
                                              setters.setTagSearchQuery("");
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTags.includes(tag.id)
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {tag.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <div className="h-px bg-stone-200 my-1 mx-1" />
                                      <CommandItem
                                        onSelect={() => {
                                          setters.setIsTagModalOpen(true);
                                          setters.setTagSearchOpen(false);
                                        }}
                                        className="text-blue-600 font-bold justify-center text-xs">
                                        + Tambah Tag Baru Sekaligus
                                      </CommandItem>
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
                </div>
              </TabsContent>

              {/* Tab 2: Media & Visual */}
              <TabsContent value="media" forceMount className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight border-b pb-2 mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-200">
                    📸 Media & Visual
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-stone-100 dark:border-stone-800/80 p-4 rounded-lg shadow-sm">
                      <UploadImages
                        form={form}
                        metadataName="imagesMetadata"
                        name="imageFiles"
                        label="Gambar Utama"
                        max={10}
                        onFilesChange={setters.setProductImagesFiles}
                      />
                    </div>
                    <div className="border border-stone-100 dark:border-stone-800/80 p-4 rounded-lg shadow-sm">
                      <UploadVideos
                        form={form}
                        metadataName="videosMetadata"
                        label="Video Promosi"
                        max={3}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Harga & Tiers */}
              <TabsContent value="pricing" forceMount className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight border-b pb-2 mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-200">
                    💰 Harga Bertingkat (Wholesale)
                  </h3>

                  <div>
                    <PriceTiers />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Kustomisasi & Varian */}
              <TabsContent value="customization" forceMount className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                {state.isCustomProduct && (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                    <FormUpdateAttributes
                      initialData={productData}
                      isSubmitting={isSubmitting}
                      onSubmit={handleUpdateAttributesLocal}
                      onAttributesChange={(selections, fullList) => {
                        setCurrentSelections(selections);
                        setCurrentFullList(fullList);
                        setters.setAttributeSelections(selections);
                      }}
                      onUpdateMediaMockups={handleUpdateMediaMockupsLocal}
                      onUpdateMockupSettings={handleUpdateMockupSettingsLocal}
                      onUpdateMediaMetadata={handleUpdateMediaMetadataLocal}
                    />
                    <FormUpdateVariants
                      initialData={productData}
                      isSubmitting={isSubmitting}
                      onSubmit={handleUpdateVariantsLocal}
                      onGenerateClick={handleGenerateVariantsLocal}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting && (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                )}{" "}
                Create Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* MODALS */}
      <CreateCategoryModal
        isOpen={state.isCategoryModalOpen}
        onClose={() => setters.setIsCategoryModalOpen(false)}
        onSuccess={(newCat) => {
          setters.setCategories((p) => [...p, newCat]);
          form.setValue("categoryId", newCat.id);
          form.setValue("itemCategoryId", "");
          form.setValue("itemNameId", "");
        }}
      />
      <AddItemCategoryModal
        isOpen={state.isItemCategoryModalOpen}
        onClose={() => setters.setIsItemCategoryModalOpen(false)}
        parentCategoryId={state.selectedCategoryId}
        onSuccess={(newCat) => {
          setters.setItemCategories((p) => [...p, newCat]);
          form.setValue("itemCategoryId", newCat.id);
          form.setValue("itemNameId", "");
        }}
      />
      <AddItemNameModal
        isOpen={state.isItemNameModalOpen}
        onClose={() => setters.setIsItemNameModalOpen(false)}
        parentCategoryId={state.selectedCategoryId}
        parentItemCategoryId={state.selectedItemCategoryId}
        productCategories={state.categories}
        itemCategories={state.itemCategories}
        onSuccess={(newName) => {
          setters.setItemNames((p) => [...p, newName]);
          form.setValue("itemNameId", newName.id);
        }}
      />

      <Dialog
        open={state.isTagModalOpen}
        onOpenChange={setters.setIsTagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Tags Baru</DialogTitle>
            <DialogDescription>Pisahkan dengan koma ( , )</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={state.bulkTagInput}
              onChange={(e) => setters.setBulkTagInput(e.target.value)}
              disabled={state.isSubmittingTags}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setters.setIsTagModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handlers.handleBulkCreateTags}
              disabled={state.isSubmittingTags}>
              {state.isSubmittingTags ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={state.isMaterialModalOpen}
        onOpenChange={setters.setIsMaterialModalOpen}>
        <DialogContent className="sm:max-w-140 bg-[oklch(0.98_0.02_90)]">
          <DialogHeader>
            <DialogTitle>Tambah Material Baru</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <MaterialTypeForm
              onSubmit={handlers.handleAddMaterialSubmit}
              isSubmitting={state.isSubmittingMaterial}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
