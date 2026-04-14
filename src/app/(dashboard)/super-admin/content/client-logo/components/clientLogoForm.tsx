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
  Flag,
  Globe,
  ImageIcon,
  ListOrdered,
  Loader2,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

// === SCHEMA (Disesuaikan dengan DTO Backend) ===
const clientLogoSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  image: z.any().optional(),
  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type ClientLogoFormValues = z.infer<typeof clientLogoSchema>;

interface ClientLogoFormProps {
  initialData?: any;
  onSubmit: (data: FormData) => void;
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
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const form = useForm<ClientLogoFormValues>({
    resolver: zodResolver(clientLogoSchema) as Resolver<ClientLogoFormValues>,
    defaultValues: {
      name: "",
      country: "",
      websiteUrl: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  // === POPULATE INITIAL DATA (EDIT MODE) ===
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        country: initialData.country || "",
        websiteUrl: initialData.websiteUrl || "",
        displayOrder: initialData.displayOrder || 0,
        isActive: initialData.isActive ?? true,
      });

      if (initialData.logo) {
        setPreview(initialData.logo);
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
      fieldChange(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = (values: ClientLogoFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("country", values.country);
    if (values.websiteUrl) formData.append("websiteUrl", values.websiteUrl);
    formData.append("displayOrder", String(values.displayOrder));
    formData.append("isActive", String(values.isActive));

    if (selectedFile) {
      formData.append("logo", selectedFile);
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
              {/* === IMAGE UPLOAD SECTION === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold">
                        <ImageIcon className="h-4 w-4 text-[#C4A48E]" />
                        Brand Logo {initialData ? "(Optional)" : "(Required) *"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <div className="flex-1 w-full space-y-3">
                            <Input
                              type="file"
                              accept="image/*"
                              disabled={isLoading || isSubmitting}
                              onChange={(e) =>
                                handleFileChange(e, field.onChange)
                              }
                              required={!initialData}
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Recommended: PNG/SVG transparent background. Max
                              2MB.
                            </p>
                          </div>

                          <div className="relative w-32 h-20 shrink-0 bg-stone-50 rounded border border-dashed flex items-center justify-center">
                            {preview ? (
                              <Image
                                src={preview}
                                alt="Logo Preview"
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground uppercase">
                                No Logo
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

              {/* === Brand Name === */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Brand / Company Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yamaha Indonesia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Country (New) === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        Origin Country *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Indonesia" {...field} />
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
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Website URL === */}
              <div className="col-span-1 md:col-span-2">
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
                        <Input placeholder="https://..." {...field} />
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
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg bg-stone-50/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Active Status
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Visible on landing page.
                        </FormDescription>
                      </div>
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
                {initialData ? "Update Brand Client" : "Save Brand Client"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
