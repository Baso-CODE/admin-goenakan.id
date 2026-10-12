"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorValueInput } from "@/components/ui/color-value-input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductFormV2 } from "@/hooks/useProductFormV2";
import { cn } from "@/lib/utils";
import { parseColorValue } from "@/utils/colorConverter";
import {
  Check,
  CheckCheck,
  ChevronsUpDown,
  Info,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { AddItemCategoryModal } from "../../item-categories-product/components/addItemCategoryModal";
import { AddItemNameModal } from "../../item-names-product/components/addItemNameModal";
import CreateCategoryModal from "../../product-categories/components/createCategoryModal";
import MaterialTypeForm from "../../product-materials/components/materialTypeForm";
import { AddTagModal } from "../../product-tags/components/addTagModal";
import { AttributeSelector, ModelShapeValueInput } from "./AttributeSelector";
import { MockupAreaSelector } from "./MockupAreaSelector";
import { PriceTiers } from "./PriceTiers";
import { ProductFormValues } from "./product.schema";
import { TagCategoryManagerModal } from "./TagCategoryManagerModal";
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";

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

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemCategoryOpen, setItemCategoryOpen] = useState(false);
  const [itemNameOpen, setItemNameOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [mockupImageOpen, setMockupImageOpen] = useState<
    Record<string, boolean>
  >({});
  const [mockupAttrOpen, setMockupAttrOpen] = useState<Record<string, boolean>>(
    {},
  );
  const [mockupPrintOpen, setMockupPrintOpen] = useState<
    Record<string, boolean>
  >({});

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [tagGroupSearchOpen, setTagGroupSearchOpen] = useState(false);
  const [tagGroupSearchQuery, setTagGroupSearchQuery] = useState("");
  const [isTagCategoryModalOpen, setIsTagCategoryModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [tempAttributeSelections, setTempAttributeSelections] = useState<any[]>(
    [],
  );
  const [tempFullAttrs, setTempFullAttrs] = useState<any[]>([]);
  const [globalStock, setGlobalStock] = useState<string>("");
  const [inlineInputAttrId, setInlineInputAttrId] = useState<string | null>(
    null,
  );
  const [inlineInputGroupId, setInlineInputGroupId] = useState<string | null>(
    null,
  );
  const [inlineInputValue, setInlineInputValue] = useState<string>("");
  const [inlineInputPrice, setInlineInputPrice] = useState<string>("");

  const [mockupSides, setMockupSides] = useState<any[]>([]);

  // Prevent accidental data loss when refreshing or navigating away
  const isFormFilled = useMemo(() => {
    if (isSubmitting) return false;

    // A. Native react-hook-form dirty state
    if (form.formState.isDirty) return true;

    // B. Check key form fields
    const values = form.getValues();
    if (values.name && values.name.trim() !== "") return true;
    if (values.sku && values.sku.trim() !== "") return true;
    if (values.categoryId && values.categoryId !== "") return true;
    if (values.itemCategoryId && values.itemCategoryId !== "") return true;
    if (values.itemNameId && values.itemNameId !== "") return true;
    if (
      values.description &&
      values.description.trim() !== "" &&
      values.description !== "<p></p>"
    )
      return true;
    if (values.basePrice && Number(values.basePrice) > 0) return true;
    if (values.stock && Number(values.stock) > 0) return true;
    if (values.weight && Number(values.weight) > 0) return true;
    if (values.width && Number(values.width) > 0) return true;
    if (values.height && Number(values.height) > 0) return true;
    if (values.length && Number(values.length) > 0) return true;
    if (values.materialTypeId && values.materialTypeId !== "") return true;
    if (values.tagIds && values.tagIds.length > 0) return true;
    if (values.priceTiers && values.priceTiers.length > 0) return true;
    if (values.attributes && values.attributes.length > 0) return true;

    // C. Uploaded files or variants in state
    if (state.productImagesFiles && state.productImagesFiles.length > 0)
      return true;
    if (state.variantMetas && state.variantMetas.length > 0)
      return true;

    // D. Mockup sides or variant combinations
    if (mockupSides && mockupSides.length > 0) return true;
    if (state.attributeSelections && state.attributeSelections.length > 0)
      return true;
    if (state.combinations && state.combinations.length > 0) return true;

    return false;
  }, [
    isSubmitting,
    form.formState.isDirty,
    form.watch("name"),
    form.watch("sku"),
    form.watch("categoryId"),
    form.watch("itemCategoryId"),
    form.watch("itemNameId"),
    form.watch("description"),
    form.watch("basePrice"),
    form.watch("stock"),
    form.watch("weight"),
    form.watch("width"),
    form.watch("height"),
    form.watch("length"),
    form.watch("materialTypeId"),
    form.watch("tagIds"),
    form.watch("priceTiers"),
    form.watch("attributes"),
    state.productImagesFiles,
    state.variantMetas,
    mockupSides,
    state.attributeSelections,
    state.combinations,
  ]);

  useUnsavedChangesWarning({
    isDirty: isFormFilled,
    isSubmitting,
    message:
      "Data produk yang sudah diisi belum disimpan. Apakah Anda yakin ingin memuat ulang halaman ini?",
  });
  const handleAddMockupSide = () => {
    setMockupSides((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
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
    setMockupSides((prev) => prev.filter((m) => m.id !== id));
  };

  const [selectedMockupImage, setSelectedMockupImage] = useState<any | null>(
    null,
  );
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);
  const [mockupAreasState, setMockupAreasState] = useState<any[]>([]);
  const [copiedMockupAreas, setCopiedMockupAreas] = useState<any[] | null>(
    null,
  );

  const handleCopyMockupConfig = (areas: any[]) => {
    setCopiedMockupAreas(areas);
    toast.success("Konfigurasi area mockup berhasil disalin!");
  };

  const handlePasteMockupConfig = (targetId: string) => {
    if (!copiedMockupAreas) return;
    const pastedAreas = copiedMockupAreas.map((area) => ({
      ...area,
      id: `area-${Date.now()}-${Math.random()}`,
    }));
    setMockupSides((prev) =>
      prev.map((item) =>
        item.id === targetId ? { ...item, mockupAreas: pastedAreas } : item,
      ),
    );
    toast.success("Konfigurasi area mockup berhasil ditempel!");
  };

  useEffect(() => {
    form.setValue("mockupSides", mockupSides);
  }, [mockupSides]);

  const handleClearSlot = (id: string) => {
    setMockupSides((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              imageId: "",
              url: "",
              mockupAreas: [],
            }
          : m,
      ),
    );
  };

  const handleImageSelect = (id: string, val: string) => {
    if (val === "none") return;
    const fileIdx = parseInt(val.replace("index-", ""));
    const file = state.productImagesFiles[fileIdx];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMockupSides((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              imageId: val,
              url,
            }
          : item,
      ),
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
        item.id === selectedMockupImage.id
          ? { ...item, mockupAreas: mockupAreasState }
          : item,
      ),
    );
    setIsMockupModalOpen(false);
    setSelectedMockupImage(null);
  };

  const getProductAttributeValues = () => {
    const list: {
      id: string;
      value: string;
      rawValue: string;
      attributeName: string;
      attributeType: string;
    }[] = [];

    tempFullAttrs.forEach((attr) => {
      const selection = tempAttributeSelections.find(
        (sel) => sel.attributeId === attr.id,
      );
      if (!selection) return;
      attr.values?.forEach((val: any) => {
        if (selection.valueIds.includes(val.id)) {
          list.push({
            id: val.id,
            value: val.value.includes("|")
              ? val.value.split("|")[0]
              : val.value,
            rawValue: val.value,
            attributeName: attr.name,
            attributeType: attr.type || "TEXT",
          });
        }
      });
    });

    return list;
  };

  const [hasInitializedAttrs, setHasInitializedAttrs] = useState(false);

  useEffect(() => {
    if (
      state.attributeSelections &&
      state.attributeSelections.length > 0 &&
      !hasInitializedAttrs
    ) {
      setTempAttributeSelections(state.attributeSelections);
      setHasInitializedAttrs(true);
    }
  }, [state.attributeSelections, hasInitializedAttrs]);

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

    const missingFields = Object.keys(errors).map(
      (key) => fieldLabels[key] || key,
    );

    toast.error(`Mohon lengkapi field berikut: ${missingFields.join(", ")}`);
  };

  return (
    <>
      <Card className="w-full pt-2">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submit, onInvalid)}
              className="space-y-6">
              <Tabs defaultValue="identity" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-4 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                  <TabsTrigger
                    value="identity"
                    className="font-semibold text-xs sm:text-sm">
                    1. Informasi Utama
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="font-semibold text-xs sm:text-sm">
                    2. Media & Visual
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="font-semibold text-xs sm:text-sm">
                    3. Harga & Tiers
                  </TabsTrigger>
                  <TabsTrigger
                    value="customization"
                    disabled={!state.isCustomProduct}
                    className="font-semibold text-xs sm:text-sm">
                    4. Kustomisasi & Varian
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Informasi Utama */}
                <TabsContent
                  value="identity"
                  forceMount
                  className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 bg-white dark:bg-stone-900 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold tracking-tight border-b pb-2 mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-200">
                      📝 Informasi Utama
                    </h3>

                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm flex items-start gap-2">
                      <span className="font-semibold text-blue-900 dark:text-blue-200 shrink-0">
                        Catatan:
                      </span>
                      <span>
                        Semua pengaturan di dalam tab ini akan memengaruhi
                        konfigurasi produk utama/dasar (base product
                        configuration).
                      </span>
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
                                <Input
                                  placeholder="Contoh: Meja Kayu Jati"
                                  {...field}
                                />
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
                                  <Input
                                    placeholder="Auto / Manual"
                                    {...field}
                                  />
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
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel className="mb-2">
                                Kategori Utama
                              </FormLabel>
                              <Popover
                                open={categoryOpen}
                                onOpenChange={setCategoryOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                                      {field.value
                                        ? state.categories.find(
                                            (c) => c.id === field.value,
                                          )?.name || "Pilih Kategori"
                                        : "Pilih Kategori"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-stone-200 shadow-md">
                                  <Command>
                                    <CommandInput placeholder="Cari kategori..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Kategori tidak ditemukan.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {state.categories.map((cat) => (
                                          <CommandItem
                                            key={cat.id}
                                            value={cat.name}
                                            onSelect={() => {
                                              field.onChange(cat.id);
                                              form.setValue(
                                                "itemCategoryId",
                                                "",
                                              );
                                              form.setValue("itemNameId", "");
                                              setCategoryOpen(false);
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === cat.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {cat.name}{" "}
                                            {cat.code && `(${cat.code})`}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <div className="h-px bg-stone-100 my-1" />
                                      <CommandGroup>
                                        <CommandItem
                                          value="ADD_NEW_PRODUCT_TAG"
                                          onSelect={() => {
                                            setters.setTagSearchOpen(false);
                                            setIsAddTagModalOpen(true);
                                          }}
                                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                          + Tambah Tag Baru
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="itemCategoryId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel className="mb-2">
                                Item Category
                              </FormLabel>
                              <Popover
                                open={itemCategoryOpen}
                                onOpenChange={setItemCategoryOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      disabled={!state.selectedCategoryId}
                                      className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                                      {field.value
                                        ? state.itemCategories.find(
                                            (ic) => ic.id === field.value,
                                          )?.name || "Pilih Sub Kategori"
                                        : "Pilih Sub Kategori"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-stone-200 shadow-md">
                                  <Command>
                                    <CommandInput placeholder="Cari sub kategori..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Sub kategori tidak ditemukan.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {state.itemCategories.map((ic) => (
                                          <CommandItem
                                            key={ic.id}
                                            value={ic.name}
                                            onSelect={() => {
                                              field.onChange(ic.id);
                                              form.setValue("itemNameId", "");
                                              setItemCategoryOpen(false);
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === ic.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {ic.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <div className="h-px bg-stone-100 my-1" />
                                      <CommandGroup>
                                        <CommandItem
                                          value="ADD_NEW_ITEM_CATEGORY"
                                          onSelect={() => {
                                            setItemCategoryOpen(false);
                                            setters.setIsItemCategoryModalOpen(
                                              true,
                                            );
                                          }}
                                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                          + Tambah Item Category Baru
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="itemNameId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel className="mb-2">Item Name</FormLabel>
                              <Popover
                                open={itemNameOpen}
                                onOpenChange={setItemNameOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                                      {field.value
                                        ? state.itemNames.find(
                                            (inm) => inm.id === field.value,
                                          )?.name || "Pilih Nama Item"
                                        : "Pilih Nama Item"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-stone-200 shadow-md">
                                  <Command>
                                    <CommandInput placeholder="Cari nama item..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Nama item tidak ditemukan.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {state.itemNames.map((inm) => (
                                          <CommandItem
                                            key={inm.id}
                                            value={inm.name}
                                            onSelect={() => {
                                              const val = inm.id;
                                              const oldVal =
                                                form.getValues("itemNameId");
                                              const oldItem =
                                                state.itemNames.find(
                                                  (i) => i.id === oldVal,
                                                );
                                              let currentName =
                                                form.getValues("name") || "";

                                              if (
                                                oldItem &&
                                                currentName.startsWith(
                                                  oldItem.name,
                                                )
                                              ) {
                                                currentName =
                                                  currentName.replace(
                                                    oldItem.name,
                                                    inm.name,
                                                  );
                                              } else if (
                                                !currentName.startsWith(
                                                  inm.name,
                                                )
                                              ) {
                                                currentName = currentName
                                                  ? `${inm.name} ${currentName}`
                                                  : inm.name;
                                              }
                                              form.setValue(
                                                "name",
                                                currentName,
                                              );

                                              field.onChange(val);
                                              setItemNameOpen(false);
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === inm.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {inm.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <div className="h-px bg-stone-100 my-1" />
                                      <CommandGroup>
                                        <CommandItem
                                          value="ADD_NEW_ITEM_NAME"
                                          onSelect={() => {
                                            setItemNameOpen(false);
                                            setters.setIsItemNameModalOpen(
                                              true,
                                            );
                                          }}
                                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                          + Tambah Item Name Baru
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="materialTypeId"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel className="mb-2">Material</FormLabel>
                              <Popover
                                open={materialOpen}
                                onOpenChange={setMaterialOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                                      {field.value
                                        ? state.materialTypes.find(
                                            (mat) => mat.id === field.value,
                                          )?.name || "Pilih Material"
                                        : "Pilih Material"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-stone-200 shadow-md">
                                  <Command>
                                    <CommandInput placeholder="Cari material..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Material tidak ditemukan.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {state.materialTypes.map((mat) => (
                                          <CommandItem
                                            key={mat.id}
                                            value={mat.name}
                                            onSelect={() => {
                                              field.onChange(mat.id);
                                              setMaterialOpen(false);
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === mat.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {mat.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                      <div className="h-px bg-stone-100 my-1" />
                                      <CommandGroup>
                                        <CommandItem
                                          value="ADD_NEW_MATERIAL"
                                          onSelect={() => {
                                            setMaterialOpen(false);
                                            setters.setIsMaterialModalOpen(
                                              true,
                                            );
                                          }}
                                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                          + Tambah Material Baru
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                                    field.onChange(
                                      parseFloat(e.target.value) || 0,
                                    )
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
                                    state.isCustomProduct
                                      ? "0"
                                      : "Masukkan jumlah stok"
                                  }
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0,
                                    )
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
                              <FormLabel>
                                Sistem Order saat Stok Habis
                              </FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white dark:bg-stone-950">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <span
                                    className="text-xs text-stone-600 truncate"
                                    title="Made by Order / Pre-Order (Bisa dipesan walaupun stok habis)">
                                    Made by Order / PO
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isSample"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Produk Sampel?</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white dark:bg-stone-950">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <span
                                    className="text-xs text-stone-600 truncate"
                                    title="Tandai produk ini sebagai sampel yang dapat dipinjamkan">
                                    Ya, ini Sampel
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status Tampilkan</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white dark:bg-stone-950">
                                  <Switch
                                    checked={field.value !== false}
                                    onCheckedChange={field.onChange}
                                  />
                                  <span className="text-xs text-stone-600 truncate">
                                    {field.value !== false
                                      ? "Active (Tampil)"
                                      : "Inactive (Sembunyi)"}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="colorMockupTrigger"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trigger Custom Color</FormLabel>
                              <Select
                                value={field.value || "NONE"}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Pilih Trigger..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NONE">
                                    Tidak Aktif (Polosan/Statis)
                                  </SelectItem>
                                  <SelectItem value="SIZE">
                                    Berdasarkan Ukuran / Kapasitas
                                  </SelectItem>
                                  <SelectItem value="SHAPE">
                                    Berdasarkan Model / Bentuk
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {field.value && field.value !== "NONE" && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1">
                                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <span>
                                    Mask warna akan diambil dari opsi atribut{" "}
                                    <strong>
                                      {field.value === "SIZE"
                                        ? "Ukuran / Kapasitas"
                                        : "Model / Bentuk"}
                                    </strong>
                                    . Pastikan mask yang diunggah berupa{" "}
                                    <strong>PNG transparent outline</strong>.
                                  </span>
                                </p>
                              )}
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
                              <FormItem className="md:col-span-4 space-y-4">
                                {/* 1. Tag Groups Combobox */}
                                {Array.isArray(state.tagCategories) &&
                                  state.tagCategories.length > 0 && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <FormLabel className="text-xs font-semibold text-stone-700">
                                          Tag Group (Kelompok Tag)
                                        </FormLabel>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setIsTagCategoryModalOpen(true)
                                          }
                                          className="text-xs h-6.5 border-dashed border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2 flex items-center gap-1 font-medium">
                                          <Plus className="h-3 w-3" />
                                          <span>Kelola Group</span>
                                        </Button>
                                      </div>

                                      {(() => {
                                        const appliedGroups = (
                                          Array.isArray(state.tagCategories)
                                            ? state.tagCategories
                                            : []
                                        )
                                          .map((cat) => {
                                            const catTags = cat.tags || [];
                                            const catTagIds = catTags.map(
                                              (t: any) => t.id,
                                            );
                                            if (catTagIds.length === 0)
                                              return null;

                                            const selectedCatTags =
                                              catTagIds.filter((id: string) =>
                                                selectedTags.includes(id),
                                              );
                                            if (selectedCatTags.length === 0)
                                              return null;

                                            return {
                                              id: cat.id,
                                              name: cat.name,
                                              tagIds: catTagIds,
                                              selectedCount:
                                                selectedCatTags.length,
                                              totalCount: catTagIds.length,
                                              isAllSelected:
                                                selectedCatTags.length ===
                                                catTagIds.length,
                                            };
                                          })
                                          .filter(Boolean) as {
                                          id: string;
                                          name: string;
                                          tagIds: string[];
                                          selectedCount: number;
                                          totalCount: number;
                                          isAllSelected: boolean;
                                        }[];

                                        return (
                                          <Popover
                                            open={tagGroupSearchOpen}
                                            onOpenChange={
                                              setTagGroupSearchOpen
                                            }>
                                            <PopoverTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                  "w-full justify-between h-auto min-h-10 text-left bg-white dark:bg-stone-950",
                                                  appliedGroups.length === 0 &&
                                                    "text-muted-foreground",
                                                )}>
                                                <div className="flex flex-wrap gap-1.5 items-center py-1">
                                                  {appliedGroups.length > 0 ? (
                                                    appliedGroups.map((cat) => (
                                                      <Badge
                                                        key={cat.id}
                                                        variant="secondary"
                                                        className={cn(
                                                          "flex items-center gap-1 px-2 py-0.5 text-xs font-medium",
                                                          cat.isAllSelected
                                                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                                            : "bg-indigo-50 text-indigo-600 border border-dashed border-indigo-300",
                                                        )}>
                                                        <span>
                                                          {cat.name}
                                                          {!cat.isAllSelected &&
                                                            ` (${cat.selectedCount}/${cat.totalCount})`}
                                                        </span>
                                                        <X
                                                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            field.onChange(
                                                              selectedTags.filter(
                                                                (
                                                                  id: string,
                                                                ) =>
                                                                  !cat.tagIds.includes(
                                                                    id,
                                                                  ),
                                                              ),
                                                            );
                                                          }}
                                                        />
                                                      </Badge>
                                                    ))
                                                  ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                      Pilih tag group...
                                                    </span>
                                                  )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-[--radix-popover-trigger-width] p-0"
                                              align="start">
                                              <Command>
                                                <CommandInput
                                                  placeholder="Cari tag group..."
                                                  value={tagGroupSearchQuery}
                                                  onValueChange={
                                                    setTagGroupSearchQuery
                                                  }
                                                />
                                                <CommandList>
                                                  <CommandEmpty>
                                                    Tag group tidak ditemukan.
                                                  </CommandEmpty>
                                                  <CommandGroup>
                                                    {state.tagCategories.map(
                                                      (cat) => {
                                                        const catTags =
                                                          cat.tags || [];
                                                        const catTagIds =
                                                          catTags.map(
                                                            (t: any) => t.id,
                                                          );
                                                        if (
                                                          catTagIds.length === 0
                                                        )
                                                          return null;

                                                        const selectedCatTags =
                                                          catTagIds.filter(
                                                            (id: string) =>
                                                              selectedTags.includes(
                                                                id,
                                                              ),
                                                          );
                                                        const isAllSelected =
                                                          selectedCatTags.length ===
                                                          catTagIds.length;
                                                        const isPartSelected =
                                                          selectedCatTags.length >
                                                            0 && !isAllSelected;

                                                        return (
                                                          <CommandItem
                                                            key={cat.id}
                                                            value={`${cat.name} ${catTags.map((t: any) => t.name).join(" ")}`}
                                                            onSelect={() => {
                                                              if (
                                                                isAllSelected
                                                              ) {
                                                                field.onChange(
                                                                  selectedTags.filter(
                                                                    (
                                                                      id: string,
                                                                    ) =>
                                                                      !catTagIds.includes(
                                                                        id,
                                                                      ),
                                                                  ),
                                                                );
                                                              } else {
                                                                field.onChange(
                                                                  Array.from(
                                                                    new Set([
                                                                      ...selectedTags,
                                                                      ...catTagIds,
                                                                    ]),
                                                                  ),
                                                                );
                                                              }
                                                            }}
                                                            className="flex items-center justify-between cursor-pointer py-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                              <CheckCheck
                                                                className={cn(
                                                                  "h-4 w-4 shrink-0 transition-opacity",
                                                                  isAllSelected
                                                                    ? "opacity-100 text-indigo-600"
                                                                    : isPartSelected
                                                                      ? "opacity-50 text-indigo-400"
                                                                      : "opacity-0",
                                                                )}
                                                              />
                                                              <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-semibold text-stone-800 truncate">
                                                                  {cat.name}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 truncate max-w-[280px]">
                                                                  {catTags
                                                                    .map(
                                                                      (
                                                                        t: any,
                                                                      ) =>
                                                                        t.name,
                                                                    )
                                                                    .join(", ")}
                                                                </span>
                                                              </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                                                              {
                                                                selectedCatTags.length
                                                              }
                                                              /
                                                              {
                                                                catTagIds.length
                                                              }{" "}
                                                              tag
                                                            </span>
                                                          </CommandItem>
                                                        );
                                                      },
                                                    )}
                                                  </CommandGroup>
                                                  <div className="h-px bg-stone-100 my-1" />
                                                  <CommandGroup>
                                                    <CommandItem
                                                      value="MANAGE_TAG_GROUPS_ACTION"
                                                      onSelect={() => {
                                                        setTagGroupSearchOpen(
                                                          false,
                                                        );
                                                        setIsTagCategoryModalOpen(
                                                          true,
                                                        );
                                                      }}
                                                      className="text-indigo-600 font-bold focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer text-xs">
                                                      + Kelola Kategori Tag
                                                    </CommandItem>
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>
                                        );
                                      })()}
                                    </div>
                                  )}

                                {/* 2. Individual Product Tags Combobox */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <FormLabel>
                                      Product Tags ({selectedTags.length}{" "}
                                      terpilih)
                                    </FormLabel>
                                    {!(
                                      Array.isArray(state.tagCategories) &&
                                      state.tagCategories.length > 0
                                    ) && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setIsTagCategoryModalOpen(true)
                                        }
                                        className="text-xs h-7 border-dashed border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2 flex items-center gap-1 font-medium">
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Kelola Group</span>
                                      </Button>
                                    )}
                                  </div>

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
                                                            (id) =>
                                                              id !== tagId,
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
                                        onValueChange={
                                          setters.setTagSearchQuery
                                        }
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          Tag tidak ditemukan.
                                        </CommandEmpty>
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
                              </div>
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
                                  {dim === "weight"
                                    ? "Berat (gr)"
                                    : dim + " (cm)"}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="any"
                                    min={0}
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseFloat(e.target.value) || 0,
                                      )
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
                            <FormItem className="col-span-2 md:col-span-4 z-10">
                              <FormLabel>Deskripsi Produk</FormLabel>
                              <FormControl>
                                <SimpleEditor
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  minHeight="250px"
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
                <TabsContent
                  value="media"
                  forceMount
                  className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
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
                <TabsContent
                  value="pricing"
                  forceMount
                  className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
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
                <TabsContent
                  value="customization"
                  forceMount
                  className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
                  {state.isCustomProduct && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                      {/* Card 1: Product Attributes */}
                      <div className="border rounded p-4 space-y-4 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                        <h3 className="text-lg font-semibold">
                          Product Attributes
                        </h3>

                        <AttributeSelector
                          value={tempAttributeSelections}
                          onChange={(attrs, full) => {
                            setTempAttributeSelections(attrs);
                            setTempFullAttrs(full);
                          }}
                          onAttributeCreated={(attrId) => {
                            setters.setCreatedAttributeIds((prev) => [
                              ...prev,
                              attrId,
                            ]);
                          }}
                        />

                        <Button
                          type="button"
                          onClick={() => {
                            handlers.handleAddAttributeToForm(
                              tempAttributeSelections,
                              tempFullAttrs,
                            );
                            toast.success("Attributes saved successfully.");
                          }}
                          className="bg-stone-900 hover:bg-stone-800 text-white font-semibold">
                          Save Attributes
                        </Button>
                      </div>

                      {/* Card 2: Area Custom & Hubungan Gambar Atribut */}
                      <Card className="border-stone-200 dark:border-stone-800 shadow-sm">
                        <CardHeader className="bg-stone-50/50 dark:bg-stone-900/50 border-b pb-4">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100 flex items-center gap-2">
                            <Layers className="h-4.5 w-4.5 text-indigo-500" />{" "}
                            Area Custom & Hubungan Gambar Atribut
                          </CardTitle>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                            Atur area mockup pada gambar dan hubungkan gambar ke
                            nilai atribut spesifik (seperti Kapasitas / Ukuran).
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              Unggah gambar mockup dan atur area cetak untuk
                              masing-masing slot sisi print di bawah ini.
                            </p>
                          </div>

                          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                            {(() => {
                              const fullAttributeValuesList =
                                getProductAttributeValues();
                              const hasSizeAttributes =
                                fullAttributeValuesList.some(
                                  (v) => v.attributeType === "SIZE",
                                );

                              return (
                                <>
                                  {hasSizeAttributes && (
                                    <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-lg flex items-start gap-2.5">
                                      <span className="text-amber-500 font-bold text-base mt-0.5">
                                        ⚠️
                                      </span>
                                      <div className="text-xs text-amber-800 dark:text-amber-300">
                                        <p className="font-bold mb-0.5">
                                          Aturan Template Mockup Berdasarkan
                                          Ukuran / Kapasitas
                                        </p>
                                        <p className="leading-relaxed">
                                          Produk ini memiliki atribut
                                          ukuran/kapasitas. Silakan unggah
                                          gambar mockup terpisah untuk
                                          masing-masing ukuran di tab Media,
                                          lalu tautkan gambar tersebut ke slot
                                          ukurannya di bawah ini.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {mockupSides.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                                      <p className="text-sm text-stone-500 italic">
                                        Belum ada mockup yang ditambahkan.
                                        Silakan klik tombol di bawah untuk
                                        menambah mockup.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                      {mockupSides.map((item) => {
                                        const availableImageIndexes = (
                                          state.productImagesFiles || []
                                        ).map((_, idx) => `index-${idx}`);

                                        return (
                                          <div
                                            key={item.id}
                                            className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-white dark:bg-stone-900/60 flex flex-col gap-3 relative shadow-xs">
                                            <div className="pr-12">
                                              <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 truncate mb-0.5">
                                                {(() => {
                                                  const sizeOpt =
                                                    fullAttributeValuesList.find(
                                                      (o) =>
                                                        o.id ===
                                                        item.attributeValueId,
                                                    );
                                                  const sizeName = sizeOpt
                                                    ? sizeOpt.value
                                                    : "";
                                                  const printPositionName =
                                                    item.name ||
                                                    "Posisi Mockup Baru";
                                                  return sizeName
                                                    ? `${sizeName} - ${printPositionName}`
                                                    : printPositionName;
                                                })()}
                                              </h4>
                                            </div>

                                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                              {item.imageId && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 bg-white dark:bg-stone-850 hover:bg-stone-50 border border-stone-200 dark:border-stone-700 text-stone-500 rounded-full shadow-sm flex items-center justify-center"
                                                  onClick={() =>
                                                    handleClearSlot(item.id)
                                                  }
                                                  title="Kosongkan gambar">
                                                  <X className="h-3.5 w-3.5 text-stone-500" />
                                                </Button>
                                              )}
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 bg-white dark:bg-stone-850 hover:bg-red-50 hover:text-red-600 border border-stone-200 dark:border-stone-700 text-stone-500 rounded-full shadow-sm flex items-center justify-center"
                                                onClick={() =>
                                                  handleRemoveMockupSide(
                                                    item.id,
                                                  )
                                                }
                                                title="Hapus mockup">
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>

                                            {item.url ? (
                                              <div className="relative aspect-video w-full rounded border dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 shrink-0">
                                                <img
                                                  src={item.url}
                                                  alt="thumbnail"
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            ) : (
                                              <div className="relative aspect-video w-full rounded border border-dashed border-stone-300 dark:border-stone-770 overflow-hidden bg-stone-100 dark:bg-stone-950 shrink-0 flex items-center justify-center text-xs text-stone-400 font-medium italic text-center p-2">
                                                Silakan Unggah atau Pilih Gambar
                                              </div>
                                            )}

                                            <div className="flex-1 flex flex-col justify-between gap-2.5">
                                              <div className="space-y-2">
                                                <div className="space-y-1">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Pilih Gambar
                                                  </label>
                                                  <div className="flex gap-1.5 items-center">
                                                    <div className="flex-1">
                                                      <Select
                                                        value={
                                                          item.imageId || "none"
                                                        }
                                                        onValueChange={(val) =>
                                                          handleImageSelect(
                                                            item.id,
                                                            val,
                                                          )
                                                        }>
                                                        <SelectTrigger className="w-full h-8 text-xs">
                                                          <SelectValue placeholder="Pilih gambar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          <SelectItem
                                                            value="none"
                                                            disabled
                                                            className="text-xs">
                                                            Pilih gambar...
                                                          </SelectItem>
                                                          {availableImageIndexes.map(
                                                            (val) => {
                                                              const fileIdx =
                                                                parseInt(
                                                                  val.replace(
                                                                    "index-",
                                                                    "",
                                                                  ),
                                                                );
                                                              const file =
                                                                state
                                                                  .productImagesFiles[
                                                                  fileIdx
                                                                ];
                                                              return (
                                                                <SelectItem
                                                                  key={val}
                                                                  value={val}
                                                                  className="text-xs">
                                                                  Gambar #
                                                                  {fileIdx + 1}{" "}
                                                                  (
                                                                  {file?.name ||
                                                                    "unnamed"}
                                                                  )
                                                                </SelectItem>
                                                              );
                                                            },
                                                          )}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>

                                                    <label className="shrink-0">
                                                      <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                          const file =
                                                            e.target.files?.[0];
                                                          if (file) {
                                                            const newFiles = [
                                                              ...(state.productImagesFiles ||
                                                                []),
                                                              file,
                                                            ];
                                                            setters.setProductImagesFiles(
                                                              newFiles,
                                                            );

                                                            const newIndex =
                                                              newFiles.length -
                                                              1;
                                                            const imageId = `index-${newIndex}`;
                                                            const url =
                                                              URL.createObjectURL(
                                                                file,
                                                              );
                                                            setMockupSides(
                                                              (prev) =>
                                                                prev.map((m) =>
                                                                  m.id ===
                                                                  item.id
                                                                    ? {
                                                                        ...m,
                                                                        imageId,
                                                                        url,
                                                                      }
                                                                    : m,
                                                                ),
                                                            );
                                                          }
                                                        }}
                                                      />
                                                      <span className="flex items-center justify-center h-8 px-2.5 border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 rounded text-xs font-semibold cursor-pointer text-stone-700 dark:text-stone-300">
                                                        Browse
                                                      </span>
                                                    </label>
                                                  </div>
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Nama Posisi / Sisi Mockup
                                                  </label>
                                                  <Input
                                                    placeholder="contoh: Tampak Depan, Atas Botol"
                                                    value={item.name}
                                                    onChange={(e) => {
                                                      const newName =
                                                        e.target.value;
                                                      setMockupSides((prev) =>
                                                        prev.map((m) =>
                                                          m.id === item.id
                                                            ? {
                                                                ...m,
                                                                name: newName,
                                                              }
                                                            : m,
                                                        ),
                                                      );
                                                    }}
                                                    className="h-8 text-xs bg-white text-slate-800"
                                                    disabled={!item.imageId}
                                                  />
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Hubungkan Ukuran / Model
                                                  </label>
                                                  <Select
                                                    value={
                                                      item.attributeValueId ||
                                                      "none"
                                                    }
                                                    onValueChange={(val) => {
                                                      const targetVal =
                                                        val === "none"
                                                          ? null
                                                          : val;
                                                      setMockupSides((prev) =>
                                                        prev.map((m) => {
                                                          if (
                                                            m.id === item.id
                                                          ) {
                                                            return {
                                                              ...m,
                                                              attributeValueId:
                                                                targetVal,
                                                            };
                                                          }
                                                          return m;
                                                        }),
                                                      );
                                                    }}>
                                                    <SelectTrigger className="w-full h-8 text-xs">
                                                      <SelectValue placeholder="Semua Ukuran / Model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem
                                                        value="none"
                                                        className="text-xs">
                                                        Semua Ukuran / Model
                                                      </SelectItem>
                                                      {fullAttributeValuesList
                                                        .filter(
                                                          (v) =>
                                                            v.attributeType ===
                                                              "SIZE" ||
                                                            v.attributeType ===
                                                              "MODEL_SHAPE",
                                                        )
                                                        .map((val) => (
                                                          <SelectItem
                                                            key={val.id}
                                                            value={val.id}
                                                            className="text-xs">
                                                            {val.attributeName}:{" "}
                                                            {val.value}
                                                          </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                    Posisi Cetak (Harga
                                                    Modifier)
                                                  </label>
                                                  <Select
                                                    value={
                                                      item.printPositionValueId ||
                                                      "none"
                                                    }
                                                    disabled={!item.imageId}
                                                    onValueChange={(val) => {
                                                      const targetVal =
                                                        val === "none"
                                                          ? null
                                                          : val;
                                                      const targetOpt =
                                                        fullAttributeValuesList.find(
                                                          (o) =>
                                                            o.id === targetVal,
                                                        );
                                                      setMockupSides((prev) =>
                                                        prev.map((m) =>
                                                          m.id === item.id
                                                            ? {
                                                                ...m,
                                                                printPositionValueId:
                                                                  targetVal,
                                                                name: targetOpt
                                                                  ? targetOpt.value
                                                                  : m.name,
                                                              }
                                                            : m,
                                                        ),
                                                      );
                                                    }}>
                                                    <SelectTrigger className="w-full h-8 text-[11px]">
                                                      <SelectValue placeholder="Bebas" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem
                                                        value="none"
                                                        className="text-xs">
                                                        Bebas Posisi
                                                      </SelectItem>
                                                      {fullAttributeValuesList
                                                        .filter(
                                                          (v) =>
                                                            v.attributeType ===
                                                            "MOCKUP_SIDE",
                                                        )
                                                        .map((val) => (
                                                          <SelectItem
                                                            key={val.id}
                                                            value={val.id}
                                                            className="text-xs">
                                                            {val.value}
                                                          </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>

                                              <div className="flex gap-1.5 w-full mt-2.5">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleOpenMockupModal(item)
                                                  }
                                                  className="flex-1 text-xs font-semibold h-8 flex items-center justify-center gap-1.5"
                                                  disabled={!item.imageId}>
                                                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                                  Atur Area
                                                </Button>

                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleCopyMockupConfig(
                                                      item.mockupAreas || [],
                                                    )
                                                  }
                                                  className="text-xs font-medium h-8 px-2 flex items-center justify-center"
                                                  disabled={
                                                    !item.imageId ||
                                                    !item.mockupAreas ||
                                                    item.mockupAreas.length ===
                                                      0
                                                  }
                                                  title="Salin area mockup">
                                                  Copy
                                                </Button>

                                                {copiedMockupAreas && (
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      handlePasteMockupConfig(
                                                        item.id,
                                                      )
                                                    }
                                                    className="text-xs font-medium h-8 px-2 flex items-center justify-center border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400"
                                                    disabled={!item.imageId}
                                                    title="Tempel area mockup">
                                                    Paste
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="flex justify-end pt-4">
                                    <Button
                                      type="button"
                                      onClick={handleAddMockupSide}
                                      className="text-xs font-semibold space-x-1.5 h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 shadow-xs">
                                      <Plus className="h-4 w-4" />
                                      <span>Tambah Posisi Mockup</span>
                                    </Button>
                                  </div>
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
                          Define basic properties and media for each product
                          combination.
                        </p>
                        <hr />

                        <div className="flex justify-between items-center">
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={handlers.handleGenerateVariants}
                            className="space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Generate Variants from Attributes</span>
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={handlers.handleAddCustomVariant}>
                            Add Custom Variant
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-xl bg-stone-50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-stone-700">
                              Global Stock Adjuster:
                            </span>
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
                                  toast.error(
                                    "Masukkan jumlah stok yang valid",
                                  );
                                  return;
                                }
                                state.combinations.forEach((_, idx) => {
                                  handlers.handleUpdateVariantMeta(
                                    idx,
                                    "stock",
                                    stockNum,
                                  );
                                });
                                toast.success(
                                  `Berhasil menerapkan stok ${stockNum} ke semua varian.`,
                                );
                              }}>
                              Apply to All
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Apakah Anda yakin ingin menghapus semua varian?",
                                )
                              ) {
                                handlers.handleClearAllVariants();
                                toast.success("Semua varian berhasil dihapus.");
                              }
                            }}
                            className="space-x-2">
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
                              onUpdateVariantMeta={
                                handlers.handleUpdateVariantMeta
                              }
                              onChangeMeta={setters.setVariantFilesMap}
                              onRemoveVariant={handlers.handleRemoveVariant}
                              onUpdateVariantLabel={
                                handlers.handleUpdateVariantLabel
                              }
                            />
                          ) : (
                            <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                              <p className="text-sm text-stone-500 italic">
                                Belum ada varian yang dibuat. Klik tombol
                                Generate Variants di atas untuk membuat
                                kombinasi.
                              </p>
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

        {/* CHECKLIST GROUPED FILTER MODAL */}
        <Dialog
          open={state.isGenModalOpen}
          onOpenChange={
            state.isGenModalOpen
              ? () => setters.setIsGenModalOpen(false)
              : setters.setIsGenModalOpen
          }>
          <DialogContent className="max-w-3xl bg-white border shadow-2xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-slate-900">
                Atur Filter Kombinasi Varian
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1.5">
                Pilih kombinasi atribut yang valid untuk masing-masing item
                utama di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 py-4">
              {(() => {
                const variantGeneratingSelections =
                  state.attributeSelections.filter(
                    (a: any) => a.isVariantGenerator !== false,
                  );
                const primarySelection = variantGeneratingSelections[0];
                const otherSelections = variantGeneratingSelections.slice(1);
                const primaryAttr = state.attributesList.find(
                  (a: any) => a.id === primarySelection?.attributeId,
                );

                if (!primarySelection || !primaryAttr) return null;

                return primarySelection.valueIds.map((primValId: string) => {
                  const primVal = primaryAttr.values.find(
                    (v: any) => v.id === primValId,
                  );
                  if (!primVal) return null;

                  const primValLabel = primVal.value.split("|")[0];

                  return (
                    <div
                      key={primValId}
                      className="border rounded-xl p-5 bg-stone-50/50 space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-650"></span>
                          {primaryAttr.name}: {primValLabel}
                        </h4>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setters.setActiveGroupFilters((prev: any) => {
                                const next = { ...prev };
                                next[primValId] = {};
                                otherSelections.forEach((sel: any) => {
                                  next[primValId][sel.attributeId] = [
                                    ...sel.valueIds,
                                  ];
                                });
                                return next;
                              });
                            }}
                            className="text-[10px] h-6 px-2 font-bold">
                            Pilih Semua
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setters.setActiveGroupFilters((prev: any) => {
                                const next = { ...prev };
                                next[primValId] = {};
                                otherSelections.forEach((sel: any) => {
                                  next[primValId][sel.attributeId] = [];
                                });
                                return next;
                              });
                            }}
                            className="text-[10px] h-6 px-2 font-bold text-red-650 hover:bg-red-50">
                            Kosongkan
                          </Button>
                        </div>
                      </div>

                      {otherSelections.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Tidak ada sub-atribut untuk difilter.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {otherSelections.map((sel: any) => {
                            const attr = state.attributesList.find(
                              (a: any) => a.id === sel.attributeId,
                            );
                            if (!attr) return null;

                            const activeList =
                              state.activeGroupFilters[primValId]?.[
                                sel.attributeId
                              ] || [];

                            return (
                              <div
                                key={sel.attributeId}
                                className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {attr.name}
                                  </span>
                                  {!(
                                    inlineInputAttrId === sel.attributeId &&
                                    inlineInputGroupId === primValId
                                  ) && (
                                    <Button
                                      type="button"
                                      variant="link"
                                      size="sm"
                                      className="text-[10px] p-0 h-auto font-bold text-primary hover:text-primary/90"
                                      onClick={() => {
                                        setInlineInputAttrId(sel.attributeId);
                                        setInlineInputGroupId(primValId);
                                        setInlineInputValue("");
                                        setInlineInputPrice("");
                                      }}>
                                      + Tambah Nilai
                                    </Button>
                                  )}
                                </div>

                                {inlineInputAttrId === sel.attributeId &&
                                  inlineInputGroupId === primValId && (
                                    <div className="p-3 border border-stone-200 bg-stone-50/50 rounded-xl space-y-3 w-full max-w-sm">
                                      <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
                                        Tambah Nilai untuk {attr.name}
                                      </span>
                                      {attr.type === "COLOR" ? (
                                        <ColorValueInput
                                          value={inlineInputValue}
                                          onChange={(val) =>
                                            setInlineInputValue(val)
                                          }
                                        />
                                      ) : attr.type === "MODEL_SHAPE" ||
                                        attr.type === "SIZE" ? (
                                        <ModelShapeValueInput
                                          value={inlineInputValue}
                                          onChange={(val) =>
                                            setInlineInputValue(val)
                                          }
                                          placeholder={
                                            attr.type === "SIZE"
                                              ? "Nama Ukuran (e.g. 500ml, XL)"
                                              : "Nama Model / Shape (e.g. Oval, Bulat)"
                                          }
                                          type={attr.type}
                                        />
                                      ) : (
                                        <Input
                                          type="text"
                                          placeholder="Masukkan nilai baru..."
                                          value={inlineInputValue}
                                          onChange={(e: any) =>
                                            setInlineInputValue(e.target.value)
                                          }
                                          className="h-8 text-xs bg-white text-slate-800"
                                          autoFocus
                                        />
                                      )}

                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                          Penyesuaian Harga (Opsional)
                                        </label>
                                        <Input
                                          type="number"
                                          placeholder="Contoh: 5000 atau -2000"
                                          value={inlineInputPrice}
                                          onChange={(e: any) =>
                                            setInlineInputPrice(e.target.value)
                                          }
                                          className="h-8 text-xs bg-white text-slate-800"
                                        />
                                      </div>

                                      <div className="flex justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-3 text-xs text-stone-500 font-bold border-stone-250 bg-white"
                                          onClick={() => {
                                            setInlineInputAttrId(null);
                                            setInlineInputGroupId(null);
                                            setInlineInputValue("");
                                            setInlineInputPrice("");
                                          }}>
                                          Batal
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-white font-bold"
                                          onClick={async () => {
                                            if (!inlineInputValue.trim())
                                              return;
                                            await handlers.handleAddAttributeValueInline(
                                              sel.attributeId,
                                              inlineInputValue,
                                              primValId,
                                              inlineInputPrice,
                                            );
                                            setInlineInputAttrId(null);
                                            setInlineInputGroupId(null);
                                            setInlineInputValue("");
                                            setInlineInputPrice("");
                                          }}>
                                          Simpan
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                <div className="flex flex-wrap gap-2">
                                  {attr.values
                                    .filter((v: any) =>
                                      sel.valueIds.includes(v.id),
                                    )
                                    .map((v: any) => {
                                      const isChecked = activeList.includes(
                                        v.id,
                                      );

                                      const isColorType = attr.type === "COLOR";
                                      const isModelShape =
                                        attr.type === "MODEL_SHAPE" ||
                                        attr.type === "SIZE";

                                      const priceMod =
                                        sel.priceModifiers?.[v.id];
                                      const priceModLabel =
                                        priceMod && Number(priceMod) !== 0
                                          ? ` (${Number(priceMod) > 0 ? "+" : ""}Rp ${Number(priceMod).toLocaleString("id-ID")})`
                                          : "";

                                      let contentNode = null;

                                      if (isColorType) {
                                        const parsed = parseColorValue(v.value);
                                        const isCustomColor =
                                          parsed.name
                                            .toLowerCase()
                                            .includes("custom") ||
                                          parsed.name
                                            .toLowerCase()
                                            .includes("kustom");
                                        contentNode = (
                                          <span className="truncate flex items-center gap-1.5 flex-1 font-medium text-xs text-slate-700">
                                            <span
                                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-inner"
                                              style={{
                                                background: isCustomColor
                                                  ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
                                                  : parsed.hex,
                                              }}
                                            />
                                            <span className="truncate">
                                              {parsed.name || parsed.hex}
                                              {priceModLabel}
                                            </span>
                                            {!isCustomColor && (
                                              <span className="text-[9px] text-slate-450 font-mono shrink-0">
                                                CMYK({parsed.cmyk.c},
                                                {parsed.cmyk.m},{parsed.cmyk.y},
                                                {parsed.cmyk.k})
                                              </span>
                                            )}
                                          </span>
                                        );
                                      } else if (isModelShape) {
                                        const p = v.value.split("|");
                                        const mName = p[0] || "";
                                        const mUrl = p[1] || "";
                                        contentNode = (
                                          <span className="truncate flex items-center gap-1.5 flex-1 font-medium text-xs text-slate-700">
                                            {mUrl && (
                                              <img
                                                src={mUrl}
                                                alt={mName}
                                                className="w-4 h-4 object-cover rounded-sm border shrink-0 bg-slate-50"
                                              />
                                            )}
                                            <span className="truncate">
                                              {mName}
                                              {priceModLabel}
                                            </span>
                                          </span>
                                        );
                                      } else {
                                        const label = v.value.split("|")[0];
                                        contentNode = (
                                          <span className="truncate font-medium text-xs text-slate-700">
                                            {label}
                                            {priceModLabel}
                                          </span>
                                        );
                                      }

                                      return (
                                        <label
                                          key={v.id}
                                          className={`flex items-center space-x-2 border rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer select-none transition-all ${
                                            isChecked
                                              ? "border-indigo-650 bg-indigo-50/50 text-indigo-750"
                                              : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                                          }`}>
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                              setters.setActiveGroupFilters(
                                                (prev: any) => {
                                                  const next = { ...prev };
                                                  const currentList =
                                                    next[primValId]?.[
                                                      sel.attributeId
                                                    ] || [];
                                                  if (checked) {
                                                    next[primValId][
                                                      sel.attributeId
                                                    ] = [...currentList, v.id];
                                                  } else {
                                                    next[primValId][
                                                      sel.attributeId
                                                    ] = currentList.filter(
                                                      (id: string) =>
                                                        id !== v.id,
                                                    );
                                                  }
                                                  return next;
                                                },
                                              );
                                            }}
                                            className="h-3.5 w-3.5 border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          {contentNode}
                                        </label>
                                      );
                                    })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setters.setIsGenModalOpen(false)}
                className="font-bold text-xs uppercase">
                Batal
              </Button>
              <Button
                type="button"
                onClick={handlers.handleConfirmVariantGeneration}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase">
                Generate Varian Terpilih
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              currentName = currentName
                ? `${newName.name} ${currentName}`
                : newName.name;
            }
            form.setValue("name", currentName);

            form.setValue("itemNameId", newName.id);
          }}
        />

        <AddTagModal
          isOpen={isAddTagModalOpen}
          onClose={() => setIsAddTagModalOpen(false)}
          onSuccess={(newTags) => {
            setters.setTags((prev: any[]) => {
              const existingIds = new Set(prev.map((tag) => tag.id));
              const merged = [...prev];

              newTags.forEach((tag) => {
                if (!existingIds.has(tag.id)) {
                  merged.push(tag);
                  existingIds.add(tag.id);
                }
              });

              return merged;
            });

            const currentTagIds = form.getValues("tagIds") || [];

            form.setValue(
              "tagIds",
              Array.from(
                new Set([...currentTagIds, ...newTags.map((tag) => tag.id)]),
              ),
              {
                shouldDirty: true,
                shouldValidate: true,
              },
            );
          }}
        />

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
                  Tentukan satu atau lebih penempatan custom mockup untuk gambar
                  ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 rounded-full transition-colors">
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
                }}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveMockupAreas}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10">
                Simpan Area Mockup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Category Manager Modal */}
      <TagCategoryManagerModal
        isOpen={isTagCategoryModalOpen}
        onClose={() => setIsTagCategoryModalOpen(false)}
        availableTags={state.tags}
        tagCategories={state.tagCategories}
        onCategoriesChange={(updated) => {
          setters.setTagCategories(updated);
        }}
        onTagCreated={(newTag) => {
          setters.setTags((prev) => [...prev, newTag]);
        }}
      />
    </>
  );
}
