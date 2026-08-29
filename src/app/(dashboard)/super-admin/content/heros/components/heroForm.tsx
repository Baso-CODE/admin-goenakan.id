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
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import {
  Check,
  ClipboardList,
  ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Link as LinkIcon,
  ListOrdered,
  Loader2,
  Type,
  X,
} from "lucide-react";
import Image from "next/image";

// 1. Update Schema Zod
const heroSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  altText: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),

  imageDesktop: z.any().optional(),
  imageMobile: z.any().optional(),
  imageTablet: z.any().optional(),

  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type HeroFormValues = z.infer<typeof heroSchema>;

export default function HeroForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  // Update tipe data initialData untuk mengakomodasi gambar baru
  initialData?: HeroFormValues & {
    imageUrl?: string;
    imageMobileUrl?: string;
    imageTabletUrl?: string | null;
  };
  onSubmit: (
    data: HeroFormValues,
    files: { desktop?: File; mobile?: File; tablet?: File },
  ) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // 2. State untuk Preview Gambar
  const [previewDesktop, setPreviewDesktop] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [previewMobile, setPreviewMobile] = useState<string | null>(
    initialData?.imageMobileUrl || null,
  );
  const [previewTablet, setPreviewTablet] = useState<string | null>(
    initialData?.imageTabletUrl || null,
  );

  // 3. State untuk File yang diunggah
  const [selectedDesktop, setSelectedDesktop] = useState<File | undefined>();
  const [selectedMobile, setSelectedMobile] = useState<File | undefined>();
  const [selectedTablet, setSelectedTablet] = useState<File | undefined>();

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema) as Resolver<HeroFormValues>,
    defaultValues: initialData ?? {
      title: "",
      altText: "",
      ctaText: "",
      ctaLink: "",
      displayOrder: 0,
      isActive: true,
    },
    mode: "onBlur",
  });

  // 4. Handler File Change Dinamis
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "mobile" | "tablet",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (type === "desktop") {
        setSelectedDesktop(file);
        setPreviewDesktop(objectUrl);
      } else if (type === "mobile") {
        setSelectedMobile(file);
        setPreviewMobile(objectUrl);
      } else if (type === "tablet") {
        setSelectedTablet(file);
        setPreviewTablet(objectUrl);
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        altText: initialData.altText || "",
        ctaText: initialData.ctaText || "",
        ctaLink: initialData.ctaLink || "",
        displayOrder: initialData.displayOrder,
        isActive: initialData.isActive,
      });
      if (initialData.imageUrl) setPreviewDesktop(initialData.imageUrl);
      if (initialData.imageMobileUrl)
        setPreviewMobile(initialData.imageMobileUrl);
      if (initialData.imageTabletUrl)
        setPreviewTablet(initialData.imageTabletUrl);
    }
  }, [initialData, form]);

  const handleSubmit = (values: HeroFormValues) => {
    onSubmit(values, {
      desktop: selectedDesktop,
      mobile: selectedMobile,
      tablet: selectedTablet,
    });
  };

  const handleRemoveFile = (type: "desktop" | "mobile" | "tablet") => {
    if (type === "desktop") {
      setSelectedDesktop(undefined);
      setPreviewDesktop(null);
    } else if (type === "mobile") {
      setSelectedMobile(undefined);
      setPreviewMobile(null);
    } else if (type === "tablet") {
      setSelectedTablet(undefined);
      setPreviewTablet(null);
    }
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
              {/* === IMAGE UPLOAD SECTION === */}

              {/* Desktop Image */}
              <div className="col-span-2">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Desktop Hero Image{" "}
                    {initialData ? "(Optional)" : "(Required)"}
                  </FormLabel>
                  <FormControl>
                    {previewDesktop ? (
                      <div className="relative w-full h-48 md:h-64 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
                        <Image
                          src={previewDesktop}
                          alt="Preview Desktop"
                          fill
                          className="object-cover bg-white"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("desktop")}
                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 md:h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 hover:border-primary transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <ImagePlus className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="mb-1 text-sm text-gray-600">
                            <span className="font-semibold text-primary">
                              Klik untuk unggah
                            </span>{" "}
                            gambar Desktop
                          </p>
                          <p className="text-xs text-gray-400">
                            SVG, PNG, JPG atau WEBP (Horizontal)
                          </p>
                        </div>
                        <Input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isLoading || isSubmitting}
                          onChange={(e) => handleFileChange(e, "desktop")}
                        />
                      </label>
                    )}
                  </FormControl>
                </FormItem>
              </div>

              {/* Mobile Image */}
              <div className="col-span-2 md:col-span-1">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Mobile Image {initialData ? "(Optional)" : "(Required)"}
                  </FormLabel>
                  <FormControl>
                    {previewMobile ? (
                      <div className="relative w-full h-64 rounded-xl border border-gray-200 overflow-hidden group shadow-sm aspect-9/16 mx-auto md:mx-0 max-w-662.5">
                        <Image
                          src={previewMobile}
                          alt="Preview Mobile"
                          fill
                          className="object-cover bg-white"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("mobile")}
                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 hover:border-primary transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <ImagePlus className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="mb-1 text-sm text-gray-600">
                            <span className="font-semibold text-primary">
                              Unggah
                            </span>{" "}
                            Mobile
                          </p>
                          <p className="text-xs text-gray-400">
                            Rasio 9:16 (Vertikal)
                          </p>
                        </div>
                        <Input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isLoading || isSubmitting}
                          onChange={(e) => handleFileChange(e, "mobile")}
                        />
                      </label>
                    )}
                  </FormControl>
                </FormItem>
              </div>

              {/* Tablet Image */}
              <div className="col-span-2 md:col-span-1">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Tablet Image (Optional)
                  </FormLabel>
                  <FormControl>
                    {previewTablet ? (
                      <div className="relative w-full h-64 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
                        <Image
                          src={previewTablet}
                          alt="Preview Tablet"
                          fill
                          className="object-cover bg-white"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("tablet")}
                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 hover:border-primary transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <ImagePlus className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="mb-1 text-sm text-gray-600">
                            <span className="font-semibold text-primary">
                              Unggah
                            </span>{" "}
                            Tablet
                          </p>
                          <p className="text-xs text-gray-400">
                            Opsional (Rasio Persegi/Landscape)
                          </p>
                        </div>
                        <Input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isLoading || isSubmitting}
                          onChange={(e) => handleFileChange(e, "tablet")}
                        />
                      </label>
                    )}
                  </FormControl>
                </FormItem>
              </div>

              {/* === Title === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Headline Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Where Ideas Become Reality"
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

              {/* === Alt Text === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="altText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                        Alt Text (SEO)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Describe the image for SEO..."
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

              {/* === CTA Text === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Button Text
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Shop Now"
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

              {/* === CTA Link === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        Button Link
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: /products/custom"
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
              <div className="col-span-2 md:col-span-1">
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
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lower number appears first.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Active Status === */}
              <div className="col-span-2 md:col-span-1 flex items-center pt-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer m-0">
                          <Check className="h-4 w-4 text-muted-foreground" />
                          Active Status
                        </FormLabel>
                      </div>
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
                {initialData ? "Update Slide" : "Save Slide"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
