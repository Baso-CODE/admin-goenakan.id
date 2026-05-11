"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  Check,
  FileImage,
  Loader2,
  Save,
  Search,
  Smartphone,
  TagIcon,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { FormSeo } from "./formArticleSEO";
import { ImagePreviewModal } from "./imagePreviewModal";
import { SEOAnalyzer } from "./seoAnalyzer";

// ✨ 1. PERBARUI SCHEMA ZOD
const articleSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  authorName: z.string().min(2, "Nama penulis wajib diisi"), // Tambahan
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  content: z.string().min(20, "Konten artikel terlalu pendek"),
  source: z.string().optional(),
  published: z.boolean().default(false),
  productIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  coverImageAlt: z.string().optional(),
  focusKeywords: z.string().optional().default(""),
  seo: z
    .object({
      metaTitle: z.string().max(255, "Maksimal 255 karakter").optional(),
      metaDescription: z.string().optional(),
      keywords: z.string().optional(),
      canonicalUrl: z.string().max(255, "Maksimal 255 karakter").optional(),
      ogTitle: z.string().max(255, "Maksimal 255 karakter").optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().max(255, "Maksimal 255 karakter").optional(),
      robots: z.string().max(50).optional().default("index, follow"),
      structuredData: z.string().optional(),
    })
    .optional(),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
export interface ArticleInitialData extends ArticleFormValues {
  coverImage?: string;
  coverImageMobile?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    robots?: string;
    structuredData?: string;
  };
}

export default function FormArticle({
  onSubmit,
  isSubmitting,
  initialData,
  isEditing = false,
}: {
  onSubmit: (
    values: any,
    coverFile: File | null,
    coverMobileFile: File | null,
  ) => void; // Update signature onSubmit
  isSubmitting: boolean;
  initialData?: any | null;
  isEditing?: boolean;
}) {
  const { fetchApi, status } = useApi();

  // Data States
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✨ 2. STATE UNTUK DUA GAMBAR
  const [loadingData, setLoadingData] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverMobileFile, setCoverMobileFile] = useState<File | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      authorName: "",
      categoryId: "",
      content: "",
      source: "",
      published: false,
      productIds: [],
      tagIds: [],
      coverImageAlt: "",
      focusKeywords: "",
      seo: {
        metaTitle: "",
        metaDescription: "",
        keywords: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        robots: "index, follow", // Default Prisma
        structuredData: "",
      },
    },
  });

  // Watcher untuk SEO Analyzer
  const watchedTitle = form.watch("title");
  const watchedContent = form.watch("content");
  const watchedKeywords = form.watch("focusKeywords");

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        productIds: initialData.productIds || [],
        tagIds: initialData.tagIds || [],
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;
      try {
        const [catRes, prodRes, tagRes] = await Promise.all([
          fetchApi("/article-categories/list"),
          fetchApi("/products/order"),
          fetchApi("/article-tags/list"),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (prodRes.ok) {
          const p = await prodRes.json();
          setProducts(p.data || p || []);
        }
        if (tagRes.ok) setAvailableTags(await tagRes.json());
      } catch (error) {
        toast.error("Gagal memuat data pendukung.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [status, fetchApi]);

  const handleSubmit = (values: any) => {
    if (!isEditing && !coverFile) {
      toast.error("Cover image Desktop wajib diunggah!");
      return;
    }
    // Kirim kedua file ke fungsi parent (page.tsx)
    onSubmit(values, coverFile, coverMobileFile);
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* ✨ BUNGKUS DENGAN TABS */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-6 bg-stone-100 p-1">
            <TabsTrigger value="content" className="font-bold px-8">
              KONTEN ARTIKEL
            </TabsTrigger>
            <TabsTrigger value="seo" className="font-bold px-8">
              PENGATURAN SEO
            </TabsTrigger>
          </TabsList>

          {/* === TAB 1: KONTEN UTAMA === */}
          <TabsContent
            value="content"
            className="space-y-8 mt-0 focus-visible:outline-none">
            {/* ✨ SECTION 1: COVER IMAGES (Layout Dirapikan) */}
            <Card className="p-6 border-stone-200 shadow-sm bg-stone-50/30">
              <FormLabel className="text-base font-bold flex items-center gap-2 mb-6">
                <FileImage className="w-5 h-5 text-primary" /> Manajemen Sampul
                Artikel
              </FormLabel>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- UPLOAD DESKTOP --- */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                    <FileImage className="w-4 h-4" /> Cover Desktop (Wajib)
                  </div>
                  <div className="flex justify-center border-2 border-dashed rounded-xl p-2 bg-white min-h-48 items-center relative">
                    {coverFile ? (
                      <div className="relative group w-full h-44 cursor-zoom-in">
                        <img
                          src={URL.createObjectURL(coverFile)}
                          className="w-full h-full object-cover rounded-lg"
                          onClick={() =>
                            handlePreview(URL.createObjectURL(coverFile))
                          }
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                          <ZoomIn className="text-white w-8 h-8" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverFile(null);
                          }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : isEditing && initialData?.coverImage ? (
                      <div
                        className="relative group w-full h-44 cursor-zoom-in"
                        onClick={() => handlePreview(initialData.coverImage)}>
                        <img
                          src={initialData.coverImage}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <ZoomIn className="text-white w-8 h-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-stone-400 p-4">
                        <FileImage className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-xs italic">
                          Belum ada gambar terpilih
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-white cursor-pointer"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                </div>

                {/* --- UPLOAD MOBILE --- */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                    <Smartphone className="w-4 h-4" /> Cover Mobile (Opsional)
                  </div>
                  <div className="flex justify-center border-2 border-dashed rounded-xl p-2 bg-white min-h-48 items-center relative">
                    {coverMobileFile ? (
                      <div className="relative group w-32 h-44 cursor-zoom-in">
                        <img
                          src={URL.createObjectURL(coverMobileFile)}
                          className="w-full h-full object-cover rounded-lg"
                          onClick={() =>
                            handlePreview(URL.createObjectURL(coverMobileFile))
                          }
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                          <ZoomIn className="text-white w-8 h-8" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverMobileFile(null);
                          }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : isEditing && initialData?.coverImageMobile ? (
                      <div
                        className="relative group w-32 h-44 cursor-zoom-in"
                        onClick={() =>
                          handlePreview(initialData.coverImageMobile)
                        }>
                        <img
                          src={initialData.coverImageMobile}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <ZoomIn className="text-white w-8 h-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-stone-400 p-4">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs italic">
                          Disarankan aspek rasio 9:16
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-white cursor-pointer"
                    onChange={(e) =>
                      setCoverMobileFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-200">
                <FormField
                  control={form.control}
                  name="coverImageAlt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Teks Alternatif Gambar (Alt Text - SEO)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Deskripsi singkat gambar untuk dibaca oleh mesin pencari Google..."
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* ✨ SECTION 2: GRID LAYOUT (Kiri: Utama, Kanan: Pengaturan/SEO) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* KOLOM KIRI (AREA UTAMA) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">
                          Judul Artikel
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan judul yang menarik..."
                            className="text-lg py-6 shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-bold">
                          Nama Penulis
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Baso Afriza"
                            className="bg-white shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold flex items-center gap-2">
                        <TagIcon className="w-4 h-4" /> Tags Artikel
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-white min-h-11 h-auto py-2",
                                !field.value?.length && "text-muted-foreground",
                              )}>
                              <div className="flex flex-wrap gap-1">
                                {field.value?.length > 0
                                  ? field.value.map((id: string) => (
                                      <Badge
                                        key={id}
                                        variant="secondary"
                                        className="bg-stone-100 text-stone-700 hover:bg-stone-200">
                                        {
                                          availableTags.find((t) => t.id === id)
                                            ?.name
                                        }
                                      </Badge>
                                    ))
                                  : "Cari & pilih tag artikel..."}
                              </div>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Ketik nama tag..." />
                            <CommandList>
                              <CommandEmpty>Tag tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {availableTags.map((tag) => (
                                  <CommandItem
                                    key={tag.id}
                                    onSelect={() => {
                                      const current = field.value || [];
                                      const next = current.includes(tag.id)
                                        ? current.filter(
                                            (id: string) => id !== tag.id,
                                          )
                                        : [...current, tag.id];
                                      field.onChange(next);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(tag.id)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {tag.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productIds"
                  render={() => (
                    <FormItem className="space-y-3 pt-4">
                      <div className="flex flex-col">
                        <FormLabel className="text-base font-bold">
                          Produk Terkait
                        </FormLabel>
                        <p className="text-[11px] text-muted-foreground">
                          Pilih produk yang akan direkomendasikan di artikel
                          ini.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 border rounded-xl bg-stone-50/30 max-h-64 overflow-y-auto">
                        {products.map((product) => (
                          <FormField
                            key={product.id}
                            control={form.control}
                            name="productIds"
                            render={({ field }) => {
                              const isChecked = field.value?.includes(
                                product.id,
                              );
                              return (
                                <FormItem
                                  key={product.id}
                                  className={cn(
                                    "flex flex-row items-center space-x-3 space-y-0 p-2 rounded-lg border bg-white transition-all hover:bg-stone-50",
                                    isChecked &&
                                      "border-stone-600 bg-stone-50 ring-1 ring-stone-600",
                                  )}>
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              product.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (v: string) => v !== product.id,
                                              ),
                                            )
                                      }
                                    />
                                  </FormControl>
                                  <FormLabel className="text-[11px] font-medium leading-none cursor-pointer flex-1 line-clamp-2">
                                    {product.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* KOLOM KANAN (SIDEBAR PENGATURAN & SEO) */}
              <div className="space-y-6">
                <Card className="p-4 bg-stone-50/50 shadow-sm border-stone-200">
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Kategori</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Pilih Kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                          <FormLabel className="text-sm font-medium">
                            Status Publish
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Referensi/Sumber
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="URL Sumber..."
                              className="bg-white text-xs"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>

                {/* Kotak Khusus Analisis SEO */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="focusKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-blue-600">
                          Target Kata Kunci (SEO)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="sepatu lari, diskon sepatu, ..."
                            className="bg-white border-blue-200"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Gunakan koma (,) untuk memasukkan lebih dari satu kata
                          kunci yang diincar.
                        </p>
                      </FormItem>
                    )}
                  />

                  <SEOAnalyzer
                    title={watchedTitle || ""}
                    content={watchedContent || ""}
                    focusKeywords={watchedKeywords || ""}
                  />
                </div>
              </div>
            </div>

            {/* ✨ SECTION 3: EDITOR */}
            <div className="pt-6 border-t border-stone-200">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-end mb-4">
                      <FormLabel className="text-xl font-bold">
                        Isi Artikel
                      </FormLabel>
                      <span className="text-xs text-muted-foreground italic">
                        Auto-save aktif
                      </span>
                    </div>
                    <FormControl>
                      <div className="w-full border rounded-xl bg-white shadow-sm min-h-125">
                        <SimpleEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* === TAB 2: PENGATURAN SEO === */}
          <TabsContent value="seo" className="mt-0 focus-visible:outline-none">
            <FormSeo control={form.control} />
          </TabsContent>
        </Tabs>

        {/* ✨ SUBMIT BUTTON */}
        <div className="sticky bottom-4 z-20">
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold shadow-xl bg-primary hover:bg-accent text-primary-foreground py-7 text-lg rounded-2xl transition-all active:scale-[0.98]"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-6 w-6" />
                {isEditing ? "Perbarui Artikel" : "Terbitkan Artikel"}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal Preview Gambar */}
      <ImagePreviewModal
        src={previewUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        alt="Preview Sampul Artikel"
      />
    </Form>
  );
}
