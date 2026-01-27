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
import { useForm } from "react-hook-form";
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
} from "lucide-react";
import Image from "next/image";

const heroSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  altText: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),

  image: z.any().optional(),

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
  initialData?: HeroFormValues & { imageUrl?: string };
  onSubmit: (data: HeroFormValues, file?: File) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
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

  // Handle File Change untuk Preview
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: any) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      fieldChange(e.target.files);

      // Buat Preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  // Reset form when initialData loads
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
      if (initialData.imageUrl) {
        setPreview(initialData.imageUrl);
      }
    }
  }, [initialData, form]);

  const handleSubmit = (values: HeroFormValues) => {
    onSubmit(values, selectedFile);
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
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Hero Image {initialData ? "(Optional)" : "(Required)"}
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={isLoading || isSubmitting}
                            onChange={(e) =>
                              handleFileChange(e, field.onChange)
                            }
                            // Required hanya jika Create mode (tidak ada initialData)
                            required={!initialData}
                          />

                          {/* Image Preview Area */}
                          {preview ? (
                            <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden border border-border">
                              <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-48 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25">
                              <p className="text-sm text-muted-foreground">
                                No image selected
                              </p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
