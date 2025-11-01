"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  User,
  Phone,
  Globe2,
  MapPin,
  CheckCircle2,
  PackageSearch,
  Loader2,
  ClipboardList,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// === ZOD SCHEMA ===
const vendorSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." }),
  picName: z
    .string()
    .min(2, { message: "PIC name must be at least 2 characters." }),
  phone: z
    .string()
    .min(9, { message: "Phone number too short." })
    .regex(/^(\+?\d{7,15})$/, { message: "Invalid phone number format." }),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters." }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  isActive: z.boolean(),
  itemIds: z
    .array(z.string())
    .nonempty({ message: "Please select at least one service type." }),
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
  const [vendorItems, setVendorItems] = useState<
    { id: string; name: string }[]
  >([]);

  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // === Fetch Vendor Items Active ===
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

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: initialData || {
      companyName: "",
      picName: "",
      phone: "",
      country: "",
      address: "",
      isActive: true,
      itemIds: [],
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: VendorFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full ">
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

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+62..."
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

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
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

              {/* 🔄 ITEM ID FIELD MENGGUNAKAN COMBOBOX MULTI-SELECT 🔄 */}
              <FormField
                control={form.control}
                name="itemIds"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                              {vendorItems.map((item) => {
                                const isSelected = field.value.includes(
                                  item.id
                                );
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={item.name} // Gunakan nama untuk pencarian
                                    onSelect={() => {
                                      const newIds = isSelected
                                        ? field.value.filter(
                                            (v) => v !== item.id
                                          ) // Hapus
                                        : [...field.value, item.id]; // Tambah
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

                    {/* Tampilkan item yang sudah dipilih sebagai Badge */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((id) => {
                        const item = vendorItems.find((i) => i.id === id);
                        if (!item) return null; // Handle item yang mungkin sudah dihapus atau belum dimuat

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
              {/* 🔄 AKHIR BLOK ITEM ID DENGAN COMBOBOX 🔄 */}
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
