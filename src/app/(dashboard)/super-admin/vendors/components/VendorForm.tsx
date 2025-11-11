"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  AtSign,
  Building2,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardList,
  Globe2,
  Layers,
  Loader2,
  MapPin,
  Network,
  PackageSearch,
  Tag,
  User,
} from "lucide-react";
import { useVendorFormFilter } from "../hooks/useVendorFormFilter";

// === ZOD SCHEMA ===
const vendorSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." }),
  picName: z
    .string()
    .min(2, { message: "PIC name must be at least 2 characters." }),

  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  isActive: z.boolean(),
  type: z.string().min(1, { message: "Please select type." }),
  categoryId: z.string().min(1, { message: "Please select category." }),
  itemIds: z
    .array(z.string())
    .nonempty({ message: "Please select at least one service type." }),
  platformId: z.string().min(1, { message: "Please select platform." }),
  contactId: z.string().min(3, { message: "Contact ID required." }),
});
export type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: VendorFormValues;
  onSubmit: (data: VendorFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const [categoryTypes] = useState([
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ]);

  const [contactPlatforms, setContactPlatforms] = useState<
    { id: string; name: string; slug: string; icon: string }[]
  >([]);
  console.log("contact platforms", contactPlatforms);

  const [vendorCategories, setVendorCategories] = useState<
    { id: string; name: string; type: string }[]
  >([]);
  const [vendorItems, setVendorItems] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: initialData || {
      companyName: "",
      picName: "",
      country: "",
      address: "",
      isActive: true,
      type: "",
      categoryId: "",
      itemIds: [],
      platformId: "",
      contactId: "",
    },
  });

  const { filteredCategories, filteredItems } = useVendorFormFilter({
    form,
    vendorCategories,
    vendorItems,
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  useEffect(() => {
    const fetchContactPlatforms = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(
          "http://localhost:8000/contact-platforms/active",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();

        setContactPlatforms(data);
      } catch (error) {
        toast.error("Failed to load contact platforms");
      }
    };
    fetchContactPlatforms();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(
          "http://localhost:8000/vendor-categories/active",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setVendorCategories(data);
      } catch (error) {
        toast.error("Failed to load vendor categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchVendorItems = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch("http://localhost:8000/vendor-items/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch vendor items");
        const data = await res.json();
        setVendorItems(data);
      } catch (error) {
        console.error("❌ Error loading vendor items:", error);
        toast.error("Failed to load service types");
      }
    };
    fetchVendorItems();
  }, []);

  const handleSubmit = (values: VendorFormValues) => {
    const payload = {
      ...values,
      contacts: [
        {
          platformId: values.platformId!,
          contactId: values.contactId!,
        },
      ],
    };
    onSubmit(payload);
  };

  return (
    <Card className="">
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PIC Name */}
              <FormField
                control={form.control}
                name="picName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      PIC Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter PIC name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platformId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      Contact Platform
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactPlatforms.length > 0 ? (
                          contactPlatforms.map((platform) => {
                            const Icon =
                              (LucideIcons as any)[platform.icon] ||
                              LucideIcons.HelpCircle;
                            return (
                              <SelectItem key={platform.id} value={platform.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  {platform.name}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="none" disabled>
                            No platform found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact ID */}
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      Contact ID / Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. +6281234 / @username"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-muted-foreground" />
                      Country
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter country"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter address"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryTypes.length > 0 ? (
                          categoryTypes.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Category
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("type") || loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !form.watch("type")
                                ? "Select type first"
                                : "Select category"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No categories available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Items */}
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
                      onOpenChange={setIsComboboxOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isComboboxOpen}
                            className="w-full justify-between"
                            disabled={isLoading || isSubmitting}
                          >
                            {field.value.length > 0
                              ? `${field.value.length} item dipilih`
                              : "Pilih item yang ditawarkan..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                        <Command>
                          <CommandInput placeholder="Cari item..." />
                          <CommandList>
                            <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {filteredItems.map((item) => {
                                const isSelected = field.value.includes(
                                  item.id
                                );
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.name}
                                    onSelect={() => {
                                      const newIds = isSelected
                                        ? field.value.filter(
                                            (v) => v !== item.id
                                          )
                                        : [...field.value, item.id];
                                      field.onChange(newIds);
                                    }}
                                  >
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((id) => {
                        const item = vendorItems.find((i) => i.id === id);
                        if (!item) return null;
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              field.onChange(
                                field.value.filter((v) => v !== id)
                              )
                            }
                          >
                            {item.name} ✕
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="self-start">
                    <FormLabel className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      Active Status
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="cursor-pointer"
              >
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
