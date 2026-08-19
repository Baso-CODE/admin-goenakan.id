"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import FastCurrencyForm from "@/app/(dashboard)/admin-invoice/currency/components/formCurrencyFast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";

import {
  ArrowLeftRight,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Tags,
} from "lucide-react";

// === TYPES ===
type CategoryType = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type CurrencyType = {
  code: string;
  symbol: string;
  name: string;
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
  currencyCode: z.string().min(1, { message: "Currency wajib dipilih" }), // ✨ Tambahan validasi Currency
  method: z.string().optional(),
  referenceNumber: z.string().optional(),
  description: z.string().min(2, { message: "Deskripsi wajib diisi" }),
});

export type FinanceTransactionFormValues = z.infer<
  typeof financeTransactionSchema
>;

export default function FinanceTransactionForm({
  initialData,
  categories,
  currencies = [], // ✨ Menerima props currencies
  setCurrencies, // ✨ Menerima setter currencies untuk fast-create
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: Partial<FinanceTransactionFormValues>;
  categories: CategoryType[];
  currencies?: CurrencyType[];
  setCurrencies?: React.Dispatch<React.SetStateAction<any[]>>;
  onSubmit: (data: FinanceTransactionFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi, status } = useApi();
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

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
      currencyCode: initialData?.currencyCode || "IDR", // ✨ Default IDR
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
        currencyCode: initialData.currencyCode || "IDR",
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

  // Handler untuk menambah currency secara cepat via Modal
  const handleAddCurrencyFast = async (data: any) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/currencies", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat currency");
      }

      const responseData = await res.json();
      const newCurrency = responseData.data || responseData;

      if (setCurrencies) {
        setCurrencies((prev) => [...prev, newCurrency]);
      }
      form.setValue("currencyCode", newCurrency.code);
      setIsCurrencyModalOpen(false);
      toast.success("Currency berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat currency.");
    }
  };

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

      {/* Modal Tambah Currency Cepat */}
      <Dialog open={isCurrencyModalOpen} onOpenChange={setIsCurrencyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Currency Baru</DialogTitle>
          </DialogHeader>
          <FastCurrencyForm onSubmit={handleAddCurrencyFast} />
        </DialogContent>
      </Dialog>

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

              {/* === Currency (Mata Uang) === */}
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Mata Uang (Currency)
                    </FormLabel>
                    <Select
                      disabled={isLoading || isSubmitting}
                      onValueChange={(val) => {
                        if (val === "add_new_currency") {
                          setIsCurrencyModalOpen(true);
                        } else {
                          field.onChange(val);
                        }
                      }}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((cur) => (
                          <SelectItem key={cur.code} value={cur.code}>
                            {cur.code} ({cur.symbol}) - {cur.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-2" />
                        <SelectItem
                          value="add_new_currency"
                          className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Buat Currency Baru...
                          </div>
                        </SelectItem>
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
                      Nominal
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
