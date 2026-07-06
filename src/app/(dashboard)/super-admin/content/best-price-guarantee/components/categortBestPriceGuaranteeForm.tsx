"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
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
  Languages,
  ListOrdered,
  Loader2,
  Tag,
} from "lucide-react";

// === SCHEMA (BILINGUAL) ===
const bestPriceCategorySchema = z.object({
  nameId: z
    .string()
    .min(2, { message: "Name (ID) must be at least 2 characters." }),
  nameEn: z
    .string()
    .min(2, { message: "Name (EN) must be at least 2 characters." }),
  descriptionId: z.string().optional(),
  descriptionEn: z.string().optional(),
  displayOrder: z.number().min(0, "Order must be 0 or greater").default(0),
  isActive: z.boolean().default(true),
});

export type BestPriceCategoryFormValues = z.infer<
  typeof bestPriceCategorySchema
>;

export default function CategoryBestPriceGuaranteeForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: BestPriceCategoryFormValues;
  onSubmit: (data: BestPriceCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<BestPriceCategoryFormValues>({
    resolver: zodResolver(
      bestPriceCategorySchema,
    ) as Resolver<BestPriceCategoryFormValues>,
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

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

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
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full items-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6  items-start">
              {/* === NAME (ID & EN) === */}
              <FormField
                control={form.control}
                name="nameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" /> Category
                      Name (ID) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Elektronik"
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
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />{" "}
                      Category Name (EN) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Electronics"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === DESCRIPTION (ID & EN) === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="descriptionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                        Description (ID)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi untuk kategori (ID)..."
                          {...field}
                          value={field.value || ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                        Description (EN)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description for category (EN)..."
                          {...field}
                          value={field.value || ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === DISPLAY ORDER & ACTIVE STATUS === */}
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-muted-foreground" />{" "}
                      Display Order
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        disabled={isLoading || isSubmitting}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg h-12 mt-auto">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer m-0 flex items-center gap-2">
                      <Check className="h-4 w-4" /> Active Status
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading || isSubmitting}>
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
