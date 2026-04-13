"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiUrl } from "@/helper/apiurl";
import {
  Activity,
  FileText,
  Image as ImageIcon,
  LinkIcon,
  Loader2,
  Palette,
  Type,
} from "lucide-react";

const articleBannerSchema = z.object({
  articleId: z.string().min(1, { message: "Artikel wajib dipilih." }),
  backgroundColor: z
    .string()
    .min(1, { message: "Warna background wajib diisi." }),
  buttonText: z.string().min(1, { message: "Teks tombol wajib diisi." }),
  ctaLink: z.string().url({ message: "Link CTA harus berupa URL yang valid." }),
  isActive: z.boolean().default(false),
});

export type ArticleBannerFormValues = z.infer<typeof articleBannerSchema>;

export default function FormArticleBanner({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: ArticleBannerFormValues;
  onSubmit: (data: ArticleBannerFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const form = useForm<ArticleBannerFormValues>({
    resolver: zodResolver(
      articleBannerSchema,
    ) as Resolver<ArticleBannerFormValues>,
    defaultValues: initialData || {
      articleId: "",
      backgroundColor: "#C4A48E",
      buttonText: "Baca Selengkapnya",
      ctaLink: "",
      isActive: false,
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/articles?take=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data artikel");
        const responseData = await res.json();
        setArticles(responseData.data || []);
      } catch (error) {
        console.error("Gagal memuat artikel:", error);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchArticles();
  }, []);

  const handleSubmit = (values: ArticleBannerFormValues) => {
    onSubmit(values);
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
              {/* === Article ID (Dropdown) === */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="articleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Pilih Artikel
                      </FormLabel>
                      {loadingArticles ? (
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-stone-50 px-3 py-2 text-sm text-muted-foreground animate-pulse">
                          Memuat daftar artikel...
                        </div>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ? String(field.value) : undefined}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Pilih artikel untuk dijadikan banner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {articles.map((art) => (
                              <SelectItem key={art.id} value={String(art.id)}>
                                {art.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Background Color === */}
              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      Warna Background (Hex)
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1 cursor-pointer"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                        <Input
                          placeholder="#C4A48E"
                          {...field}
                          disabled={isLoading || isSubmitting}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Button Text === */}
              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      Teks Tombol
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Baca Selengkapnya"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === CTA Link === */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        Link CTA (Tujuan Klik)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://websiteanda.com/article/slug-artikel"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Is Active Switch === */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2 text-base">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          Tampilkan Banner Ini?
                        </FormLabel>
                        <div className="text-[0.8rem] text-muted-foreground">
                          Jika aktif, banner akan tayang di Carousel Halaman
                          Artikel Publik.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant={"default"}
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Banner" : "Save Banner"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
