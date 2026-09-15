"use client";

import { Globe, Languages, Loader2, Save, Search, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";

// Tipe Data untuk Form (Sesuai DTO Backend Dwibahasa)
interface SeoFormValues {
  metaTitleId: string;
  metaDescriptionId: string;
  keywordsId: string;
  canonicalUrlId: string;
  ogTitleId: string;
  ogDescriptionId: string;
  structuredDataId: string;

  metaTitleEn: string;
  metaDescriptionEn: string;
  keywordsEn: string;
  canonicalUrlEn: string;
  ogTitleEn: string;
  ogDescriptionEn: string;
  structuredDataEn: string;

  ogImage: string; // Universal
}

interface ProductSeoFormProps {
  productId: string;
}

export function ProductSeoForm({ productId }: ProductSeoFormProps) {
  const { fetchApi, status } = useApi();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk menampilkan/menyembunyikan kolom bahasa Inggris
  const [showEnglish, setShowEnglish] = useState(false);

  const form = useForm<SeoFormValues>({
    defaultValues: {
      metaTitleId: "",
      metaDescriptionId: "",
      keywordsId: "",
      canonicalUrlId: "",
      ogTitleId: "",
      ogDescriptionId: "",
      structuredDataId: "",

      metaTitleEn: "",
      metaDescriptionEn: "",
      keywordsEn: "",
      canonicalUrlEn: "",
      ogTitleEn: "",
      ogDescriptionEn: "",
      structuredDataEn: "",

      ogImage: "",
    },
  });

  // 1. Fetch Existing SEO Data
  useEffect(() => {
    const fetchSeo = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const res = await fetchApi(`/products/${productId}/seo`);

        if (res.ok) {
          const data = await res.json();
          if (data) {
            form.reset({
              metaTitleId: data.metaTitleId || "",
              metaDescriptionId: data.metaDescriptionId || "",
              keywordsId: data.keywordsId || "",
              canonicalUrlId: data.canonicalUrlId || "",
              ogTitleId: data.ogTitleId || "",
              ogDescriptionId: data.ogDescriptionId || "",
              structuredDataId: data.structuredDataId || "",

              metaTitleEn: data.metaTitleEn || "",
              metaDescriptionEn: data.metaDescriptionEn || "",
              keywordsEn: data.keywordsEn || "",
              canonicalUrlEn: data.canonicalUrlEn || "",
              ogTitleEn: data.ogTitleEn || "",
              ogDescriptionEn: data.ogDescriptionEn || "",
              structuredDataEn: data.structuredDataEn || "",

              ogImage: data.ogImage || "",
            });

            // Opsional: Buka form Inggris otomatis jika data Inggris sudah pernah diisi manual
            if (data.metaTitleEn || data.metaDescriptionEn) {
              setShowEnglish(true);
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch SEO data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchSeo();
    }
  }, [productId, status, fetchApi, form]);

  // 2. Handle Submit (Save/Update)
  const onSubmit = async (values: SeoFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/products/${productId}/seo`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save SEO data");
      }

      toast.success("Data SEO berhasil diperbarui!");
    } catch (error: any) {
      console.error("❌ Save SEO Error:", error);
      toast.error(error.message || "Gagal menyimpan data SEO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Class helper untuk layout grid dinamis
  const gridLayout = showEnglish
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 gap-4";

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle>SEO & Metadata</CardTitle>
        </div>
        <CardDescription>
          Optimalkan pencarian produk ini di mesin pencari (Google) dan media
          sosial.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Banner Auto-Translate Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-stone-50 p-4 rounded-md mb-6 border border-stone-200 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
              Auto-Translate Aktif
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Sistem akan otomatis menerjemahkan data Bahasa Indonesia ke Bahasa
              Inggris. Aktifkan input manual jika ingin menggunakan terjemahan
              Anda sendiri.
            </p>
          </div>
          <Button
            type="button"
            variant={showEnglish ? "default" : "outline"}
            onClick={() => setShowEnglish(!showEnglish)}
            className="text-xs shrink-0 bg-white">
            <Languages className="w-4 h-4 mr-2" />
            {showEnglish ? "Tutup Input Inggris" : "Isi Manual (EN)"}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="basic" className="flex gap-2">
                  <Search className="h-4 w-4" /> Google SEO
                </TabsTrigger>
                <TabsTrigger value="social" className="flex gap-2">
                  <Share2 className="h-4 w-4" /> Social Share
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex gap-2">
                  <Globe className="h-4 w-4" /> Advanced
                </TabsTrigger>
              </TabsList>

              {/* === TAB 1: BASIC SEO (GOOGLE) === */}
              <TabsContent value="basic" className="space-y-6">
                {/* Meta Title */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="metaTitleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Meta Title (ID)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jual Sepatu Nike Murah"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          <span
                            className={
                              field.value.length > 70
                                ? "text-red-500"
                                : "text-stone-500"
                            }>
                            {field.value.length}/70 karakter
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="metaTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Meta Title (EN)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Buy Cheap Nike Shoes"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            <span
                              className={
                                field.value.length > 70
                                  ? "text-red-500"
                                  : "text-stone-500"
                              }>
                              {field.value.length}/70 karakter
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Meta Description */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="metaDescriptionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description (ID)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Dapatkan sepatu lari terbaik..."
                            className="h-24 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          <span
                            className={
                              field.value.length > 160
                                ? "text-red-500"
                                : "text-stone-500"
                            }>
                            {field.value.length}/160 karakter
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="metaDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description (EN)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Get the best running shoes..."
                              className="h-24 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            <span
                              className={
                                field.value.length > 160
                                  ? "text-red-500"
                                  : "text-stone-500"
                              }>
                              {field.value.length}/160 karakter
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Keywords */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="keywordsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords (ID)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="sepatu, lari, nike, murah"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="keywordsEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keywords (EN)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="shoes, running, nike, cheap"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              {/* === TAB 2: SOCIAL MEDIA (OG) === */}
              <TabsContent value="social" className="space-y-6">
                {/* OG Title */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="ogTitleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Title (ID)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sama dengan Meta Title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="ogTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Title (EN)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Same as Meta Title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* OG Description */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="ogDescriptionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Description (ID)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Sama dengan Meta Description"
                            className="h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="ogDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Description (EN)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Same as Meta Description"
                              className="h-20 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* OG Image (Universal) */}
                <FormField
                  control={form.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Image URL (Universal)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Berlaku untuk semua bahasa. Kosongkan jika ingin
                        menggunakan gambar utama produk secara otomatis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* === TAB 3: ADVANCED === */}
              <TabsContent value="advanced" className="space-y-6">
                {/* Canonical URL */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="canonicalUrlId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL (ID)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://toko.com/id/produk"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="canonicalUrlEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canonical URL (EN)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://toko.com/en/product"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Structured Data */}
                <div className={gridLayout}>
                  <FormField
                    control={form.control}
                    name="structuredDataId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Structured Data JSON-LD (ID)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"@context": "https://schema.org/"}'
                            className="font-mono text-xs h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showEnglish && (
                    <FormField
                      control={form.control}
                      name="structuredDataEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Structured Data JSON-LD (EN)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"@context": "https://schema.org/"}'
                              className="font-mono text-xs h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Simpan Pengaturan SEO
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
