"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { FileImage, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import TiptapEditor from "./tiptapEditor";

const articleSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  content: z.string().min(20, "Konten artikel terlalu pendek"),
  source: z.string().optional(),
  published: z.boolean().default(false),
  // productIds kita skip dulu agar simpel, bisa ditambahkan nanti jika perlu
});

export type ArticleFormValues = z.infer<typeof articleSchema>;

export default function FormArticle({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: ArticleFormValues, coverFile: File | null) => void;
  isSubmitting: boolean;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema) as Resolver<ArticleFormValues>,
    defaultValues: {
      title: "",
      categoryId: "",
      content: "",
      source: "",
      published: false,
    },
  });

  // Fetch Kategori Artikel untuk Dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/article-categories/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCategories(data || []);
      } catch (error) {
        toast.error("Gagal memuat kategori artikel.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = (values: ArticleFormValues) => {
    if (!coverFile) {
      toast.error("Cover image wajib diunggah!");
      return;
    }
    onSubmit(values, coverFile);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* KIRI: Informasi Dasar */}
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Artikel</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul artikel..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TIPTAP EDITOR */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konten Artikel</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* KANAN: Meta & Sidebar */}
          <div className="space-y-6 p-5 border rounded-md bg-stone-50">
            {/* Kategori */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                {coverFile && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FileImage className="w-3 h-3" /> {coverFile.name}
                  </p>
                )}
              </div>
            </FormItem>

            {/* Sumber Artikel (Opsional) */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sumber (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="URL sumber artikel..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Publish Switch */}
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Publish Langsung?
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan Artikel
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
