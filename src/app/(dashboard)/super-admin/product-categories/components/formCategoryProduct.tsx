"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { ClipboardList, ImageIcon, Loader2, Tag, X } from "lucide-react";
import Image from "next/image";

// === SCHEMA ===
const productCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters." }),
  image: z.any().optional(), // Menampung file gambar
});

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;

export default function ProductCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: any;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({ name: initialData.name });
      if (initialData.image) setPreview(initialData.image);
    }
  }, [initialData, form]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: any,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (values: ProductCategoryFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.image instanceof File) {
      formData.append("image", values.image);
    }
    onSubmit(formData);
  };

  return (
    <Card className="w-full relative">
      {(isLoading || isSubmitting) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* === Category Name === */}
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
                        placeholder="Enter category name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Category Image === */}
              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      Category Image
                    </FormLabel>
                    <div className="space-y-4">
                      {preview && (
                        <div className="relative w-full aspect-video md:w-64 border rounded-lg overflow-hidden bg-stone-100">
                          <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreview(null);
                              form.setValue("image", undefined);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, onChange)}
                          disabled={isLoading || isSubmitting}
                          className="cursor-pointer"
                          {...fieldProps}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
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
