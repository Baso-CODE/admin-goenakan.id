"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

import {
  ArrowLeftRight,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Tag,
} from "lucide-react";

// === SCHEMA VALIDASI ===
const financeCategorySchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Nama kategori minimal 2 karakter.",
    })
    .max(100, {
      message: "Nama kategori maksimal 100 karakter.",
    }),
  type: z.enum(["INCOME", "EXPENSE"]).refine((val) => val !== undefined, {
    message: "Tipe kategori wajib dipilih.",
  }),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type FinanceCategoryFormValues = z.infer<typeof financeCategorySchema>;

export default function FinanceCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: Partial<FinanceCategoryFormValues>;
  onSubmit: (data: FinanceCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // === FORM SETUP & DEFAULT VALUES ===
  const form = useForm<FinanceCategoryFormValues>({
    resolver: zodResolver(financeCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "EXPENSE",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        type: initialData.type || "EXPENSE",
        description: initialData.description || "",
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: FinanceCategoryFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full relative shadow-sm border-t-4 border-t-orange-500">
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
              {/* === Nama Kategori === */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Nama Kategori
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Gaji Karyawan, Listrik, Bonus"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Tipe Kategori === */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      Tipe Transaksi
                    </FormLabel>
                    <Select
                      disabled={isLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Tipe Kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">
                          Pemasukan (INCOME)
                        </SelectItem>
                        <SelectItem value="EXPENSE">
                          Pengeluaran (EXPENSE)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Deskripsi Kategori === */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Deskripsi (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Catatan tambahan mengenai kategori ini..."
                        {...field}
                        value={field.value || ""}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Status Aktif === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 flex flex-row items-center gap-3 p-3 border rounded-lg bg-gray-50/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-0.5 cursor-pointer">
                      <FormLabel className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Status Aktif
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Jika dimatikan, kategori ini tidak akan muncul lagi
                        sebagai pilihan saat mencatat transaksi baru.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Kategori" : "Simpan Kategori"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
