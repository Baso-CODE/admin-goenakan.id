"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Languages,
  Loader2,
  PackageSearch,
  Plus,
  Save,
  Search,
  Smartphone,
  TagIcon,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import ArticleCategoryForm, {
  ArticleCategoryFormValues,
} from "../categories/components/formArticleCategories";
import ArticleTagForm, {
  ArticleTagFormValues,
} from "../tags/components/formArticleTag";
import { FormSeo } from "./formArticleSEO";
import { ImagePreviewModal } from "./imagePreviewModal";
import { SEOAnalyzer } from "./seoAnalyzer";

// =========================================================================
// 1. UPDATE ZOD SCHEMA
// =========================================================================
const articleSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  title_en: z.string().optional(),
  authorName: z.string().min(2, "Nama penulis wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  content: z.string().min(20, "Konten artikel terlalu pendek"),
  content_en: z.string().optional(),
  autoTranslate: z.boolean().optional(),
  source: z.string().optional(),
  published: z.boolean().default(false),
  productIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  coverImageAlt: z.string().optional(),
  focusKeywords_id: z.string().optional().default(""),
  focusKeywords_en: z.string().optional().default(""),
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
  autoTranslate?: boolean;
  isTranslated?: boolean;
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
  ) => void;
  isSubmitting: boolean;
  initialData?: any | null;
  isEditing?: boolean;
}) {
  const { fetchApi, status } = useApi();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverMobileFile, setCoverMobileFile] = useState<File | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const form = useForm<any>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      title_en: "",
      authorName: "",
      categoryId: "",
      content: "",
      content_en: "",
      autoTranslate: false,
      source: "",
      published: false,
      productIds: [],
      tagIds: [],
      coverImageAlt: "",
      focusKeywords_id: "",
      focusKeywords_en: "",
      seo: {
        metaTitle: "",
        metaDescription: "",
        keywords: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        robots: "index, follow",
        structuredData: "",
      },
    },
  });

  const watchedTitle = form.watch("title");
  const watchedContent = form.watch("content");
  const watchedKeywords = form.watch("focusKeywords_id");

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

        const catData = await catRes.json();
        setCategories(catData.data || []);

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
    onSubmit(values, coverFile, coverMobileFile);
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleAddCategoryFast = async (data: ArticleCategoryFormValues) => {
    if (status !== "authenticated") return;
    setIsSubmittingCategory(true);
    try {
      const res = await fetchApi("/article-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Gagal membuat kategori baru");
      }

      const responseData = await res.json();
      const newCat = responseData.data || responseData;

      setCategories((prev) => [...prev, newCat]);
      form.setValue("categoryId", newCat.id);

      setIsCategoryModalOpen(false);
      toast.success("Kategori berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan kategori.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleAddTagFast = async (data: ArticleTagFormValues) => {
    if (status !== "authenticated") return;
    setIsSubmittingTag(true);
    try {
      const res = await fetchApi("/article-tags", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal membuat tag baru");

      const responseData = await res.json();
      const newTag = responseData.data || responseData;

      setAvailableTags((prev) => [...prev, newTag]);

      const currentSelectedTags = form.getValues("tagIds") || [];
      form.setValue("tagIds", [...currentSelectedTags, newTag.id]);

      // 3. Tutup modal & bersihkan pencarian
      setIsTagModalOpen(false);
      setTagSearchQuery("");
      toast.success("Tag berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan tag.");
    } finally {
      setIsSubmittingTag(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-medium animate-pulse">
          Menyiapkan data kategori, produk, dan tags...
        </p>
      </div>
    );
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-6 bg-stone-100 p-1">
            <TabsTrigger value="content" className="font-bold px-8">
              KONTEN ARTIKEL
            </TabsTrigger>
            <TabsTrigger value="seo" className="font-bold px-8">
              PENGATURAN SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="content"
            className="space-y-8 mt-0 focus-visible:outline-none">
            {/* AREA UPLOAD COVER */}
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-bold flex items-center gap-2">
                          <TagIcon className="w-4 h-4" /> Tags Artikel
                        </FormLabel>
                      </div>

                      <Dialog
                        open={isTagModalOpen}
                        onOpenChange={setIsTagModalOpen}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Tambah Tag Artikel Baru</DialogTitle>
                          </DialogHeader>
                          <ArticleTagForm
                            initialData={{ name: tagSearchQuery }}
                            onSubmit={handleAddTagFast}
                            isSubmitting={isSubmittingTag}
                          />
                        </DialogContent>
                      </Dialog>

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
                            <CommandInput
                              placeholder="Ketik nama tag..."
                              value={tagSearchQuery}
                              onValueChange={setTagSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty className="py-4 flex flex-col items-center justify-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Tag tidak ditemukan.
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => setIsTagModalOpen(true)}>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Buat Tag "{tagSearchQuery}"
                                </Button>
                              </CommandEmpty>

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

                              {availableTags.length > 0 && (
                                <>
                                  <div className="h-1px bg-stone-100 my-1 mx-2" />
                                  <CommandItem
                                    onSelect={() => setIsTagModalOpen(true)}
                                    className="text-blue-600 font-medium justify-center cursor-pointer py-2">
                                    <Plus className="mr-2 h-4 w-4" /> Buat Tag
                                    Baru
                                  </CommandItem>
                                </>
                              )}
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
                  render={({ field }) => {
                    const selectedProductIds = field.value || [];
                    const selectedProducts = products.filter((p) =>
                      selectedProductIds.includes(p.id),
                    );

                    return (
                      <FormItem className="flex flex-col pt-4">
                        <div className="flex flex-col mb-2">
                          <FormLabel className="text-base font-bold flex items-center gap-2">
                            <PackageSearch className="w-4 h-4" /> Produk Terkait
                          </FormLabel>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Cari dan pilih produk yang akan direkomendasikan di
                            artikel ini.
                          </p>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between bg-white text-muted-foreground hover:text-stone-700 font-normal">
                                Cari nama atau SKU produk...
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-(--radix-popover-trigger-width) p-0"
                            align="start">
                            <Command>
                              <CommandInput
                                placeholder="Ketik nama produk..."
                                className="h-10"
                              />
                              <CommandList>
                                <CommandEmpty>
                                  Produk tidak ditemukan.
                                </CommandEmpty>
                                <CommandGroup>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        const isSelected =
                                          selectedProductIds.includes(
                                            product.id,
                                          );
                                        const nextSelected = isSelected
                                          ? selectedProductIds.filter(
                                              (id: string) => id !== product.id,
                                            )
                                          : [...selectedProductIds, product.id];
                                        field.onChange(nextSelected);
                                      }}>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedProductIds.includes(
                                            product.id,
                                          )
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {product.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* LIST PRODUK YANG SUDAH DIPILIH (MUNCUL DI BAWAH COMBOBOX) */}
                        {selectedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 p-3 border rounded-lg bg-stone-50/50">
                            {selectedProducts.map((prod) => (
                              <div
                                key={prod.id}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-md border bg-white shadow-sm transition-all hover:border-red-200 group max-w-full">
                                <span className="text-[11px] font-medium truncate pr-2 max-w-50">
                                  {prod.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-stone-400 group-hover:bg-rose-50 group-hover:text-rose-600 shrink-0 rounded-sm"
                                  onClick={() => {
                                    field.onChange(
                                      selectedProductIds.filter(
                                        (id: string) => id !== prod.id,
                                      ),
                                    );
                                  }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* KOLOM KANAN (SIDEBAR PENGATURAN & SEO) */}
              <div className="space-y-6">
                <Card className="p-4 bg-stone-50/50 shadow-sm border-stone-200">
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="autoTranslate"
                      render={({ field }) => {
                        // Cek apakah ini mode edit dan artikel sudah pernah ditranslate
                        const hasBeenTranslated =
                          isEditing && initialData?.isTranslated;

                        return (
                          <FormItem className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-sm">
                            <div className="space-y-1">
                              <FormLabel className="text-sm font-bold flex items-center gap-2 text-blue-800">
                                <Languages className="w-4 h-4" />
                                {hasBeenTranslated
                                  ? "Terjemahkan Bagian Baru?"
                                  : "Auto Translate"}
                              </FormLabel>
                              <p className="text-[10px] text-blue-600 leading-tight">
                                {hasBeenTranslated
                                  ? "Nyalakan jika ada tambahan teks Indonesia baru yang ingin diterjemahkan otomatis."
                                  : "Terjemahkan otomatis ke Bahasa Inggris saat disimpan."}
                              </p>

                              {/* Badge Status */}
                              {hasBeenTranslated && (
                                <div className="pt-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-700 border-green-300 text-[9px] px-1.5 py-0">
                                    <Check className="w-3 h-3 mr-1" /> Sudah
                                    Terjemahan
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Kategori</FormLabel>

                          <Dialog
                            open={isCategoryModalOpen}
                            onOpenChange={setIsCategoryModalOpen}>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>
                                  Tambah Kategori Artikel
                                </DialogTitle>
                              </DialogHeader>
                              <ArticleCategoryForm
                                onSubmit={handleAddCategoryFast}
                                isSubmitting={isSubmittingCategory}
                              />
                            </DialogContent>
                          </Dialog>

                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              if (value === "add_new_category") {
                                setIsCategoryModalOpen(true);
                              } else {
                                field.onChange(value);
                              }
                            }}>
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

                              {/* Garis Pemisah Visual */}
                              <div className="h-1px bg-stone-200 my-1 mx-2" />

                              <SelectItem
                                value="add_new_category"
                                className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer">
                                <div className="flex items-center gap-2 text-xs">
                                  <Plus className="w-4 h-4" />
                                  Buat Kategori Baru...
                                </div>
                              </SelectItem>
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
                    name="focusKeywords_id"
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

          <TabsContent value="seo" className="mt-0 focus-visible:outline-none">
            <FormSeo control={form.control} />
          </TabsContent>
        </Tabs>
        <div className="sticky bottom-4 z-20 px-4 sm:px-0">
          <Button
            type="submit"
            className="w-full  text-white font-semibold py-4 px-4 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
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

      <ImagePreviewModal
        src={previewUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        alt="Preview Sampul Artikel"
      />
    </Form>
  );
}
