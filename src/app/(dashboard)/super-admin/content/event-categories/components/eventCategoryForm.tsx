"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList,
  ImageIcon,
  ListOrdered,
  Loader2,
  ShoppingCart,
  Tag,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

const eventCategorySchema = z.object({
  title_id: z.string().min(2, "Judul kategori (ID) minimal 2 karakter"),
  title_en: z.string().optional(),
  image: z.any().optional(),
  displayOrder: z.coerce.number().min(0).default(0),
  orderCount: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type EventCategoryFormValues = z.infer<typeof eventCategorySchema>;

interface EventCategoryFormProps {
  initialData?: any;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export default function EventCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: EventCategoryFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventCategoryFormValues>({
    resolver: zodResolver(
      eventCategorySchema,
    ) as Resolver<EventCategoryFormValues>,
    defaultValues: {
      title_id: "",
      title_en: "",
      displayOrder: 0,
      orderCount: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title_id: initialData.title_id || initialData.title || "",
        title_en: initialData.title_en || "",
        displayOrder: initialData.displayOrder || 0,
        orderCount: initialData.orderCount || 0,
        isActive: initialData.isActive ?? true,
      });

      if (initialData.image) {
        setPreview(initialData.image);
      }
    }
  }, [initialData, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: any) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      fieldChange(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = (values: EventCategoryFormValues) => {
    const formData = new FormData();

    formData.append("title_id", values.title_id);
    if (values.title_en) {
      formData.append("title_en", values.title_en);
    }

    formData.append("displayOrder", String(values.displayOrder));
    formData.append("orderCount", String(values.orderCount));
    formData.append("isActive", String(values.isActive));

    if (selectedFile) {
      formData.append("image", selectedFile);
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
            className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* === MODERN IMAGE UPLOAD SECTION === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold">
                        <ImageIcon className="h-4 w-4 text-[#C4A48E]" />
                        Category Image {initialData ? "(Optional)" : "*"}
                      </FormLabel>
                      <FormControl>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden group">
                          {preview ? (
                            <>
                              <Image
                                src={preview}
                                alt="Preview"
                                fill
                                // ✨ PERUBAHAN: Menggunakan object-contain agar rasio portrait/landscape asli terjaga
                                className="object-contain p-2"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium flex items-center gap-2">
                                  <UploadCloud className="h-5 w-5" /> Change
                                  Image
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center space-y-2 p-4">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border">
                                <UploadCloud className="h-6 w-6 text-stone-400" />
                              </div>
                              <div className="text-sm font-medium text-stone-700">
                                Click to upload image
                              </div>
                              <p className="text-xs text-stone-500">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          )}
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isLoading || isSubmitting}
                            onChange={(e) =>
                              handleFileChange(e, field.onChange)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Title (Bahasa Indonesia) === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="title_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Category Title (ID) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cth. Pernikahan, Perusahaan..."
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Title (Bahasa Inggris) === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Category Title (EN) (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Wedding, Corporate..."
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Order Count === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="orderCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Ordered Times
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Shown as "ordered X times" on website.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Display Order === */}
              <div className="col-span-1">
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
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Active Status === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 opacity-0 select-none pointer-events-none">
                        <ListOrdered className="h-4 w-4" />
                        Status
                      </FormLabel>

                      <div
                        className="flex flex-row items-center gap-3 px-3 h-10 border rounded-md bg-stone-50 hover:bg-stone-100 transition-colors shadow-sm cursor-pointer"
                        onClick={() => field.onChange(!field.value)}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="pointer-events-none"
                          />
                        </FormControl>
                        <span className="text-sm font-medium cursor-pointer text-stone-700">
                          Active Status
                        </span>
                      </div>

                      <FormDescription className="text-[10px]">
                        Visible on the website.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isSubmitting}>
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
