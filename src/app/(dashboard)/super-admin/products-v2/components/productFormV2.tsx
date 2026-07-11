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
import { Check, ChevronsUpDown, Loader2, RefreshCw, X, Layers, PlusCircle, Trash2, Plus } from "lucide-react";
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
import { ProductMockupModal } from "./ProductMockupModal";
import { MockupAreaSelector } from "./MockupAreaSelector";
import { toast } from "sonner";

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
  const [tempAttributeSelections, setTempAttributeSelections] = useState<any[]>([]);
  const [tempFullAttrs, setTempFullAttrs] = useState<any[]>([]);
  const [globalStock, setGlobalStock] = useState<string>("");

  const [mockupSides, setMockupSides] = useState<any[]>([]);
  const [selectedMockupImage, setSelectedMockupImage] = useState<any | null>(null);
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);
  const [mockupAreasState, setMockupAreasState] = useState<any[]>([]);

  useEffect(() => {
    form.setValue("mockupSides", mockupSides);
  }, [mockupSides]);

  const handleAddMockupSide = () => {
    setMockupSides((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        name: "",
        imageId: "",
        mockupAreas: [],
        attributeValueId: null,
        printPositionValueId: null,
        url: "",
      },
    ]);
  };

  const handleRemoveMockupSide = (id: string) => {
    setMockupSides((prev) => prev.filter((item) => item.id !== id));
  };

  const handleImageSelect = (itemIndex: number, val: string) => {
    if (val === "none") return;
    const fileIdx = parseInt(val.replace("index-", ""));
    const file = state.productImagesFiles[fileIdx];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMockupSides((prev) =>
      prev.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              imageId: val,
              url,
            }
          : item
      )
    );
  };

  const handleOpenMockupModal = (item: any) => {
    setSelectedMockupImage(item);
    setMockupAreasState(item.mockupAreas || []);
    setIsMockupModalOpen(true);
  };

  const handleSaveMockupAreas = () => {
    if (!selectedMockupImage) return;
    setMockupSides((prev) =>
      prev.map((item) =>
        item.imageId === selectedMockupImage.imageId
          ? { ...item, mockupAreas: mockupAreasState }
          : item
      )
    );
    setIsMockupModalOpen(false);
    setSelectedMockupImage(null);
  };

  const getProductAttributeValues = () => {
    const list: { id: string; value: string; attributeName: string; attributeType: string }[] = [];
    
    tempFullAttrs.forEach((attr) => {
      const selection = tempAttributeSelections.find((sel) => sel.attributeId === attr.id);
      if (!selection) return;
      attr.values?.forEach((val: any) => {
        if (selection.valueIds.includes(val.id)) {
          list.push({
            id: val.id,
            value: val.value.includes("|") ? val.value.split("|")[0] : val.value,
            attributeName: attr.name,
            attributeType: attr.type || "TEXT",
          });
        }
      });
    });

    return list;
  };

  useEffect(() => {
    if (state.attributeSelections) {
      setTempAttributeSelections(state.attributeSelections);
    }
  }, [state.attributeSelections]);

  useEffect(() => {
    if (state.attributesList) {
      setTempFullAttrs(state.attributesList);
    }
  }, [state.attributesList]);

  useEffect(() => {
    if (state.productImagesFiles && state.productImagesFiles.length > 0) {
      const url = URL.createObjectURL(state.productImagesFiles[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(undefined);
    }
  }, [state.productImagesFiles]);

  const onInvalid = (errors: any) => {
    const fieldLabels: Record<string, string> = {
      name: "Nama Produk",
      categoryId: "Kategori Produk",
      itemCategoryId: "Item Category",
      itemNameId: "Item Name",
      materialTypeId: "Material Type",
      basePrice: "Harga Dasar",
      description: "Deskripsi",
      sku: "SKU",
      weight: "Berat",
      length: "Panjang",
      width: "Lebar",
      height: "Tinggi",
    };

    const missingFields = Object.keys(errors)
      .map((key) => fieldLabels[key] || key);

    toast.error(`Mohon lengkapi field berikut: ${missingFields.join(", ")}`);
  };

  return (
    <>
      <Card className="w-full pt-2">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit, onInvalid)} className="space-y-6">
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

                                const oldVal = form.getValues("itemNameId");
                                const oldItem = state.itemNames.find((inm) => inm.id === oldVal);
                                const newItem = state.itemNames.find((inm) => inm.id === val);

                                let currentName = form.getValues("name") || "";
                                if (newItem) {
                                  if (oldItem && currentName.startsWith(oldItem.name)) {
                                    currentName = currentName.replace(oldItem.name, newItem.name);
                                  } else if (!currentName.startsWith(newItem.name)) {
                                    currentName = currentName ? `${newItem.name} ${currentName}` : newItem.name;
                                  }
                                  form.setValue("name", currentName);
                                }

                                field.onChange(val);
                              }}>
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
                    
                    {/* Card 1: Product Attributes */}
                    <div className="border rounded p-4 space-y-4 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                      <h3 className="text-lg font-semibold">Product Attributes</h3>
                      
                      <AttributeSelector
                        value={tempAttributeSelections}
                        onChange={(attrs, full) => {
                          setTempAttributeSelections(attrs);
                          setTempFullAttrs(full);
                        }}
                      />

                      <Button
                        type="button"
                        onClick={() => {
                          handlers.handleAddAttributeToForm(tempAttributeSelections, tempFullAttrs);
                          toast.success("Attributes saved successfully.");
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                      >
                        Save Attributes
                      </Button>
                    </div>

                    {/* Card 2: Area Custom & Hubungan Gambar Atribut */}
                    <Card className="border-stone-200 dark:border-stone-800 shadow-sm">
                      <CardHeader className="bg-stone-50/50 dark:bg-stone-900/50 border-b pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100 flex items-center gap-2">
                          <Layers className="h-4.5 w-4.5 text-indigo-500" /> Area Custom & Hubungan Gambar Atribut
                        </CardTitle>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                          Atur area mockup pada gambar dan hubungkan gambar ke nilai atribut spesifik (seperti Kapasitas / Ukuran).
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            Tambahkan posisi mockup dan tautkan ke gambar produk.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddMockupSide}
                            className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span>Tambah Posisi Mockup</span>
                          </Button>
                        </div>

                        <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                          {(() => {
                            const fullAttributeValuesList = getProductAttributeValues();
                            const hasSizeAttributes = fullAttributeValuesList.some(v => v.attributeType === "SIZE");

                            return (
                              <>
                                {hasSizeAttributes && (
                                  <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-lg flex items-start gap-2.5">
                                    <span className="text-amber-500 font-bold text-base mt-0.5">⚠️</span>
                                    <div className="text-xs text-amber-800 dark:text-amber-300">
                                      <p className="font-bold mb-0.5">Aturan Template Mockup Berdasarkan Ukuran / Kapasitas</p>
                                      <p className="leading-relaxed">Produk ini memiliki atribut ukuran/kapasitas. Silakan unggah gambar mockup terpisah untuk masing-masing ukuran di tab Media, lalu tautkan gambar tersebut ke atribut ukurannya di bawah ini. Customizer pembeli akan otomatis memuat gambar mockup dan area cetak yang sesuai dengan ukuran yang dipilih.</p>
                                    </div>
                                  </div>
                                )}

                                {mockupSides.length === 0 ? (
                                  <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                                    <p className="text-sm text-stone-500 italic">Belum ada posisi mockup yang ditambahkan.</p>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddMockupSide} className="mt-3">
                                      <PlusCircle className="h-4 w-4 mr-1" /> Tambah Posisi Mockup
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {mockupSides.map((item, itemIdx) => {
                                      const availableImageIndexes = (state.productImagesFiles || []).map((_, idx) => `index-${idx}`);

                                      return (
                                        <div key={item.id} className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/20 flex flex-col gap-3 relative shadow-xs">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 bg-white dark:bg-stone-850 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-650 rounded-full shadow-sm flex items-center justify-center z-10"
                                            onClick={() => handleRemoveMockupSide(item.id)}
                                            title="Hapus posisi mockup"
                                          >
                                            <X className="h-4 w-4 text-red-500" />
                                          </Button>

                                          {item.url ? (
                                            <div className="relative aspect-video w-full rounded border dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 shrink-0">
                                              <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                                            </div>
                                          ) : (
                                            <div className="relative aspect-video w-full rounded border border-dashed border-stone-300 dark:border-stone-770 overflow-hidden bg-stone-100 dark:bg-stone-950 shrink-0 flex items-center justify-center text-xs text-stone-400 font-medium italic">
                                              Pilih Gambar Terlebih Dahulu
                                            </div>
                                          )}

                                          <div className="flex-1 flex flex-col justify-between gap-2.5">
                                            <div className="space-y-2">
                                              <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                  Pilih Gambar dari Galeri
                                                </label>
                                                <Select
                                                  value={item.imageId || "none"}
                                                  onValueChange={(val) => handleImageSelect(itemIdx, val)}
                                                >
                                                  <SelectTrigger className="w-full h-8 text-xs">
                                                    <SelectValue placeholder="Pilih gambar galeri..." />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="none" disabled className="text-xs">Pilih gambar galeri...</SelectItem>
                                                    {availableImageIndexes.map((val) => {
                                                      const fileIdx = parseInt(val.replace("index-", ""));
                                                      const file = state.productImagesFiles[fileIdx];
                                                      return (
                                                        <SelectItem key={val} value={val} className="text-xs">
                                                          Gambar #{fileIdx + 1} ({file?.name || "unnamed"})
                                                        </SelectItem>
                                                      );
                                                    })}
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                  Nama Posisi / Sisi Mockup
                                                </label>
                                                <Input
                                                  placeholder="contoh: Tampak Depan, Atas Botol"
                                                  value={item.name}
                                                  onChange={(e) => {
                                                    const newName = e.target.value;
                                                    setMockupSides((prev) =>
                                                      prev.map((m, idx) =>
                                                        idx === itemIdx ? { ...m, name: newName } : m
                                                      )
                                                    );
                                                  }}
                                                  className="h-8 text-xs bg-white text-slate-800"
                                                  disabled={!item.imageId}
                                                />
                                              </div>

                                              <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="space-y-1">
                                                  <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Varian / Ukuran
                                                  </label>
                                                  <Select
                                                    value={item.attributeValueId || "none"}
                                                    disabled={!item.imageId}
                                                    onValueChange={(val) => {
                                                      const targetVal = val === "none" ? null : val;
                                                      setMockupSides((prev) =>
                                                        prev.map((m, idx) =>
                                                          idx === itemIdx ? { ...m, attributeValueId: targetVal } : m
                                                        )
                                                      );
                                                    }}
                                                  >
                                                    <SelectTrigger className="w-full h-8 text-[11px]">
                                                      <SelectValue placeholder="Select Variant" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="none" className="text-xs">Select Variant</SelectItem>
                                                      {fullAttributeValuesList.filter(v => v.attributeType === "SIZE").map((val) => (
                                                        <SelectItem key={val.id} value={val.id} className="text-xs">
                                                          {val.value}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Posisi Cetak (Harga)
                                                  </label>
                                                  <Select
                                                    value={item.printPositionValueId || "none"}
                                                    disabled={!item.imageId}
                                                    onValueChange={(val) => {
                                                      const targetVal = val === "none" ? null : val;
                                                      setMockupSides((prev) =>
                                                        prev.map((m, idx) =>
                                                          idx === itemIdx ? { ...m, printPositionValueId: targetVal } : m
                                                        )
                                                      );
                                                    }}
                                                  >
                                                    <SelectTrigger className="w-full h-8 text-[11px]">
                                                      <SelectValue placeholder="Bebas Sisi" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="none" className="text-xs">Bebas Sisi</SelectItem>
                                                      {fullAttributeValuesList.filter(v => v.attributeType === "MOCKUP_SIDE").map((val) => (
                                                        <SelectItem key={val.id} value={val.id} className="text-xs">
                                                          {val.value}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>
                                            </div>

                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleOpenMockupModal(item)}
                                              className="w-full text-xs font-semibold h-8 flex items-center gap-1.5"
                                              disabled={!item.imageId}
                                            >
                                              <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                              Atur Area Mockup
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section 3: Product Variants Configuration */}
                    <div className="space-y-6 border p-6 rounded-xl bg-white shadow-sm border-stone-200 dark:border-stone-800">
                      <h3 className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        📦 Product Variants Configuration
                      </h3>
                      <p className="text-sm text-gray-500">
                        Define basic properties and media for each product combination.
                      </p>
                      <hr />

                      <div className="flex justify-between items-center">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={handlers.handleGenerateVariants}
                          className="space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Generate Variants from Attributes</span>
                        </Button>
                        <Button variant="outline" type="button" onClick={handlers.handleAddCustomVariant}>
                          Add Custom Variant
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-xl bg-stone-50">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-stone-700">Global Stock Adjuster:</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Stock qty"
                            value={globalStock}
                            onChange={(e) => setGlobalStock(e.target.value)}
                            className="w-28 bg-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const stockNum = parseInt(globalStock);
                              if (isNaN(stockNum) || stockNum < 0) {
                                toast.error("Masukkan jumlah stok yang valid");
                                return;
                              }
                              state.combinations.forEach((_, idx) => {
                                handlers.handleUpdateVariantMeta(idx, "stock", stockNum);
                              });
                              toast.success(`Berhasil menerapkan stok ${stockNum} ke semua varian.`);
                            }}
                          >
                            Apply to All
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Apakah Anda yakin ingin menghapus semua varian?")) {
                              handlers.handleClearAllVariants();
                              toast.success("Semua varian berhasil dihapus.");
                            }
                          }}
                          className="space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete All Variants</span>
                        </Button>
                      </div>

                      <hr />

                      <div className="space-y-8">
                        {state.combinations.length > 0 ? (
                          <VariantList
                            combinations={state.combinations}
                            variantMetas={state.variantMetas}
                            onUpdateVariantMeta={handlers.handleUpdateVariantMeta}
                            onChangeMeta={setters.setVariantFilesMap}
                            onRemoveVariant={handlers.handleRemoveVariant}
                            onUpdateVariantLabel={handlers.handleUpdateVariantLabel}
                          />
                        ) : (
                          <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                            <p className="text-sm text-stone-500 italic">Belum ada varian yang dibuat. Klik tombol Generate Variants di atas untuk membuat kombinasi.</p>
                          </div>
                        )}
                      </div>
                    </div>

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

          const oldVal = form.getValues("itemNameId");
          const oldItem = state.itemNames.find((inm) => inm.id === oldVal);

          let currentName = form.getValues("name") || "";
          if (oldItem && currentName.startsWith(oldItem.name)) {
            currentName = currentName.replace(oldItem.name, newName.name);
          } else if (!currentName.startsWith(newName.name)) {
            currentName = currentName ? `${newName.name} ${currentName}` : newName.name;
          }
          form.setValue("name", currentName);

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

      {/* Mockup area selector modal */}
      {isMockupModalOpen && selectedMockupImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  Konfigurasi Area Mockup
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Tentukan satu atau lebih penempatan custom mockup untuk gambar ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30 dark:bg-stone-950/20">
              <MockupAreaSelector
                imageUrl={selectedMockupImage.url}
                areas={mockupAreasState}
                onChange={(newAreas) => setMockupAreasState(newAreas)}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveMockupAreas}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                Simpan Area Mockup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
