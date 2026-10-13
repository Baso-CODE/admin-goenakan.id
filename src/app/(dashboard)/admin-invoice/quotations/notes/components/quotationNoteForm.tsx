"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApi } from "@/hooks/useApi";

// === SCHEMA ===
const templateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Judul wajib diisi"),
  content: z.string().min(1, "Konten wajib diisi"),
});

const formSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  isPublic: z.boolean().default(true),
  templates: z.array(templateSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryData = {
  id: string;
  name: string;
  isPublic: boolean;
  templates: {
    id?: string;
    title: string;
    content: string;
  }[];
};

interface QuotationNoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CategoryData | null;
  onSuccess: () => void;
}

export function QuotationNoteForm({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: QuotationNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchApi, status } = useApi();
  // === INIT FORM ===
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      isPublic: true,
      templates: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "templates",
  });

  // === RESET FORM SAAT BUKA/TUTUP/GANTI DATA ===
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode Edit
        form.reset({
          name: initialData.name,
          isPublic: initialData.isPublic ?? true,
          templates: Array.isArray(initialData.templates)
            ? initialData.templates.map((template) => ({
                ...template,
                id: template.id ?? crypto.randomUUID(),
              }))
            : [],
        });
      } else {
        // Mode Create
        form.reset({
          name: "",
          isPublic: true,
          templates: [],
        });
      }
    }
  }, [isOpen, initialData, form]);

  // === SUBMIT HANDLER ===
  const onSubmit = async (values: FormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = initialData
        ? `/quotation-notes-categories/${initialData.id}`
        : `/quotation-notes-categories`;

      const method = initialData ? "PATCH" : "POST";

      const payload = {
        ...values,
        templates: (values.templates ?? []).map((template) => ({
          id: template.id ?? crypto.randomUUID(),
          title: template.title,
          content: template.content,
        })),
      };

      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyimpan data");
      }

      toast.success(
        initialData
          ? "Kategori Penawaran berhasil diperbarui!"
          : "Kategori Penawaran berhasil dibuat!",
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-160 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Edit Kategori Penawaran"
              : "Buat Kategori Penawaran"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Ubah kategori catatan untuk Quotation."
              : "Tambahkan kategori baru (Contoh: Terms, Validity)."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-2">
              {/* FIELD NAMA KATEGORI */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Payment Terms, Internal Memo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FIELD IS PUBLIC (CHECKBOX) */}
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-slate-50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Tampilkan di PDF / Public?</FormLabel>
                      <FormDescription>
                        Jika dicentang, notes ini akan muncul di PDF penawaran
                        harga.
                        <br />
                        Jika tidak, hanya untuk catatan internal tim Sales.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* DYNAMIC TEMPLATES FIELD */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <FormLabel className="text-base">Template Pesan</FormLabel>
                    <FormDescription>
                      Daftar opsi checkbox yang muncul saat membuat Quotation.
                    </FormDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        id: crypto.randomUUID(),
                        title: "",
                        content: "",
                      })
                    }
                    className="h-8 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Tambah
                  </Button>
                </div>

                <div className="space-y-3 mt-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="group flex gap-3 items-start bg-slate-50 p-3 rounded-lg border hover:border-slate-300 transition-colors">
                      <div className="grid gap-2 flex-1">
                        {/* Title Template */}
                        <FormField
                          control={form.control}
                          name={`templates.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input
                                  placeholder="Judul (ex: DP 50%)"
                                  className="h-8 text-sm font-semibold bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                        {/* Content Template */}
                        <FormField
                          control={form.control}
                          name={`templates.${index}.content`}
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormControl>
                                <div className="overflow-hidden rounded-md border bg-white">
                                  <SimpleEditor
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    minHeight="200px"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Delete Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 mt-1"
                        onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50/50">
                      <p className="text-sm">Belum ada template.</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() =>
                          append({
                            id: crypto.randomUUID(),
                            title: "",
                            content: "",
                          })
                        }
                        className="text-primary">
                        + Tambah Template Pertama
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
