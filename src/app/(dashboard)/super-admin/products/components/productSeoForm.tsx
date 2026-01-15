"use client";

import { Globe, Loader2, Save, Search, Share2 } from "lucide-react";
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
import { apiBaseUrl } from "next-auth/client/_utils";

// Tipe Data untuk Form (Sesuai DTO Backend)
interface SeoFormValues {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  structuredData: string;
}

interface ProductSeoFormProps {
  productId: string;
}

export function ProductSeoForm({ productId }: ProductSeoFormProps) {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SeoFormValues>({
    defaultValues: {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      structuredData: "",
    },
  });

  // 1. Fetch Existing SEO Data
  useEffect(() => {
    const fetchSeo = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiBaseUrl}/products/${productId}/seo`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Reset form dengan data yang ada (jika ada)
          if (data) {
            form.reset({
              metaTitle: data.metaTitle || "",
              metaDescription: data.metaDescription || "",
              keywords: data.keywords || "",
              canonicalUrl: data.canonicalUrl || "",
              ogTitle: data.ogTitle || "",
              ogDescription: data.ogDescription || "",
              ogImage: data.ogImage || "",
              structuredData: data.structuredData || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch SEO data", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchSeo();
    }
  }, [productId, form]);

  // 2. Handle Submit (Save/Update)
  const onSubmit = async (values: SeoFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiBaseUrl}/products/${productId}/seo`, {
        method: "PUT", // Kita pakai PUT sesuai endpoint backend
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to save SEO data");
      }

      toast.success("SEO data updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data SEO.");
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
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title (Judul Halaman)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jual Sepatu Nike Murah - Toko Kami"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Judul biru yang muncul di Google. Disarankan max 60-70
                        karakter.
                        <br />
                        <span
                          className={
                            field.value.length > 70
                              ? "text-red-500"
                              : "text-green-600"
                          }>
                          Panjang saat ini: {field.value.length} karakter.
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dapatkan sepatu lari terbaik dengan harga promo..."
                          className="h-24 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ringkasan di bawah judul. Disarankan max 150-160
                        karakter.
                        <br />
                        <span
                          className={
                            field.value.length > 160
                              ? "text-red-500"
                              : "text-green-600"
                          }>
                          Panjang saat ini: {field.value.length} karakter.
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords (Kata Kunci)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="sepatu, lari, nike, murah"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Pisahkan dengan koma.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* === TAB 2: SOCIAL MEDIA (OG) === */}
              <TabsContent value="social" className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700">
                  Pengaturan ini mempengaruhi tampilan saat link produk
                  dibagikan ke WhatsApp, Facebook, atau Twitter.
                </div>

                <FormField
                  control={form.control}
                  name="ogTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Title (OG Title)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="ogDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sama dengan Meta Description"
                          className="h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL gambar thumbnail. Kosongkan jika ingin menggunakan
                        gambar utama produk secara otomatis (tergantung
                        implementasi frontend toko).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* === TAB 3: ADVANCED === */}
              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="canonicalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://toko.com/produk/sepatu-asli"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Gunakan ini jika produk ini memiliki URL duplikat untuk
                        memberitahu Google URL mana yang asli.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="structuredData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Structured Data (JSON-LD)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='{"@context": "https://schema.org/", "@type": "Product", ...}'
                          className="font-mono text-xs h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Script JSON-LD untuk Rich Snippet. Hanya untuk pengguna
                        mahir.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save SEO Settings
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
