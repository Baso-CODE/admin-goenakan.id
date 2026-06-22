"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Check,
  ClipboardList,
  FileText,
  ListOrdered,
  Loader2,
  Tag,
} from "lucide-react";

// === SCHEMA BILINGUAL ===
const policyCategorySchema = z.object({
  nameId: z.string().min(2, {
    message: "Category name (ID) must be at least 2 characters.",
  }),
  nameEn: z.string().min(2, {
    message: "Category name (EN) must be at least 2 characters.",
  }),
  descriptionId: z.string().optional(),
  descriptionEn: z.string().optional(),
  displayOrder: z.coerce
    .number()
    .min(0, "Order must be 0 or greater")
    .default(0),
  isActive: z.boolean().default(true),
});

export type PolicyCategoryFormValues = z.infer<typeof policyCategorySchema>;

export default function PolicyCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: PolicyCategoryFormValues;
  onSubmit: (data: PolicyCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(policyCategorySchema),
    defaultValues: initialData ?? {
      nameId: "",
      nameEn: "",
      descriptionId: "",
      descriptionEn: "",
      displayOrder: 0,
      isActive: true,
    },
    mode: "onBlur",
  });

  // Reset form untuk mode edit
  useEffect(() => {
    if (initialData) {
      form.reset({
        nameId: initialData.nameId,
        nameEn: initialData.nameEn,
        descriptionId: initialData.descriptionId || "",
        descriptionEn: initialData.descriptionEn || "",
        displayOrder: initialData.displayOrder,
        isActive: initialData.isActive,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof policyCategorySchema>) => {
    onSubmit(values as PolicyCategoryFormValues);
  };

  return (
    <Card className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* === Name ID === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="nameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Category Name (ID) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Kebijakan Transaksi"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Name EN === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Category Name (EN) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Transaction Policies"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Description ID === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="descriptionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Description (ID)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat kategori ini..."
                          className="resize-none"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Description EN === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Description (EN)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Short description for this category..."
                          className="resize-none"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Display Order === */}
              <div className="col-span-2 md:col-span-1 items-center">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                        Display Order
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          disabled={isLoading || isSubmitting}
                          value={String(field.value ?? "")}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lower numbers appear first.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === isActive === */}
              <div className="col-span-2 md:col-span-1 flex items-center pt-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full h-11">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormLabel className="flex items-center gap-2 cursor-pointer m-0">
                        <Check className="h-4 w-4 text-muted-foreground" />
                        Active Status
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant="default"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Category" : "Save Category"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
