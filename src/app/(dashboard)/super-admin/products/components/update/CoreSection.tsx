"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Check,
  CheckCheck,
  ChevronsUpDown,
  Info,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { AddItemCategoryModal } from "../../../item-categories-product/components/addItemCategoryModal";
import { AddItemNameModal } from "../../../item-names-product/components/addItemNameModal";
import CreateCategoryModal from "../../../product-categories/components/createCategoryModal";
import MaterialTypeForm from "../../../product-materials/components/materialTypeForm";
import { TagCategoryManagerModal } from "../TagCategoryManagerModal";

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
  isSample: z.boolean().optional().default(false), // ✨ TAMBAHAN BARU: Field isSample
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
  colorMockupTrigger: z.string().optional(),
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
  const [tagCategories, setTagCategories] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);

  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [isTagCategoryModalOpen, setIsTagCategoryModalOpen] = useState(false);

  // States for inline creation modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemCategoryModalOpen, setIsItemCategoryModalOpen] = useState(false);
  const [isItemNameModalOpen, setIsItemNameModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemCategoryOpen, setItemCategoryOpen] = useState(false);
  const [itemNameOpen, setItemNameOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

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
      isSample: false, // ✨ TAMBAHAN BARU: Default nilai isSample
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
      colorMockupTrigger: "NONE",
    },
  });

  const isCustomProduct = form.watch("isCustom");
  const selectedCategoryId = form.watch("categoryId");
  const selectedItemCategoryId = form.watch("itemCategoryId");

  //  1. INITIALIZATION API FETCH (Tanpa Race Condition)
  useEffect(() => {
    let isMounted = true;

    const initializeForm = async () => {
      if (!initialData) return;
      if (status === "loading" || status === "unauthenticated") return;
      setLoadingData(true);

      try {
        const [catRes, tagRes, matRes, tagCatRes] = await Promise.all([
          fetchApi("/product-categories/list"),
          fetchApi("/product-tags/list"),
          fetchApi("/material-types/list"),
          fetchApi("/product-tags/categories"),
        ]);

        const cats = await catRes.json();
        const tagsData = await tagRes.json();
        const mats = await matRes.json();
        const tagCatsData = await tagCatRes.json().catch(() => []);

        if (!isMounted) return;
        setCategories(cats || []);
        setTags(tagsData || []);
        setMaterialTypes(mats || []);
        setTagCategories(Array.isArray(tagCatsData) ? tagCatsData : []);

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
            try {
              const resIN = await fetchApi(
                `/item-names?itemCategoryId=${initialData.itemCategoryId}&take=150`,
              );
              const dataIN = await resIN.json();
              fetchedItemNames = dataIN.data || [];
            } catch (e) {
              console.error("Gagal mengambil Item Names:", e);
            }
          }
        }

        if (!isMounted) return;

        setItemCategories(fetchedItemCats);
        setItemNames(fetchedItemNames);

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
              isSample: initialData.isSample || false, // ✨ TAMBAHAN BARU: Reset nilai isSample dari data edit
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
              colorMockupTrigger: initialData.colorMockupTrigger || "NONE",
            });
          }

          setLoadingData(false);
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
  }, [status, fetchApi, initialData]);

  const handleCategoryChange = async (val: string) => {
    if (val === "ADD_NEW_CATEGORY") {
      setIsCategoryModalOpen(true);
      return;
    }
    form.setValue("categoryId", val);
    form.setValue("itemCategoryId", "");
    form.setValue("itemNameId", "");
    setItemCategories([]);

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
    if (val === "ADD_NEW_ITEM_CATEGORY") {
      setIsItemCategoryModalOpen(true);
      return;
    }
    form.setValue("itemCategoryId", val);
    form.setValue("itemNameId", "");
    setItemNames([]);

    if (!val) return;
    try {
      const res = await fetchApi(`/item-names?itemCategoryId=${val}&take=150`);
      const result = await res.json();
      setItemNames(result.data || []);
    } catch (e) {
      console.error("Gagal memuat item names:", e);
    }
  };

  const handleCategoryAdded = (newCat: any) => {
    setCategories((prev) => [...prev, newCat]);
    form.setValue("categoryId", String(newCat.id));
    form.setValue("itemCategoryId", "");
    form.setValue("itemNameId", "");
  };

  const handleItemCategoryAdded = (newVal: any) => {
    setItemCategories((prev) => [...prev, newVal]);
    form.setValue("itemCategoryId", String(newVal.id));
    form.setValue("itemNameId", "");
  };

  const handleItemNameAdded = (newVal: any) => {
    setItemNames((prev) => [...prev, newVal]);
    form.setValue("itemNameId", String(newVal.id));

    let currentName = form.getValues("name") || "";
    if (!currentName.startsWith(newVal.name)) {
      currentName = currentName ? `${newVal.name} ${currentName}` : newVal.name;
      form.setValue("name", currentName);
    }
  };

  const handleAddMaterialSubmit = async (values: any) => {
    setIsSubmittingMaterial(true);
    try {
      const res = await fetchApi("/material-types", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Gagal menambah material");
      const newVal = await res.json();
      setMaterialTypes((prev) => [...prev, newVal]);
      form.setValue("materialTypeId", String(newVal.id));
      setIsMaterialModalOpen(false);
      toast.success("Material berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah material");
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

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

  if (loadingData) {
    return (
      <div className="space-y-8 border p-6 rounded-md bg-white shadow-sm animate-pulse">
        <div className="h-14 bg-stone-100 rounded-md" />
        <div className="space-y-4">
          <div className="h-6 w-36 bg-stone-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <div className="h-4 w-24 bg-stone-200 rounded" />
              <div className="h-10 bg-stone-100 rounded" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <div className="h-4 w-12 bg-stone-200 rounded" />
              <div className="h-10 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
        <div className="h-10 w-28 bg-stone-200 rounded-md" />
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-8 border p-6 rounded-md bg-white shadow-sm">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm flex items-start gap-2">
            <span className="font-semibold text-blue-905 shrink-0">
              Catatan:
            </span>
            <span>
              Semua pengaturan di dalam tab ini akan memengaruhi konfigurasi
              produk utama/dasar (base product configuration).
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
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel className="mb-2">Kategori Utama</FormLabel>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingData}
                            className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                            {field.value
                              ? categories.find(
                                  (c) => String(c.id) === String(field.value),
                                )?.name_id ||
                                categories.find(
                                  (c) => String(c.id) === String(field.value),
                                )?.name ||
                                "Pilih Kategori"
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
                              {categories.map((cat) => (
                                <CommandItem
                                  key={cat.id}
                                  value={cat.name_id || cat.name}
                                  onSelect={() => {
                                    handleCategoryChange(String(cat.id));
                                    setCategoryOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      String(field.value) === String(cat.id)
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {cat.name_id || cat.name}{" "}
                                  {cat.code && `(${cat.code})`}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <div className="h-px bg-stone-100 my-1" />
                            <CommandGroup>
                              <CommandItem
                                value="ADD_NEW_CATEGORY"
                                onSelect={() => {
                                  setCategoryOpen(false);
                                  setIsCategoryModalOpen(true);
                                }}
                                className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                                + Kategori Baru
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
                    <FormLabel className="mb-2">Item Category</FormLabel>
                    <Popover
                      open={itemCategoryOpen}
                      onOpenChange={setItemCategoryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingData || !selectedCategoryId}
                            className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                            {field.value
                              ? itemCategories.find(
                                  (ic) => String(ic.id) === String(field.value),
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
                              {itemCategories.map((ic) => (
                                <CommandItem
                                  key={ic.id}
                                  value={ic.name}
                                  onSelect={() => {
                                    handleItemCategoryChange(String(ic.id));
                                    setItemCategoryOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      String(field.value) === String(ic.id)
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
                                  setIsItemCategoryModalOpen(true);
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
                    <Popover open={itemNameOpen} onOpenChange={setItemNameOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingData}
                            className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                            {field.value
                              ? itemNames.find(
                                  (inm) =>
                                    String(inm.id) === String(field.value),
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
                              {itemNames.map((inm) => (
                                <CommandItem
                                  key={inm.id}
                                  value={inm.name}
                                  onSelect={() => {
                                    const val = String(inm.id);
                                    const oldVal = form.getValues("itemNameId");
                                    const oldItem = itemNames.find(
                                      (i) => String(i.id) === String(oldVal),
                                    );
                                    let currentName =
                                      form.getValues("name") || "";

                                    if (
                                      oldItem &&
                                      currentName.startsWith(oldItem.name)
                                    ) {
                                      currentName = currentName.replace(
                                        oldItem.name,
                                        inm.name,
                                      );
                                    } else if (
                                      !currentName.startsWith(inm.name)
                                    ) {
                                      currentName = currentName
                                        ? `${inm.name} ${currentName}`
                                        : inm.name;
                                    }
                                    form.setValue("name", currentName);

                                    field.onChange(val);
                                    setItemNameOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      String(field.value) === String(inm.id)
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
                                  setIsItemNameModalOpen(true);
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
                    <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingData}
                            className="w-full justify-between bg-white text-left font-normal border-stone-200 h-10">
                            {field.value
                              ? materialTypes.find(
                                  (mat) =>
                                    String(mat.id) === String(field.value),
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
                              {materialTypes.map((mat) => (
                                <CommandItem
                                  key={mat.id}
                                  value={mat.name}
                                  onSelect={() => {
                                    field.onChange(String(mat.id));
                                    setMaterialOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      String(field.value) === String(mat.id)
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
                                  setIsMaterialModalOpen(true);
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
            {/* Diubah menjadi md:grid-cols-5 agar muat menampung 5 tombol pilihan */}
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

              {/* ✨ TAMBAHAN BARU: Field isSample */}
              <FormField
                control={form.control}
                name="isSample"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produk Sampel?</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3 h-10 border rounded-md px-4 bg-white">
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
                name="colorMockupTrigger"
                render={({ field }) => (
                  <FormItem className="md:col-span-5">
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
                    <FormMessage />
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => {
                  const selectedTags = field.value || [];
                  return (
                    <FormItem className="md:col-span-5">
                      <div className="flex items-center justify-between">
                        <FormLabel>Product Tags</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsTagCategoryModalOpen(true)}
                          className="text-xs h-7 border-dashed border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2 flex items-center gap-1 font-medium">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Kelola Group</span>
                        </Button>
                      </div>

                      {Array.isArray(tagCategories) &&
                        tagCategories.length > 0 && (
                          <div className="flex flex-wrap gap-2 items-center mb-3 mt-1.5 p-2 bg-slate-50 dark:bg-stone-900 rounded-md border border-slate-100 dark:border-stone-800">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-1 select-none">
                              Tag Groups:
                            </span>
                            {tagCategories.map((cat) => {
                              const catTags = cat.tags || [];
                              const catTagIds = catTags.map((t: any) => t.id);
                              if (catTagIds.length === 0) return null;

                              const selectedCatTags = catTagIds.filter(
                                (id: string) => selectedTags.includes(id),
                              );
                              const isAllSelected =
                                selectedCatTags.length === catTagIds.length;
                              const isPartSelected =
                                selectedCatTags.length > 0 && !isAllSelected;

                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    if (isAllSelected) {
                                      field.onChange(
                                        selectedTags.filter(
                                          (id: string) =>
                                            !catTagIds.includes(id),
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
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-medium select-none",
                                    isAllSelected
                                      ? "bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs"
                                      : isPartSelected
                                        ? "bg-indigo-50 border-dashed border-indigo-350 text-indigo-755 font-semibold"
                                        : "bg-white border-slate-200 text-slate-655 hover:bg-slate-100 hover:text-slate-900",
                                  )}
                                  title={`${cat.name} (${catTags.map((t: any) => t.name).join(", ")})`}>
                                  {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

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
                  <FormItem className="col-span-2 md:col-span-4 z-10">
                    <FormLabel>Deskripsi Produk</FormLabel>
                    <FormControl>
                      <SimpleEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        minHeight="150px"
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

      {/* MODALS */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryAdded}
      />

      <AddItemCategoryModal
        isOpen={isItemCategoryModalOpen}
        onClose={() => setIsItemCategoryModalOpen(false)}
        onSuccess={handleItemCategoryAdded}
        parentCategoryId={selectedCategoryId}
      />

      <AddItemNameModal
        isOpen={isItemNameModalOpen}
        onClose={() => setIsItemNameModalOpen(false)}
        onSuccess={handleItemNameAdded}
        parentCategoryId={selectedCategoryId}
        parentItemCategoryId={selectedItemCategoryId}
        productCategories={categories}
        itemCategories={itemCategories}
      />

      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 border">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Tambah Material Baru
            </DialogTitle>
          </DialogHeader>
          <MaterialTypeForm
            onSubmit={handleAddMaterialSubmit}
            isSubmitting={isSubmittingMaterial}
          />
        </DialogContent>
      </Dialog>

      <TagCategoryManagerModal
        isOpen={isTagCategoryModalOpen}
        onClose={() => setIsTagCategoryModalOpen(false)}
        availableTags={tags}
        tagCategories={tagCategories}
        onCategoriesChange={(updated) => {
          setTagCategories(updated);
        }}
        onTagCreated={(newTag) => {
          setTags((prev) => [...prev, newTag]);
        }}
      />
    </>
  );
}
