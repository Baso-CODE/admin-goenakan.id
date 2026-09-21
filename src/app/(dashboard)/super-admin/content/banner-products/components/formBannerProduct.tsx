"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ImageCropper } from "@/helper/image-cropper";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  Check,
  ClipboardList,
  Image as ImageIcon,
  Link as LinkIcon,
  ListOrdered,
  Loader2,
  Type,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

// === SCHEMA ===
const bannerProductSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  linkUrl: z.string().optional(),
  image: z.any().optional(), // File upload
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export type BannerProductFormValues = z.infer<typeof bannerProductSchema>;

interface BannerProductFormProps {
  initialData?: any;
  onSubmit: (data: BannerProductFormValues, file?: File) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export default function BannerProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: BannerProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const form = useForm<BannerProductFormValues>({
    resolver: zodResolver(
      bannerProductSchema,
    ) as Resolver<BannerProductFormValues>,
    defaultValues: {
      title: "",
      subtitle: "",
      linkUrl: "",
      sortOrder: 0,
      isActive: true,
    },
    mode: "onBlur",
  });

  // === POPULATE INITIAL DATA ===
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        subtitle: initialData.subtitle || "",
        linkUrl: initialData.linkUrl || "",
        sortOrder: initialData.sortOrder || 0,
        isActive: initialData.isActive,
      });

      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    }
  }, [initialData, form]);

  // ✨ HANDLE FILE CHANGE (Disesuaikan untuk menerima File langsung dari Cropper)
  const handleFileChange = (file: File, fieldChange: (value: any) => void) => {
    setSelectedFile(file);
    fieldChange(file); // Update state react-hook-form
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleSubmit = (values: BannerProductFormValues) => {
    onSubmit(values, selectedFile);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-stone-600" />
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ========================================================
              KOLOM KIRI: MAIN INFORMATION (2/3 Lebar Layar)
          ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4 border-b border-stone-100">
                <CardTitle className="text-lg font-medium text-stone-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-stone-500" />
                  Banner Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-600 mb-2 block font-semibold">
                        Upload Image {initialData ? "(Optional)" : "(Required)"}
                      </FormLabel>
                      <FormControl>
                        {/* ✨ ImageCropper dengan rasio 1920:820 */}
                        <ImageCropper
                          aspectRatio={1920 / 820}
                          disabled={isLoading || isSubmitting}
                          onCropComplete={(file) =>
                            handleFileChange(file, field.onChange)
                          }>
                          {/* Wadah visual menjadi div biasa (karena klik sudah ditangani ImageCropper) */}
                          <div className="relative w-full aspect-21/9 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors flex flex-col items-center justify-center overflow-hidden group shadow-sm">
                            {imagePreview ? (
                              // === TAMPILAN PREVIEW BANNER DENGAN EFEK HOVER CHANGE IMAGE ===
                              <>
                                <Image
                                  src={imagePreview}
                                  alt="Banner Preview"
                                  fill
                                  className="object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <p className="text-white font-medium flex items-center gap-2">
                                    <UploadCloud className="h-5 w-5" /> Change
                                    Image
                                  </p>
                                </div>
                              </>
                            ) : (
                              // === AREA UPLOAD BANNER KOSONG ===
                              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-200 mb-3">
                                  <UploadCloud className="h-6 w-6 text-stone-400" />
                                </div>
                                <p className="mb-1 text-sm text-stone-600">
                                  <span className="font-semibold text-stone-800">
                                    Klik untuk unggah
                                  </span>{" "}
                                  Banner
                                </p>
                                <p className="text-xs text-stone-500">
                                  Otomatis potong ke format Landscape (1920x820)
                                </p>
                              </div>
                            )}
                          </div>
                        </ImageCropper>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4 border-b border-stone-100">
                <CardTitle className="text-lg font-medium text-stone-800 flex items-center gap-2">
                  <Type className="h-5 w-5 text-stone-500" />
                  Banner Content
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-600">
                        Title (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Summer Collection 2026"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subtitle */}
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-stone-600">
                        <AlignLeft className="h-4 w-4" /> Subtitle (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Get up to 50% off on all items"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target URL */}
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-stone-600">
                        <LinkIcon className="h-4 w-4" /> Target URL (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: /products/category/summer"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Where should the user go when they click this banner?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* ========================================================
              KOLOM KANAN: SETTINGS & ACTIONS (1/3 Lebar Layar)
          ======================================================== */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-4 border-b border-stone-100 bg-stone-50/50">
                <CardTitle className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Sort Order */}
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-stone-600">
                        <ListOrdered className="h-4 w-4" /> Display Order
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lower numbers appear first (e.g. 0, 1, 2).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Active Status */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 p-4 border border-stone-200 rounded-lg bg-white shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1.5 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                          <Check className="h-4 w-4 text-emerald-600" />
                          Publish Banner
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Uncheck to save as draft and hide from public view.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-transparent border-none shadow-none">
              <CardContent className="p-0">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white cursor-pointer shadow-md transition-all"
                  disabled={isLoading || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <ClipboardList className="h-5 w-5 mr-2" />
                  )}
                  {initialData ? "Save Changes" : "Create Banner"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
