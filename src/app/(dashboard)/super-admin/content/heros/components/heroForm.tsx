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
  LayoutTemplate,
  Link as LinkIcon,
  ListOrdered,
  Loader2,
  Type,
  UploadCloud,
} from "lucide-react";

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
  const [previewDesktop, setPreviewDesktop] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [previewMobile, setPreviewMobile] = useState<string | null>(
    initialData?.imageMobileUrl || null,
  );
  const [previewTablet, setPreviewTablet] = useState<string | null>(
    initialData?.imageTabletUrl || null,
  );

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

  const { isSubmitting: formIsSubmitting } = form.formState;
  const isCurrentlySubmitting = isLoading || isSubmitting || formIsSubmitting;

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
    return onSubmit(values, {
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
      {isCurrentlySubmitting && (
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
              {/* === Desktop Image === */}
              <div className="col-span-2">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Desktop Hero Image{" "}
                    {initialData ? "(Optional)" : "(Required)"}
                  </FormLabel>
                  <FormControl>
                    <label className="relative w-full h-48 md:h-64 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden group block">
                      {previewDesktop ? (
                        <>
                          <img
                            src={previewDesktop}
                            alt="Preview Desktop"
                            className="w-full h-full object-contain p-2"
                          />
                          {/*  Efek Hover "Change Image" yang baru */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                              <UploadCloud className="h-5 w-5" /> Change Image
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 p-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-200">
                            <UploadCloud className="h-6 w-6 text-stone-400" />
                          </div>
                          <div className="text-sm font-medium text-stone-700">
                            Klik untuk unggah gambar Desktop
                          </div>
                          <p className="text-xs text-stone-500">
                            SVG, PNG, JPG atau WEBP (Landscape direkomendasikan)
                          </p>
                        </div>
                      )}
                      <Input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={isCurrentlySubmitting}
                        onChange={(e) => handleFileChange(e, "desktop")}
                      />
                    </label>
                  </FormControl>
                </FormItem>
              </div>

              {/* === Mobile Image === */}
              <div className="col-span-2 md:col-span-1">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Mobile Image {initialData ? "(Optional)" : "(Required)"}
                  </FormLabel>
                  <FormControl>
                    <label className="relative w-full h-64 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden group block">
                      {previewMobile ? (
                        <>
                          <img
                            src={previewMobile}
                            alt="Preview Mobile"
                            className="w-full h-full object-contain p-2"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                              <UploadCloud className="h-5 w-5" /> Change Image
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 p-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-200">
                            <UploadCloud className="h-6 w-6 text-stone-400" />
                          </div>
                          <div className="text-sm font-medium text-stone-700">
                            Klik untuk unggah gambar Mobile
                          </div>
                          <p className="text-xs text-stone-500">
                            Rasio 9:16 (Vertikal direkomendasikan)
                          </p>
                        </div>
                      )}
                      <Input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={isCurrentlySubmitting}
                        onChange={(e) => handleFileChange(e, "mobile")}
                      />
                    </label>
                  </FormControl>
                </FormItem>
              </div>

              {/* === Tablet Image === */}
              <div className="col-span-2 md:col-span-1">
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Tablet Image (Optional)
                  </FormLabel>
                  <FormControl>
                    <label className="relative w-full h-64 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden group block">
                      {previewTablet ? (
                        <>
                          <img
                            src={previewTablet}
                            alt="Preview Tablet"
                            className="w-full h-full object-contain p-2"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                              <UploadCloud className="h-5 w-5" /> Change Image
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 p-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-200">
                            <UploadCloud className="h-6 w-6 text-stone-400" />
                          </div>
                          <div className="text-sm font-medium text-stone-700">
                            Klik untuk unggah gambar Tablet
                          </div>
                          <p className="text-xs text-stone-500">
                            Opsional (Rasio Persegi/Landscape)
                          </p>
                        </div>
                      )}
                      <Input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={isCurrentlySubmitting}
                        onChange={(e) => handleFileChange(e, "tablet")}
                      />
                    </label>
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
                          disabled={isCurrentlySubmitting}
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
                          disabled={isCurrentlySubmitting}
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
                          disabled={isCurrentlySubmitting}
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
                          disabled={isCurrentlySubmitting}
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
                          disabled={isCurrentlySubmitting}
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
                          disabled={isCurrentlySubmitting}
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
                disabled={isCurrentlySubmitting}>
                {isCurrentlySubmitting ? (
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
