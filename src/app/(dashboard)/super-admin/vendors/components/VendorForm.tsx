"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { apiUrl } from "@/helper/apiurl";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronsUpDown,
  ClipboardList,
  Loader2,
  PackageSearch,
} from "lucide-react";
import { useVendorFormFilter } from "../hooks/useVendorFormFilter";
import VendorAddressField from "./VendorAddressField";

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
  existingItems = [], // Data Existing dari Parent (Edit Page)
}: {
  initialData?: VendorFormValues;
  onSubmit: (data: VendorFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  existingItems?: { id: string; name: string }[];
}) {
  const [categoryTypes] = useState([
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ]);

  const [contactPlatforms, setContactPlatforms] = useState<any[]>([]);
  const [vendorCategories, setVendorCategories] = useState<any[]>([]);

  // State Items dari API (Untuk Dropdown Pilihan Baru)
  const [vendorItems, setVendorItems] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // === FORM INIT ===
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(
      initialData ? updateVendorSchema : createVendorSchema
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

  const { filteredCategories, filteredItems } = useVendorFormFilter({
    form,
    vendorCategories,
    vendorItems,
  });

  // === API CALLS ===
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel Fetch
        const [platformsRes, catsRes, itemsRes] = await Promise.all([
          fetch(`${apiUrl}/contact-platforms/active`, { headers }),
          fetch(`${apiUrl}/vendor-categories/active`, { headers }),
          fetch(`${apiUrl}/vendor-items/active`, { headers }),
        ]);

        if (platformsRes.ok) setContactPlatforms(await platformsRes.json());
        if (catsRes.ok) setVendorCategories(await catsRes.json());
        if (itemsRes.ok) setVendorItems(await itemsRes.json());
      } catch (error) {
        console.error("Failed loading form dependencies");
      }
    };
    fetchDependencies();
  }, []);

  const handleSubmit = (values: VendorFormValues) => {
    const payload = {
      ...values,
      contacts: [
        { platformId: values.platformId!, contactId: values.contactId! },
      ],
    };
    onSubmit(payload);
  };

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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactPlatforms.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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

              <div className="col-span-1 md:col-span-2">
                <VendorAddressField form={form} />
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
                      onValueChange={field.onChange}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("type") || loadingCategories}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((c) => (
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

              {/* ✅ VENDOR ITEMS (LOGIKA LANGSUNG - PASTI MUNCUL) */}
              <FormField
                control={form.control}
                name="itemIds"
                render={({ field }) => (
                  <FormItem className="">
                    <FormLabel className="flex items-center gap-2">
                      <PackageSearch className="h-4 w-4 text-muted-foreground" />
                      Vendor Items
                    </FormLabel>
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
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Cari item..." />
                          <CommandList>
                            <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {filteredItems.map((item) => {
                                const isSelected = (field.value ?? []).includes(
                                  item.id
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
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {item.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* ✅ BAGIAN PENTING: MENAMPILKAN ITEM YANG TERPILIH */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(field.value ?? []).map((selectedId) => {
                        // 1. Coba cari di Existing Data (Data bawaan halaman edit - PASTI VALID)
                        let item = existingItems.find(
                          (i) => i.id === selectedId
                        );

                        // 2. Jika tidak ada di Existing, cari di API Vendor Items
                        if (!item) {
                          item = vendorItems.find((i) => i.id === selectedId);
                        }

                        // 3. Render
                        return (
                          <Badge
                            key={selectedId}
                            variant={item ? "secondary" : "outline"}
                            className={cn(
                              "cursor-pointer hover:bg-red-100 hover:text-red-600 gap-1 pl-2 pr-1",
                              !item && "border-dashed text-muted-foreground" // Styling kalau loading
                            )}
                            onClick={() => {
                              const next = (field.value ?? []).filter(
                                (v) => v !== selectedId
                              );
                              field.onChange(next);
                            }}>
                            {/* Tampilkan Nama jika ada, jika tidak tampilkan Loading... */}
                            {item ? item.name : <span>Loading Item...</span>}
                            <span className="ml-1 text-[10px] font-bold">
                              ✕
                            </span>
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
                {initialData ? "Update Vendor" : "Save Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
