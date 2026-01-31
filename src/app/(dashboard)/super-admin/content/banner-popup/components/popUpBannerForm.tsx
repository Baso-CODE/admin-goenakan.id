"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarClock,
  CalendarIcon,
  Check,
  ClipboardList,
  Laptop,
  LayoutTemplate,
  Link as LinkIcon,
  Loader2,
  Smartphone,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

// === SCHEMA ===
const popupBannerSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  altText: z.string().optional(),
  linkUrl: z.string().optional(),

  desktopImage: z.any().optional(),
  mobileImage: z.any().optional(),

  startDate: z.string().optional(),
  endDate: z.string().optional(),

  isActive: z.boolean().default(true),
});

export type PopupBannerFormValues = z.infer<typeof popupBannerSchema>;

const formatDateForInput = (dateString?: string | Date | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
};

interface PopupBannerFormProps {
  initialData?: any;
  onSubmit: (
    data: PopupBannerFormValues,
    files: { desktop?: File; mobile?: File },
  ) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export default function PopupBannerForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: PopupBannerFormProps) {
  // === STATE FOR PREVIEWS & FILES ===
  const [desktopPreview, setDesktopPreview] = useState<string | null>(
    initialData?.desktopImageUrl || null,
  );
  const [mobilePreview, setMobilePreview] = useState<string | null>(
    initialData?.mobileImageUrl || null,
  );

  const [selectedFiles, setSelectedFiles] = useState<{
    desktop?: File;
    mobile?: File;
  }>({});

  const form = useForm<PopupBannerFormValues>({
    resolver: zodResolver(popupBannerSchema) as Resolver<PopupBannerFormValues>,
    defaultValues: {
      title: "",
      altText: "",
      linkUrl: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
    mode: "onBlur",
  });

  // === POPULATE INITIAL DATA ===
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        altText: initialData.altText || "",
        linkUrl: initialData.linkUrl || "",
        isActive: initialData.isActive,
        startDate: formatDateForInput(initialData.startDate),
        endDate: formatDateForInput(initialData.endDate),
      });

      if (initialData.desktopImageUrl)
        setDesktopPreview(initialData.desktopImageUrl);
      if (initialData.mobileImageUrl)
        setMobilePreview(initialData.mobileImageUrl);
    }
  }, [initialData, form]);

  // === HANDLE FILE CHANGE ===
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "mobile",
    fieldChange: (value: any) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Simpan File ke State Local
      setSelectedFiles((prev) => ({ ...prev, [type]: file }));

      // 2. Update Form State (agar validasi berjalan)
      fieldChange(e.target.files);

      // 3. Buat Preview URL
      const objectUrl = URL.createObjectURL(file);
      if (type === "desktop") setDesktopPreview(objectUrl);
      else setMobilePreview(objectUrl);
    }
  };

  const handleSubmit = (values: PopupBannerFormValues) => {
    onSubmit(values, selectedFiles);
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
            {/* === IMAGES SECTION (GRID) === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. DESKTOP IMAGE */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="desktopImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-blue-600" />
                        Desktop Image{" "}
                        {initialData ? "(Optional)" : "(Required)"}
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={isLoading || isSubmitting}
                            onChange={(e) =>
                              handleFileChange(e, "desktop", field.onChange)
                            }
                            // Required hanya jika Create mode
                            required={!initialData}
                          />
                          {desktopPreview ? (
                            <div className="relative w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-border">
                              <Image
                                src={desktopPreview}
                                alt="Desktop Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-32 bg-muted/50 rounded-lg border border-dashed text-xs text-muted-foreground">
                              Desktop (Landscape)
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 2. MOBILE IMAGE */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="mobileImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        Mobile Image {initialData ? "(Optional)" : "(Required)"}
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={isLoading || isSubmitting}
                            onChange={(e) =>
                              handleFileChange(e, "mobile", field.onChange)
                            }
                            required={!initialData}
                          />
                          {mobilePreview ? (
                            <div className="relative w-24 mx-auto h-32 bg-slate-100 rounded-lg overflow-hidden border border-border">
                              <Image
                                src={mobilePreview}
                                alt="Mobile Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-32 bg-muted/50 rounded-lg border border-dashed text-xs text-muted-foreground">
                              Mobile (Portrait)
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Campaign Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Promo Lebaran 2026"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Link URL */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        Target URL (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: https://goenakan.id/promo"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Alt Text */}
              <div className="col-span-1">
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
                          placeholder="Image description..."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === SCHEDULING SECTION === */}
              <div className="col-span-1 md:col-span-2">
                <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" /> Schedule (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* === START DATE === */}
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-xs">Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  disabled={isLoading || isSubmitting}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}>
                                  {field.value ? (
                                    // PERBAIKAN DI SINI: Gunakan fungsi format()
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  field.onChange(
                                    date ? date.toISOString() : "",
                                  );
                                }}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* === END DATE === */}
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-xs">End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  disabled={isLoading || isSubmitting}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}>
                                  {field.value ? (
                                    // PERBAIKAN DI SINI JUGA
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  field.onChange(
                                    date ? date.toISOString() : "",
                                  );
                                }}
                                disabled={(date) =>
                                  form.getValues("startDate")
                                    ? date <
                                      new Date(form.getValues("startDate")!)
                                    : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* === ACTIVE STATUS === */}
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
                          Set as Active Banner
                        </FormLabel>
                        <FormDescription>
                          If unchecked, the banner will not show up on the
                          website.
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
                {initialData ? "Update Banner" : "Create Banner"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
