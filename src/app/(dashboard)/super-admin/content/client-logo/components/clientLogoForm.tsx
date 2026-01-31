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
  Check,
  ClipboardList,
  Globe,
  ImageIcon,
  LayoutTemplate,
  ListOrdered,
  Loader2,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

// === SCHEMA ===
const clientLogoSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  altText: z.string().optional(),
  websiteUrl: z.string().optional(),

  // Image validation handled manually via file state
  image: z.any().optional(),

  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type ClientLogoFormValues = z.infer<typeof clientLogoSchema>;

interface ClientLogoFormProps {
  initialData?: any; // Data dari DB saat Edit Mode
  onSubmit: (data: ClientLogoFormValues, file?: File) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export default function ClientLogoForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: ClientLogoFormProps) {
  // === STATE FOR PREVIEW & FILE ===
  const [preview, setPreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const form = useForm<ClientLogoFormValues>({
    resolver: zodResolver(clientLogoSchema) as Resolver<ClientLogoFormValues>,
    defaultValues: {
      name: "",
      altText: "",
      websiteUrl: "",
      displayOrder: 0,
      isActive: true,
    },
    mode: "onBlur",
  });

  // === POPULATE INITIAL DATA (EDIT MODE) ===
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        altText: initialData.altText || "",
        websiteUrl: initialData.websiteUrl || "",
        displayOrder: initialData.displayOrder || 0,
        isActive: initialData.isActive,
      });

      if (initialData.imageUrl) {
        setPreview(initialData.imageUrl);
      }
    }
  }, [initialData, form]);

  // === HANDLE FILE CHANGE ===
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: any) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      fieldChange(e.target.files);

      // Create Preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = (values: ClientLogoFormValues) => {
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
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        Client Logo {initialData ? "(Optional)" : "(Required)"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          {/* Input File */}
                          <div className="flex-1 w-full space-y-3">
                            <Input
                              type="file"
                              accept="image/*"
                              disabled={isLoading || isSubmitting}
                              onChange={(e) =>
                                handleFileChange(e, field.onChange)
                              }
                              required={!initialData} // Wajib jika Add New
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Recommended: PNG with transparent background. Max
                              2MB.
                            </p>
                          </div>

                          {/* Preview Box */}
                          <div className="relative w-32 h-32 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-border flex items-center justify-center">
                            {preview ? (
                              <Image
                                src={preview}
                                alt="Logo Preview"
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No Image
                              </span>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Client Name === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Client / Partner Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: PT. Pertamina (Persero)"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Website URL === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Website URL (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: https://partner-site.com"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
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
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Lower numbers appear first (0, 1, 2...).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Alt Text === */}
              <div className="col-span-1 md:col-span-2">
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
                          placeholder="Description for accessibility..."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Active Status === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full bg-white">
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
                          Set as Active
                        </FormLabel>
                        <FormDescription>
                          Uncheck to hide this logo from the website.
                        </FormDescription>
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
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Client Logo" : "Save Client Logo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
