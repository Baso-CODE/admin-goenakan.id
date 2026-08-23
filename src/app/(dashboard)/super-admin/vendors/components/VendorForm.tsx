"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  Dialog,
  DialogContent,
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronsUpDown,
  ClipboardList,
  Loader2,
  PackageSearch,
  Plus,
} from "lucide-react";

import AddressField from "../../clients/components/addressField";
import ContactPlatformForm from "../../contact-platforms/components/FormContactPlatform";
import VendorCategoryForm from "../../vendor-categories/components/formCategoryVendor";
import VendorItemForm from "../../vendor-items/components/formItemVendor";
import { useVendorFormFilter } from "../hooks/useVendorFormFilter";

// === ZOD SCHEMA ===
const baseVendorSchema = {
  companyName: z.string().min(2, "Company name required"),
  picName: z.string().min(2, "PIC name required"),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  subDistrict: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().min(5, "Address required"),
  isActive: z.boolean(),
  itemIds: z.array(z.string()).optional(),
  platformId: z.string().min(1, "Platform required"),
  contactId: z.string().min(3, "Contact ID required"),
  trackingUrl: z.string().optional(),
};

export const createVendorSchema = z.object({
  ...baseVendorSchema,
  type: z.string().min(1, "Type required"),
  categoryId: z.string().min(1, "Category required"),
});

export const updateVendorSchema = z.object({
  ...baseVendorSchema,
  type: z.string().optional(),
  categoryId: z.string().optional(),
});

export type VendorFormValues = z.infer<
  typeof createVendorSchema | typeof updateVendorSchema
>;

export default function VendorForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
  existingItems = [],
}: {
  initialData?: VendorFormValues;
  onSubmit: (data: VendorFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  existingItems?: { id: string; name: string }[];
}) {
  const { fetchApi, status } = useApi();

  const [categoryTypes] = useState([
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ]);

  const [hasCategoryChanged, setHasCategoryChanged] = useState(false);
  const isFormReady = useRef(false);

  // === STATE DATA MASTER ===
  const [contactPlatforms, setContactPlatforms] = useState<any[]>([]);
  const [vendorCategories, setVendorCategories] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  const [apiVendorItems, setApiVendorItems] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);

  // STATE MODAL QUICK ADD
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // === FORM INIT ===
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(
      initialData ? updateVendorSchema : createVendorSchema,
    ),
    defaultValues: initialData || {
      companyName: "",
      picName: "",
      country: "",
      province: "",
      city: "",
      district: "",
      subDistrict: "",
      postalCode: "",
      address: "",
      isActive: true,
      type: "",
      categoryId: "",
      itemIds: [],
      platformId: "",
      contactId: "",
      trackingUrl: "",
    },
  });

  // === MERGE DATA ===
  const allVendorItems = useMemo(() => {
    const combined = [...apiVendorItems];

    existingItems.forEach((existing) => {
      const exists = combined.some((apiItem) => apiItem.id === existing.id);

      if (!exists) {
        combined.push({
          id: existing.id,
          name: existing.name,
          categoryId: initialData?.categoryId || "mixed",
        });
      }
    });

    return combined;
  }, [apiVendorItems, existingItems, initialData]);

  // === HOOK FILTER ===
  const { filteredCategories, filteredItems } = useVendorFormFilter({
    form,
    vendorCategories,
    vendorItems: allVendorItems,
  });

  const currentCategoryId = form.watch("categoryId");
  const selectedType = form.watch("type");

  useEffect(() => {
    if (!initialData) {
      setHasCategoryChanged(true);
      return;
    }
    if (!isFormReady.current) {
      isFormReady.current = true;
      return;
    }
    if (initialData && currentCategoryId !== initialData.categoryId) {
      setHasCategoryChanged(true);
    }
  }, [currentCategoryId, initialData]);

  // === API CALLS DEPENDENCIES ===
  useEffect(() => {
    const fetchDependencies = async () => {
      if (status !== "authenticated") return;
      try {
        const [platformsRes, catsRes, prodCatsRes, itemsRes] =
          await Promise.all([
            fetchApi("/contact-platforms/active"),
            fetchApi("/vendor-categories/active"),
            fetchApi("/product-categories/list"),
            fetchApi("/vendor-items/active"),
          ]);

        if (platformsRes.ok) {
          const platformsData = await platformsRes.json();
          setContactPlatforms(platformsData);
        }

        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setVendorCategories(catsData);
        }

        if (prodCatsRes.ok) {
          const prodCatsData = await prodCatsRes.json();
          setProductCategories(prodCatsData);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setApiVendorItems(itemsData);
        }
      } catch (error) {
        console.error("Failed loading form dependencies:", error);
      }
    };

    fetchDependencies();
  }, [status, fetchApi]);

  // === HANDLERS QUICK ADD ===
  const handleAddPlatformFast = async (data: any) => {
    // ... logic tambah platform (tidak diubah)
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/contact-platforms", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal membuat platform");

      const responseData = await res.json();
      const newPlatform = responseData.data || responseData;
      setContactPlatforms((prev) => [...prev, newPlatform]);
      form.setValue("platformId", newPlatform.id);
      setIsPlatformModalOpen(false);
      toast.success("Platform berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    }
  };

  const handleAddCategoryFast = async (data: any) => {
    // ... logic tambah kategori (tidak diubah)
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/vendor-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal membuat kategori vendor");

      const responseData = await res.json();
      const newCategory = responseData.data || responseData;

      setVendorCategories((prev) => [...prev, newCategory]);
      form.setValue("type", newCategory.type);
      form.setValue("categoryId", newCategory.id);
      setIsCategoryModalOpen(false);
      toast.success("Kategori Vendor berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    }
  };

  const handleAddItemFast = async (data: any) => {
    // ... logic tambah item (tidak diubah)
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/vendor-items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal membuat vendor item");

      const responseData = await res.json();
      const newItem = responseData.data || responseData;

      setApiVendorItems((prev) => [...prev, newItem]);

      const currentItems = form.getValues("itemIds") || [];
      form.setValue("itemIds", [...currentItems, newItem.id]);

      setIsItemModalOpen(false);
      toast.success("Vendor Item berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    }
  };

  const handleSubmit = (values: VendorFormValues) => {
    const payload = {
      ...values,
      contacts: [
        { platformId: values.platformId!, contactId: values.contactId! },
      ],
    };
    onSubmit(payload);
  };

  const getAvailableItems = () => {
    if (selectedType === "PRODUCT") {
      const selectedProductCat = productCategories.find(
        (cat) => cat.id === currentCategoryId,
      );
      if (!selectedProductCat || !selectedProductCat.itemCategories) return [];

      return selectedProductCat.itemCategories.map((itemCat: any) => ({
        id: itemCat.id,
        name: itemCat.name,
      }));
    } else {
      return initialData && !hasCategoryChanged
        ? allVendorItems
        : filteredItems;
    }
  };

  const itemsToDisplay = getAvailableItems();

  return (
    <Card className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* === COMPANY NAME === */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      {/* ✨ TAMBAHAN: Placeholder untuk Company Name */}
                      <Input
                        {...field}
                        placeholder="Contoh: PT Goenakan Indonesia"
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === PIC NAME === */}
              <FormField
                control={form.control}
                name="picName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC Name *</FormLabel>
                    <FormControl>
                      {/* ✨ TAMBAHAN: Placeholder untuk PIC Name */}
                      <Input
                        {...field}
                        placeholder="Contoh: Budi Santoso"
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === PLATFORM & CONTACT === */}
              <FormField
                control={form.control}
                name="platformId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Platform *</FormLabel>
                    {/* MODAL PLATFORM */}
                    <Dialog
                      open={isPlatformModalOpen}
                      onOpenChange={setIsPlatformModalOpen}>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Tambah Platform Baru</DialogTitle>
                        </DialogHeader>
                        <ContactPlatformForm onSubmit={handleAddPlatformFast} />
                      </DialogContent>
                    </Dialog>

                    <Select
                      onValueChange={(val) => {
                        if (val === "add_new_platform") {
                          setIsPlatformModalOpen(true);
                        } else {
                          field.onChange(val);
                        }
                      }}
                      value={field.value}
                      disabled={isLoading || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactPlatforms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-2" />
                        <SelectItem
                          value="add_new_platform"
                          className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Buat Platform Baru...
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact ID *</FormLabel>
                    <FormControl>
                      {/* ✨ TAMBAHAN: Placeholder untuk Contact ID */}
                      <Input
                        {...field}
                        placeholder="Contoh: 081234567890 / @username"
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === TRACKING & ADDRESS === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="trackingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Tracking Link</FormLabel>
                      <FormControl>
                        {/* ✨ TAMBAHAN: Placeholder untuk Tracking URL */}
                        <Input
                          {...field}
                          placeholder="Contoh: https://tracking.ekspedisi.com/resi/..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-4 border p-4 rounded-lg bg-slate-50/50">
                <FormLabel className="text-base font-semibold">
                  Area & Lokasi Vendor
                </FormLabel>
                <AddressField
                  value={{
                    country: form.watch("country") || "",
                    province: form.watch("province") || "",
                    city: form.watch("city") || "",
                    district: form.watch("district") || "",
                    subDistrict: form.watch("subDistrict") || "",
                    postalCode: form.watch("postalCode") || "",
                  }}
                  onChange={(updated) => {
                    if (updated.country !== undefined)
                      form.setValue("country", updated.country, {
                        shouldValidate: true,
                      });
                    if (updated.province !== undefined)
                      form.setValue("province", updated.province, {
                        shouldValidate: true,
                      });
                    if (updated.city !== undefined)
                      form.setValue("city", updated.city, {
                        shouldValidate: true,
                      });
                    if (updated.district !== undefined)
                      form.setValue("district", updated.district, {
                        shouldValidate: true,
                      });
                    if (updated.subDistrict !== undefined)
                      form.setValue("subDistrict", updated.subDistrict, {
                        shouldValidate: true,
                      });
                    if (updated.postalCode !== undefined)
                      form.setValue("postalCode", updated.postalCode, {
                        shouldValidate: true,
                      });
                  }}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        {/* ✨ TAMBAHAN: Placeholder untuk Alamat Lengkap */}
                        <Input
                          {...field}
                          placeholder="Contoh: Jl. Jend. Sudirman No 12, Patokan: Sebelah Minimarket"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === TYPE & CATEGORY === */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("categoryId", "");
                        form.setValue("itemIds", []);
                      }}
                      value={field.value}
                      disabled={isLoading || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryTypes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                name="categoryId"
                render={({ field }) => {
                  const currentCategories =
                    selectedType === "PRODUCT"
                      ? productCategories.map((c) => ({
                          id: c.id,
                          name: c.name,
                        }))
                      : filteredCategories;

                  return (
                    <FormItem>
                      <FormLabel>Category</FormLabel>

                      {/*  MODAL CATEGORY */}
                      <Dialog
                        open={isCategoryModalOpen}
                        onOpenChange={setIsCategoryModalOpen}>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Tambah Kategori Vendor Baru
                            </DialogTitle>
                          </DialogHeader>
                          <VendorCategoryForm
                            onSubmit={handleAddCategoryFast}
                          />
                        </DialogContent>
                      </Dialog>

                      <Select
                        value={field.value}
                        disabled={
                          !selectedType || loadingCategories || isLoading
                        }
                        onValueChange={(val) => {
                          if (val === "add_new_category") {
                            setIsCategoryModalOpen(true);
                          } else {
                            field.onChange(val);
                            form.setValue("itemIds", []);
                          }
                        }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}

                          {/* Tombol Add New Category HANYA untuk Service */}
                          {selectedType === "SERVICE" && (
                            <>
                              <div className="h-px bg-stone-200 my-1 mx-2" />
                              <SelectItem
                                value="add_new_category"
                                className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer">
                                <div className="flex items-center gap-2 text-sm">
                                  <Plus className="w-4 h-4" />
                                  Buat Kategori Baru...
                                </div>
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* === VENDOR ITEMS === */}
              <FormField
                control={form.control}
                name="itemIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <PackageSearch className="h-4 w-4 text-muted-foreground" />
                      Vendor Items
                      {!hasCategoryChanged && initialData && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          All Categories Shown
                        </span>
                      )}
                    </FormLabel>

                    {/* MODAL ITEM */}
                    <Dialog
                      open={isItemModalOpen}
                      onOpenChange={setIsItemModalOpen}>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Tambah Vendor Item Baru</DialogTitle>
                        </DialogHeader>
                        <VendorItemForm
                          onSubmit={handleAddItemFast}
                          initialData={{
                            name: "",
                            description: "",
                            categoryId: form.watch("categoryId") || "",
                            isActive: true,
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <Popover
                      open={isComboboxOpen}
                      onOpenChange={setIsComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            disabled={isLoading || isSubmitting}>
                            {(field.value ?? []).length > 0
                              ? `${(field.value ?? []).length} item dipilih`
                              : "Pilih item..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-100 p-0">
                        <Command>
                          <CommandInput placeholder="Cari item..." />
                          <CommandList>
                            <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {itemsToDisplay.map((item: any) => {
                                const isSelected = (field.value ?? []).includes(
                                  item.id,
                                );
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.name}
                                    onSelect={() => {
                                      const current = field.value ?? [];
                                      const next = isSelected
                                        ? current.filter((id) => id !== item.id)
                                        : [...current, item.id];
                                      field.onChange(next);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{item.name}</span>
                                      {item.categoryId === "mixed" && (
                                        <span className="text-[10px] text-muted-foreground">
                                          Existing Item
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>

                            <div className="h-px bg-stone-200 my-1 mx-2" />
                            <CommandItem
                              onSelect={() => {
                                setIsItemModalOpen(true);
                                setIsComboboxOpen(false);
                              }}
                              className="text-blue-600 font-medium text-sm justify-center cursor-pointer py-2">
                              <Plus className="mr-2 h-4 w-4" /> Buat Item Baru
                            </CommandItem>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* BADGE LIST */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(field.value ?? []).map((selectedId) => {
                        let item =
                          itemsToDisplay.find(
                            (i: any) => i.id === selectedId,
                          ) ||
                          existingItems.find((i) => i.id === selectedId) ||
                          allVendorItems.find((i) => i.id === selectedId);

                        return (
                          <Badge
                            key={selectedId}
                            variant={item ? "secondary" : "outline"}
                            className="cursor-pointer hover:bg-red-100 hover:text-red-600 gap-1 pl-2 pr-1"
                            onClick={() => {
                              const next = (field.value ?? []).filter(
                                (v) => v !== selectedId,
                              );
                              field.onChange(next);
                            }}>
                            {item ? item.name : "Loading..."}
                            <span className="text-[10px] font-bold">✕</span>
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === ACTIVE STATUS === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="self-start">
                    <FormLabel>Active Status</FormLabel>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                      <span>{field.value ? "Active" : "Inactive"}</span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="cursor-pointer">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Vendor" : "Save Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
