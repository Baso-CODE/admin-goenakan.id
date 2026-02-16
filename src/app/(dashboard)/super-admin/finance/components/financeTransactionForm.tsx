"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Resolver, useForm, useWatch } from "react-hook-form";
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

import {
  ArrowLeftRight,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Receipt,
  Tags,
} from "lucide-react";

// === TYPES ===
type CategoryType = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

// === SCHEMA VALIDASI ===
const financeTransactionSchema = z.object({
  transactionDate: z.string().min(1, { message: "Tanggal wajib diisi" }),
  type: z
    .enum(["INCOME", "EXPENSE"])
    .refine((val) => val !== undefined, { message: "Tipe wajib dipilih" }),
  amount: z.coerce
    .number({ message: "Nominal harus berupa angka" })
    .min(1, { message: "Nominal harus lebih dari 0" }),
  categoryId: z.string().min(1, { message: "Kategori wajib dipilih" }),
  method: z.string().optional(), // Opsional: BANK_TRANSFER, CASH, dll
  referenceNumber: z.string().optional(),
  description: z.string().min(2, { message: "Deskripsi wajib diisi" }),
});

export type FinanceTransactionFormValues = z.infer<
  typeof financeTransactionSchema
>;

export default function FinanceTransactionForm({
  initialData,
  categories,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: Partial<FinanceTransactionFormValues>;
  categories: CategoryType[]; // List kategori dari API
  onSubmit: (data: FinanceTransactionFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // === FORM SETUP ===
  const form = useForm<FinanceTransactionFormValues>({
    resolver: zodResolver(
      financeTransactionSchema,
    ) as Resolver<FinanceTransactionFormValues>,
    defaultValues: {
      transactionDate: initialData?.transactionDate
        ? new Date(initialData.transactionDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      type: initialData?.type || "EXPENSE",
      amount: initialData?.amount || 0,
      categoryId: initialData?.categoryId || "",
      method: initialData?.method || "",
      referenceNumber: initialData?.referenceNumber || "",
      description: initialData?.description || "",
    },
  });

  // Reset form saat data dari API (mode Edit) masuk
  useEffect(() => {
    if (initialData) {
      form.reset({
        transactionDate: initialData.transactionDate
          ? new Date(initialData.transactionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        type: initialData.type || "EXPENSE",
        amount: initialData.amount || 0,
        categoryId: initialData.categoryId || "",
        method: initialData.method || "",
        referenceNumber: initialData.referenceNumber || "",
        description: initialData.description || "",
      });
    }
  }, [initialData, form]);

  const selectedType = useWatch({ control: form.control, name: "type" });
  const filteredCategories = categories.filter(
    (cat) => cat.type === selectedType,
  );

  useEffect(() => {
    const currentCategoryId = form.getValues("categoryId");
    if (currentCategoryId) {
      const isStillValid = filteredCategories.some(
        (c) => c.id === currentCategoryId,
      );
      if (!isStillValid) {
        form.setValue("categoryId", "");
      }
    }
  }, [selectedType, categories]);

  const handleSubmit = (values: FinanceTransactionFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full relative shadow-sm border-t-4 border-t-blue-600">
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
              {/* === Tanggal Transaksi === */}
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Tanggal Transaksi
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Tipe Transaksi === */}
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
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Tipe" />
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

              {/* === Kategori === */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                      Kategori Keuangan
                    </FormLabel>
                    <Select
                      disabled={isLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.length === 0 && (
                          <SelectItem value="none" disabled>
                            Tidak ada kategori untuk tipe ini
                          </SelectItem>
                        )}
                        {filteredCategories.map((cat) => (
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

              {/* === Nominal (Amount) === */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Nominal (Rp)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Contoh: 1500000"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Metode Pembayaran (Opsional) === */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Metode Pembayaran (Opsional)
                    </FormLabel>
                    <Select
                      disabled={isLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Metode Pembayaran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">
                          Transfer Bank
                        </SelectItem>
                        <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                        <SelectItem value="CREDIT_CARD">
                          Kartu Kredit
                        </SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Nomor Referensi (Opsional) === */}
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Nomor Referensi (Opsional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nomor Resi / Invoice Internal / Bukti Transfer"
                        {...field}
                        value={field.value || ""}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Deskripsi === */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Deskripsi / Catatan Transaksi
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Gaji Karyawan Budi Bulan Februari 2026, Bayar Listrik Pabrik"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Transaksi" : "Simpan Transaksi"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
