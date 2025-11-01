"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { toast } from "sonner";

import {
  AlignLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  Tag,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- ✅ ZOD VALIDATION SCHEMA ---
const vendorItemSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Item name must be at least 2 characters." }),
  description: z.string().optional(),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  isActive: z.boolean(),
});

export type VendorItemFormValues = z.infer<typeof vendorItemSchema>;

export default function VendorItemForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: VendorItemFormValues;
  onSubmit: (data: VendorItemFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<VendorItemFormValues>({
    resolver: zodResolver(vendorItemSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      categoryId: "",
      isActive: true,
    },
  });

  const [vendorCategories, setVendorCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // === Fetch kategori dari backend ===
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        if (!token) throw new Error("No token found");

        const res = await fetch(
          "http://localhost:8000/vendor-categories/active",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        setVendorCategories(data);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
        toast.error("Failed to load vendor categories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: VendorItemFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full">
      {(isLoading || loadingCategories) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Item Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Item Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
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
                      disabled={loadingCategories}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? "Loading..."
                                : "Select category"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendorCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description..." {...field} />
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
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant={"default"}
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Item" : "Save Item"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
