"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
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
import { toast } from "sonner";
import AddressField from "../../clients/components/addressField";
import ContactPlatformForm, {
  ContactPlatformFormValues,
} from "../../contact-platforms/components/FormContactPlatform";
import VendorCategoryForm, {
  VendorCategoryFormValues,
} from "../../vendor-categories/components/formCategoryVendor";
import VendorItemForm, {
  VendorItemFormValues,
} from "../../vendor-items/components/formItemVendor";
import { useVendorFormFilter } from "../hooks/useVendorFormFilter";

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

export type AddVendorFormValues = z.infer<typeof createVendorSchema>;

export default function AddVendorForm({
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  onSubmit: (data: AddVendorFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi, status } = useApi();

  const [categoryTypes] = useState([
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ]);

  // State Data Master
  const [contactPlatforms, setContactPlatforms] = useState<any[]>([]);
  const [vendorCategories, setVendorCategories] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [vendorItems, setVendorItems] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  // UI State
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // === FORM INIT ===
  // Default values kosong untuk Add Mode
  const form = useForm<AddVendorFormValues>({
    resolver: zodResolver(createVendorSchema) as Resolver<AddVendorFormValues>,
    defaultValues: {
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

  const { filteredCategories, filteredItems } = useVendorFormFilter({
    form: form as any,
    vendorCategories,
    vendorItems,
  });

  // === API CALLS ===
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

        // Parsing data secara aman jika response OK
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
          setVendorItems(itemsData);
        }
      } catch (error) {
        console.error("Failed loading form dependencies:", error);
      }
    };

    fetchDependencies();
  }, [status, fetchApi]);

  const handleAddPlatformFast = async (data: ContactPlatformFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/contact-platforms", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gagal membuat platform");
      }

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

  const handleAddCategoryFast = async (data: VendorCategoryFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/vendor-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat kategori vendor");
      }

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

  const handleAddItemFast = async (data: VendorItemFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/vendor-items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat vendor item");
      }

      const responseData = await res.json();
      const newItem = responseData.data || responseData;

      // Tambah data master item baru
      setVendorItems((prev) => [...prev, newItem]);

      const currentItems = form.getValues("itemIds") || [];
      form.setValue("itemIds", [...currentItems, newItem.id]);

      setIsItemModalOpen(false);
      toast.success("Vendor Item berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    }
  };
  const handleSubmit = (values: AddVendorFormValues) => {
    const payload = {
      ...values,
      contacts: [
        { platformId: values.platformId!, contactId: values.contactId! },
      ],
    };
    onSubmit(payload);
  };

  const selectedType = form.watch("type");
  const selectedCategoryId = form.watch("categoryId");
  const getAvailableItems = () => {
    if (selectedType === "PRODUCT") {
      const selectedProductCat = productCategories.find(
        (cat) => cat.id === selectedCategoryId,
      );
      if (!selectedProductCat || !selectedProductCat.itemCategories) return [];

      return selectedProductCat.itemCategories.map((itemCat: any) => ({
        id: itemCat.id,
        name: itemCat.name,
      }));
    } else {
      return filteredItems;
    }
  };

  const availableItems = getAvailableItems();

  return (
    <Card>
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              const firstErrorField = Object.keys(errors)[0];
              const errorMessage =
                errors[firstErrorField as keyof typeof errors]?.message;

              toast.error(
                `Periksa kembali isian Anda: ${errorMessage || "Ada field yang belum sesuai."}`,
              );
              console.error("Form Validation Errors:", errors);
            })}
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
                      <Input {...field} disabled={isLoading || isSubmitting} />
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
                      <Input {...field} disabled={isLoading || isSubmitting} />
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
                      <DialogContent className="">
                        <DialogHeader>
                          <DialogTitle>Tambah Platform Baru</DialogTitle>
                        </DialogHeader>
                        <ContactPlatformForm onSubmit={handleAddPlatformFast} />
                      </DialogContent>
                    </Dialog>

                    <Select
                      value={field.value}
                      disabled={isLoading || isSubmitting}
                      onValueChange={(val) => {
                        if (val === "add_new_platform") {
                          setIsPlatformModalOpen(true);
                        } else {
                          field.onChange(val);
                        }
                      }}>
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Platform" />
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
                      <Input {...field} disabled={isLoading || isSubmitting} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                          !selectedType ||
                          (selectedType === "SERVICE" && loadingCategories)
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
                  <FormItem className="">
                    <FormLabel className="flex items-center gap-2">
                      <PackageSearch className="h-4 w-4 text-muted-foreground" />
                      Vendor Items
                    </FormLabel>

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
                            disabled={
                              !form.watch("categoryId") ||
                              isLoading ||
                              isSubmitting
                            }>
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
                              {availableItems.map((item: any) => {
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
                                    {item.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                            <div className="h-1px bg-stone-200 my-1 mx-2" />
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
                        const item = availableItems.find(
                          (i: any) => i.id === selectedId,
                        );

                        return (
                          <Badge
                            key={selectedId}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100 hover:text-red-600 gap-1 pl-2 pr-1"
                            onClick={() => {
                              const next = (field.value ?? []).filter(
                                (v) => v !== selectedId,
                              );
                              field.onChange(next);
                            }}>
                            {item ? item.name : "Unknown"}
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
                Save New Vendor
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
