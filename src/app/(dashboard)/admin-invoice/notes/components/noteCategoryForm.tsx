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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Check, ClipboardList, Loader2, Tag } from "lucide-react";

// === PERBAIKAN 1: SCHEMA ===
// Hapus .default(true) agar tipe datanya menjadi strict boolean
const noteCategorySchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  isActive: z.boolean(),
});

export type NoteCategoryFormValues = z.infer<typeof noteCategorySchema>;

export default function NoteCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  // Kita buat partial di sini jaga-jaga jika data dari API ada yg kosong
  initialData?: Partial<NoteCategoryFormValues>;
  onSubmit: (data: NoteCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // === PERBAIKAN 2: DEFAULT VALUES ===
  // Kita set default value di sini secara manual
  const form = useForm<NoteCategoryFormValues>({
    resolver: zodResolver(noteCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      // Jika initialData ada isinya pakai itu, jika tidak ada/undefined pakai true
      isActive: initialData?.isActive ?? true,
    },
  });

  // Reset form saat initialData berubah
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: NoteCategoryFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full relative shadow-sm border-t-4 border-t-blue-600">
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
            <div className="grid grid-cols-1 gap-6">
              {/* === Name === */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Category Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Shipping Info, Payment Terms"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === isActive === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg bg-gray-50/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-0.5 cursor-pointer">
                      <FormLabel className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Active Status
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        If unchecked, this category won't appear in invoice
                        selection.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
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
