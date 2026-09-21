"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Activity, AlignLeft, ClipboardList, Loader2, Tag } from "lucide-react";

const articleCategorySchema = z.object({
  name_id: z.string().min(2, { message: "Nama kategori minimal 2 karakter." }),
  description_id: z.string().optional(),
  name_en: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters." }),
  description_en: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ArticleCategoryFormValues = z.infer<typeof articleCategorySchema>;

export default function ArticleCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: ArticleCategoryFormValues;
  onSubmit: (data: ArticleCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<ArticleCategoryFormValues>({
    resolver: zodResolver(
      articleCategorySchema,
    ) as Resolver<ArticleCategoryFormValues>,
    defaultValues: initialData || {
      name_id: "",
      description_id: "",
      name_en: "",
      description_en: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: ArticleCategoryFormValues) => {
    onSubmit(values);
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
            <div className="grid grid-cols-1 gap-6">
              {/* === Category Name (Bahasa Indonesia) === */}
              <FormField
                control={form.control}
                name="name_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Category Name (Bahasa Indonesia)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Tutorial, Tips & Trik..."
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Description (Bahasa Indonesia) === */}
              <FormField
                control={form.control}
                name="description_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      Description (Bahasa Indonesia)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi singkat mengenai kategori ini (Opsional)"
                        rows={3}
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Category Name (English) === */}
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Category Name (English)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Example: Tutorial, Tips & Tricks..."
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Description (English) === */}
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      Description (English)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short description about this category (Optional)"
                        rows={3}
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Is Active Switch === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        Status Aktif
                      </FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Kategori yang tidak aktif tidak akan muncul di menu
                        pilihan artikel.
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant={"default"}
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
