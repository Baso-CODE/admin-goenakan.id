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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  Briefcase,
  Calendar,
  ClipboardList,
  ImageIcon,
  ListOrdered,
  Loader2,
  ShoppingCart,
  Tag,
  Type,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

const portfolioSchema = z.object({
  title_id: z.string().min(2, "Judul portofolio (ID) minimal 2 karakter"),
  title_en: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image: z.any().optional(),
  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),

  orderQuantity: z.coerce.number().min(0).default(0),
  projectDate: z.string().optional(),
  eventCategoryId: z.string().optional(),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
  initialData?: any;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export default function PortfolioForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: PortfolioFormProps) {
  const { fetchApi } = useApi();

  console.log("ini adlah inital data", initialData);

  // Sesuaikan tipe categories agar mengenali title_id atau title jika ada
  const [categories, setCategories] = useState<
    { id: string; title?: string; title_id?: string }[]
  >([]);

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema) as Resolver<PortfolioFormValues>,
    defaultValues: {
      title_id: "",
      title_en: "",
      clientName: "",
      description: "",
      description_en: "",
      displayOrder: 0,
      isActive: true,
      orderQuantity: 0,
      projectDate: "",
      eventCategoryId: "none",
    },
  });

  // 1. Fetch Category List
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchApi("/event-categories/list");
        const json = await res.json();
        if (json.success) setCategories(json.data);
      } catch (error) {
        console.error("Gagal memuat kategori event", error);
      }
    };
    loadCategories();
  }, [fetchApi]);

  // 2.  Gabungkan initialData & categories agar form reset terpanggil setelah kategori siap
  useEffect(() => {
    if (initialData) {
      const formattedDate = initialData.projectDate
        ? new Date(initialData.projectDate).toISOString().split("T")[0]
        : "";

      const extractedCategoryId =
        initialData.eventCategoryId || initialData.eventCategory?.id || "none";

      form.reset({
        title_id: initialData.title_id || initialData.title || "",
        title_en: initialData.title_en || "",
        clientName: initialData.clientName || "",
        description: initialData.description || "",
        description_en: initialData.description_en || "",
        displayOrder: initialData.displayOrder || 0,
        isActive: initialData.isActive ?? true,
        orderQuantity: initialData.orderQuantity || 0,
        projectDate: formattedDate,
        eventCategoryId: extractedCategoryId,
      });

      if (initialData.image) {
        setPreview(initialData.image);
      }
    }
  }, [initialData, categories, form]); // 👈 categories dimasukkan ke dependency array di sini

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

  const handleSubmit = (values: PortfolioFormValues) => {
    const formData = new FormData();

    formData.append("title_id", values.title_id);
    if (values.title_en) formData.append("title_en", values.title_en);

    formData.append("clientName", values.clientName);
    formData.append("displayOrder", String(values.displayOrder));
    formData.append("isActive", String(values.isActive));
    formData.append("orderQuantity", String(values.orderQuantity));

    if (values.description) formData.append("description", values.description);
    if (values.description_en)
      formData.append("description_en", values.description_en);
    if (values.projectDate) formData.append("projectDate", values.projectDate);

    if (values.eventCategoryId && values.eventCategoryId !== "none") {
      formData.append("eventCategoryId", values.eventCategoryId);
    }

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
                        Project Image {initialData ? "(Optional)" : "*"}
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
                                PNG, JPG up to 5MB. High quality recommended.
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
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Project Title (ID) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="cth. GIFT SET"
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
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Project Title (EN) (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="e.g. GIFT SET"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Client Name === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Client / Partner Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="e.g. Golden Tulip Bali"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Event Category Dropdown === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="eventCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Event Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-white">
                            <SelectValue placeholder="Pilih kategori event..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="none"
                            className="text-muted-foreground italic">
                            -- Tidak ada kategori --
                          </SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.title_id || cat.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        Kategori tempat portofolio ini akan muncul.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Order Quantity === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="orderQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Items Ordered
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-10"
                          placeholder="e.g. 500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Project Date === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="projectDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Project Date (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="h-10" {...field} />
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

              {/* === Description (Bahasa Indonesia) === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlignLeft className="h-4 w-4 text-muted-foreground" />
                        Short Description (ID)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="Detail singkat..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Description (Bahasa Inggris) === */}
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlignLeft className="h-4 w-4 text-muted-foreground" />
                        Short Description (EN) (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="Brief details..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                {initialData ? "Update Portfolio" : "Save Portfolio"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
