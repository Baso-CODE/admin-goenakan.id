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
  const [categoryTypes] = useState([
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ]);

  // State Data Master
  const [contactPlatforms, setContactPlatforms] = useState<any[]>([]);
  const [vendorCategories, setVendorCategories] = useState<any[]>([]);
  const [vendorItems, setVendorItems] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);

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

  const handleSubmit = (values: AddVendorFormValues) => {
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
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Hapus reset categoryId jika Anda ingin category tetap terpilih (opsional)
                        // form.setValue("categoryId", "");

                        // Hapus reset itemIds agar item tidak hilang saat Type berubah
                        // form.setValue("itemIds", []);
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      // === PERBAIKAN DISINI ===
                      onValueChange={field.onChange} // Cukup gunakan field.onChange saja
                      // ATAU jika ingin eksplisit:
                      /* onValueChange={(val) => {
                         field.onChange(val);
                         // Jangan panggil form.setValue("itemIds", [])
                      }} 
                      */
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

              {/* === VENDOR ITEMS (Simpler for Add Mode) === */}
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
                            // Disable jika Category belum dipilih (Optional, UX preference)
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
                              {/* Gunakan filteredItems langsung */}
                              {filteredItems.map((item) => {
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
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* BADGE LIST */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(field.value ?? []).map((selectedId) => {
                        // Cari Nama Item dari Master Data (vendorItems)
                        const item = vendorItems.find(
                          (i) => i.id === selectedId,
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
