"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
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

const articleSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  content: z.string().min(20, "Konten artikel terlalu pendek"),
  source: z.string().optional(),
  published: z.boolean().default(false),
  productIds: z.array(z.string()).optional().default([]),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
export interface ArticleInitialData extends ArticleFormValues {
  coverImage?: string;
}

export default function FormArticle({
  onSubmit,
  isSubmitting,
  initialData,
  isEditing = false,
}: {
  onSubmit: (values: ArticleFormValues, coverFile: File | null) => void;
  isSubmitting: boolean;
  initialData?: ArticleInitialData | null;
  isEditing?: boolean;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema) as Resolver<ArticleFormValues>,
    defaultValues: {
      title: "",
      categoryId: "",
      content: "",
      source: "",
      published: false,
      productIds: [], // Default kosong
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        categoryId: initialData.categoryId || "",
        content: initialData.content || "",
        source: initialData.source || "",
        published: initialData.published || false,
        productIds: initialData.productIds || [],
      });
    }
  }, [initialData, form]);

  // Fetch Kategori Artikel
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
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(`${apiUrl}/products/order`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProducts(data.data || data || []);
      } catch (error) {
        toast.error("Gagal memuat daftar produk.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = (values: ArticleFormValues) => {
    if (!isEditing && !coverFile) {
      toast.error("Cover image wajib diunggah!");
      return;
    }
    onSubmit(values, coverFile);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
          <div className="md:col-span-2 space-y-6 min-w-0">
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konten Artikel</FormLabel>
                  <FormControl>
                    <div className="w-full max-w-full overflow-hidden border rounded-xl bg-white shadow-sm">
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

          <div className="space-y-6 p-5 border rounded-md bg-stone-50 min-w-0 sticky top-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  {loadingCategories ? (
                    <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-stone-50 px-3 py-2 text-sm text-muted-foreground animate-pulse">
                      Memuat kategori...
                    </div>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-white">
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
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <div className="flex flex-col gap-3">
                {isEditing && initialData?.coverImage && !coverFile && (
                  <div className="relative w-full h-32 rounded-md overflow-hidden border">
                    <img
                      src={initialData.coverImage}
                      alt="Current Cover"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  className="bg-white"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                {coverFile && (
                  <p className="text-xs text-green-600 flex items-center gap-1 truncate">
                    <FileImage className="w-3 h-3 shrink-0" />
                    <span className="truncate">{coverFile.name}</span>
                  </p>
                )}
                {isEditing && !coverFile && (
                  <p className="text-xs text-muted-foreground">
                    Biarkan kosong jika tidak ingin mengubah cover.
                  </p>
                )}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sumber (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="URL sumber artikel..."
                      className="bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">
                      Produk Terkait (Opsional)
                    </FormLabel>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Pilih produk yang akan direkomendasikan di sidebar artikel
                      ini.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-white">
                    {loadingProducts ? (
                      <p className="text-xs text-stone-500 animate-pulse">
                        Memuat produk...
                      </p>
                    ) : products.length === 0 ? (
                      <p className="text-xs text-stone-500">
                        Tidak ada produk.
                      </p>
                    ) : (
                      products.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="productIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={product.id}
                                className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                                    checked={field.value?.includes(product.id)}
                                    onChange={(e) => {
                                      return e.target.checked
                                        ? field.onChange([
                                            ...(field.value || []),
                                            product.id,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== product.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer line-clamp-1 leading-snug">
                                  {product.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <Save className="mr-2 h-4 w-4" />{" "}
                  {isEditing ? "Update Artikel" : "Simpan Artikel"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
