"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Banknote,
  Calculator,
  Loader2,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

// === TYPES ===
export type Currency = { code: string; symbol: string; name: string };
type VendorItem = { id: string; name: string };
type Vendor = {
  id: string;
  companyName: string;
  items: VendorItem[];
};

// === UTILS ===
const formatCurrency = (amount: number, currencyCode: string = "IDR") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// === HELPER SCHEMAS ===
const anyToNumber = z.any().transform((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
});
const anyToNumberDefaultOne = z.any().transform((val) => {
  if (val === "" || val === null || val === undefined) return 1;
  const parsed = Number(val);
  return isNaN(parsed) || parsed === 0 ? 1 : parsed;
});

// === SCHEMA VALIDATION ===
const cashflowSchema = z.object({
  poNumber: z.string(),
  revenueItems: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      productId: z.string().optional(),
      unitPrice: anyToNumber,
      quantity: anyToNumberDefaultOne,
      currency: z.string().optional(),
      exchangeRate: anyToNumberDefaultOne,
      total: z.number(),
    }),
  ),
  costItems: z.array(
    z.object({
      isManual: z.boolean().default(false).optional(),
      description: z.string().min(1, "Description required"),
      vendorId: z.string().optional(),
      costPerUnit: anyToNumber,
      quantity: anyToNumberDefaultOne,
      currency: z.string().optional(),
      exchangeRate: anyToNumberDefaultOne,
      total: z.number(),
    }),
  ),
});

type CashflowFormValues = z.infer<typeof cashflowSchema>;

export default function EditCashflowClient() {
  const { fetchApi, status } = useApi();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "order";
  const referenceId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isConvertingRate, setIsConvertingRate] = useState(false);

  // Master Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<string>("IDR");

  // === FORM SETUP ===
  const form = useForm<CashflowFormValues>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      poNumber: "",
      revenueItems: [],
      costItems: [],
    },
  });

  const { control, handleSubmit, watch, setValue, getValues, reset } = form;

  const revenueFields = useFieldArray({ control, name: "revenueItems" });
  const costFields = useFieldArray({ control, name: "costItems" });

  // === REAL-TIME WATCH VALUES FOR SUMMARY ===
  const watchedRevenues = watch("revenueItems");
  const watchedCosts = watch("costItems");

  // Kalkulasi Real-time dalam satuan IDR untuk Analisis Profit Kanan
  const totalRevenueCalculated = (watchedRevenues || []).reduce((acc, item) => {
    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.exchangeRate) || 1;
    return acc + price * qty * rate;
  }, 0);

  const totalCostCalculated = (watchedCosts || []).reduce((acc, item) => {
    const cost = Number(item.costPerUnit) || 0;
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.exchangeRate) || 1;
    return acc + cost * qty * rate;
  }, 0);

  const netProfitCalculated = totalRevenueCalculated - totalCostCalculated;

  // Kalkulasi Total untuk Badge Header Card (Berdasarkan mata uang acuan atau penjumlahan item)
  const totalRevenueHeaderBadge = (watchedRevenues || []).reduce(
    (acc, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 0;
      return acc + price * qty;
    },
    0,
  );

  const totalCostHeaderBadge = (watchedCosts || []).reduce((acc, item) => {
    const cost = Number(item.costPerUnit) || 0;
    const qty = Number(item.quantity) || 0;
    return acc + cost * qty;
  }, 0);

  // Ambil mata uang baris pertama sebagai referensi badge header jika ada
  const firstRevenueCurrency = watchedRevenues?.[0]?.currency || baseCurrency;
  const firstCostCurrency = watchedCosts?.[0]?.currency || baseCurrency;

  // === LOAD DATA ===
  const loadData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !referenceId)
      return;

    try {
      setLoading(true);

      const queryParam =
        type === "replacement"
          ? `replacementOrderId=${referenceId}`
          : `orderId=${referenceId}`;

      const [currencyRes, cashflowRes] = await Promise.all([
        fetchApi("/currencies"),
        fetchApi(`/cashflows/detail?${queryParam}`),
      ]);

      if (currencyRes.ok) {
        const currData = await currencyRes.json();
        setCurrencies(currData.data || currData || []);
      }

      if (!cashflowRes.ok) throw new Error("Failed to load cashflow data");

      const detailData = await cashflowRes.json();

      const allVendors = detailData.availableVendors || [];
      setVendors(allVendors);

      const fetchedPOVendors = detailData.poVendors || [];
      const bCurrency = detailData.summary?.baseCurrencyId || "IDR";
      setBaseCurrency(bCurrency);

      const initialCostItems =
        detailData.costs && detailData.costs.length > 0
          ? detailData.costs.map((c: any) => ({
              isManual: !c.vendorId,
              description: c.description || "",
              vendorId: c.vendorId || "",
              costPerUnit: Number(c.costPerUnit),
              quantity: Number(c.quantity),
              currency: c.currencyCode || c.currency || bCurrency,
              exchangeRate: Number(c.exchangeRate) || 1,
              total: Number(c.total),
            }))
          : fetchedPOVendors.map((v: any) => ({
              isManual: !v.vendorId && !v.id,
              description:
                v.itemName ||
                v.vendorItem?.name ||
                v.description ||
                v.name ||
                "",
              vendorId: v.vendorId || v.id || "",
              costPerUnit: Number(v.unitPrice || v.costPerUnit || 0),
              quantity: Number(
                v.quantityPurchase || v.quantityOrder || v.quantity || 1,
              ),
              currency:
                v.currencyCode ||
                v.currency ||
                v.po?.currencyCode ||
                detailData.summary?.currencyCode ||
                bCurrency,
              exchangeRate: Number(v.exchangeRate) || 1,
              total: 0,
            }));

      reset({
        poNumber: detailData.summary.orderNumber || detailData.summary.poNumber,
        revenueItems: detailData.revenues.map((r: any) => ({
          description: r.description,
          productId: r.productId || "",
          unitPrice: Number(r.unitPrice),
          quantity: Number(r.quantity),
          currency: r.currencyCode || r.currency || bCurrency,
          exchangeRate: Number(r.exchangeRate) || 1,
          total: Number(r.total),
        })),
        costItems: initialCostItems,
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data master atau cashflow");
    } finally {
      setLoading(false);
    }
  }, [referenceId, type, reset, status, fetchApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // === FUNGSI AUTO CONVERT RATE YANG BENAR (MEMANFAATKAN BACKEND SEPENUHNYA) ===
  const handleCurrencyChange = async (
    index: number,
    newCurrency: string,
    oldCurrency: string, // Parameter oldCurrency yang ditambahkan sebelumnya
    type: "cost" | "revenue",
    isManualTrigger: boolean = false,
  ) => {
    const fieldNamePrefix =
      type === "revenue" ? `revenueItems.${index}` : `costItems.${index}`;
    const currentPriceField = type === "revenue" ? "unitPrice" : "costPerUnit";

    // Ambil harga saat ini (Misal: 12000000 IDR)
    const currentPrice =
      Number(getValues(`${fieldNamePrefix}.${currentPriceField}` as any)) || 0;

    if (!isManualTrigger) {
      setValue(`${fieldNamePrefix}.currency` as any, newCurrency);
    }

    if (newCurrency === oldCurrency && !isManualTrigger) {
      return;
    }

    try {
      setIsConvertingRate(true);

      // Kita buat SATU skenario kuat: Kirim harga aktualnya ke Backend, dan biarkan Backend menghitung.
      const res = await fetchApi("/currencies/convert/rate", {
        method: "POST",
        body: JSON.stringify({
          fromCurrency: oldCurrency, // Dari (Misal: IDR)
          toCurrency: newCurrency, // Ke (Misal: EUR)
          amount: currentPrice || 1, // Kirim harga aktualnya! (Jika 0, kirim 1 agar dapat rate dasar)
        }),
      });

      if (!res.ok) throw new Error(`Gagal konversi ke ${newCurrency}`);
      const data = await res.json();

      //  Jika harga awal bukan 0, langsung pakai hasil perhitungan (convertedAmount) dari API!
      if (currentPrice > 0) {
        const finalPrice = data.convertedAmount || data.data?.convertedAmount;

        setValue(
          `${fieldNamePrefix}.${currentPriceField}` as any,
          Number(finalPrice),
        );
        setValue(`${fieldNamePrefix}.exchangeRate` as any, 1);
        toast.success(`Berhasil mengubah nilai ke ${newCurrency}!`);
      }
      // Jika harga awal 0, cuma ambil rate-nya saja (refresh rate)
      else {
        const rateToTarget = data.rate || data.data?.rate || 1;
        setValue(`${fieldNamePrefix}.exchangeRate` as any, rateToTarget);
        toast.success(
          `Kurs 1 ${oldCurrency} ke ${newCurrency} berhasil dimuat.`,
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mendapatkan kurs otomatis.");
    } finally {
      setIsConvertingRate(false);
    }
  };
  // === SUBMIT HANDLER ===
  const onSubmit = async (data: CashflowFormValues) => {
    if (status !== "authenticated") return;

    try {
      setSubmitting(true);

      const cleanData = {
        orderId: type === "order" ? referenceId : undefined,
        replacementOrderId: type === "replacement" ? referenceId : undefined,
        orderNumber: data.poNumber,
        revenueItems: data.revenueItems.map((item) => {
          const rate = Number(item.exchangeRate) || 1;
          return {
            ...item,
            exchangeRate: rate,
            historicalExchangeRate: rate,
            total: Number(item.unitPrice) * Number(item.quantity) * rate,
          };
        }),
        costItems: data.costItems.map((item) => {
          const rate = Number(item.exchangeRate) || 1;
          return {
            ...item,
            isManual: Boolean(item.isManual),
            vendorId: item.isManual ? undefined : item.vendorId,
            exchangeRate: rate,
            historicalExchangeRate: rate,
            total: Number(item.costPerUnit) * Number(item.quantity) * rate,
          };
        }),
      };

      const res = await fetchApi(`/cashflows`, {
        method: "POST",
        body: JSON.stringify(cleanData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save cashflow");
      }

      toast.success("Cashflow berhasil disimpan!");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  // === FUNGSI KONVERSI UNIVERSAL KE RUPIAH (IDR) ===
  const convertToRupiahDirectly = async (
    index: number,
    type: "cost" | "revenue",
  ) => {
    try {
      setIsConvertingRate(true);

      const fieldName =
        type === "revenue" ? `revenueItems.${index}` : `costItems.${index}`;
      const item = getValues(fieldName as any);

      const currentUnitPrice =
        Number(item?.unitPrice || item?.costPerUnit) || 0;
      const currentCurr = item?.currency || baseCurrency;

      if (currentCurr === "IDR") {
        toast.info("Mata uang sudah dalam bentuk IDR.");
        return;
      }

      const res = await fetchApi("/currencies/convert/rate", {
        method: "POST",
        body: JSON.stringify({
          fromCurrency: currentCurr,
          toCurrency: "IDR",
          amount: 1,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengambil kurs ke IDR");

      const data = await res.json();
      const rateToIdr = data.rate || data.data?.rate || 1;

      const priceInIdr = currentUnitPrice * rateToIdr;

      setValue(`${fieldName}.currency` as any, "IDR");
      if (type === "revenue") {
        setValue(`revenueItems.${index}.unitPrice` as any, priceInIdr);
      } else {
        setValue(`costItems.${index}.costPerUnit` as any, priceInIdr);
      }
      setValue(`${fieldName}.exchangeRate` as any, 1);

      toast.success(
        `Berhasil mengkonversi ${currentCurr} ke IDR menggunakan kurs ${rateToIdr}!`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengkonversi ke Rupiah.");
    } finally {
      setIsConvertingRate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading financial data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* Header & Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Update Cashflow</h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Banknote className="h-4 w-4" />
            <span>SO/SN: </span>
            <Badge
              variant="outline"
              className="font-mono text-primary border-primary/30 bg-primary/5">
              {getValues("poNumber")}
            </Badge>
            <Badge variant="secondary" className="ml-2 bg-slate-200">
              Base Curr: {baseCurrency}
            </Badge>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Grid utama 3 kolom: 2 untuk form kiri, 1 untuk sticky kanan tanpa overflow-hidden pembatas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* === LEFT COLUMN: FORM INPUTS (Revenue & Cost) === */}
            <div className="xl:col-span-2 space-y-8">
              {/* --- 1. REVENUE SECTION --- */}
              <Card className="border border-white/60 bg-white/40 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl relative">
                {/* Efek gradasi halus di latar belakang (opsional, untuk menambah kesan liquid) */}
                <div className="absolute inset-0 bg-linear-to-br from-emerald-100/20 via-transparent to-transparent pointer-events-none" />

                <CardHeader className="bg-white/30 backdrop-blur-md pb-4 border-b border-white/50 relative z-10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-emerald-900 flex items-center gap-2 font-semibold">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 shadow-sm backdrop-blur-md">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      Revenue (Pemasukan)
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-white/60 backdrop-blur-md text-emerald-800 border border-white/50 shadow-sm hover:bg-white/80 transition-colors">
                      Total:{" "}
                      {formatCurrency(
                        totalRevenueHeaderBadge,
                        firstRevenueCurrency,
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 relative z-10">
                  <div className="p-4 space-y-5">
                    {revenueFields.fields.map((field, index) => {
                      const rowCurrency =
                        watch(`revenueItems.${index}.currency`) || baseCurrency;

                      return (
                        <div
                          key={field.id}
                          // Efek Glass untuk setiap item baris
                          className="flex flex-col gap-4 border border-white/60 shadow-md bg-white/50 backdrop-blur-lg p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-white/60">
                          <div className="w-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wider">
                              Description / Nama Pemasukan
                            </label>
                            <FormField
                              control={control}
                              name={`revenueItems.${index}.description`}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  placeholder="Product Name / Service"
                                  className="h-10 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white transition-colors"
                                />
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 items-end bg-white/40 p-3.5 rounded-lg border border-white/50 shadow-sm mt-1">
                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-wider">
                                Curr{" "}
                                {isConvertingRate && (
                                  <Loader2 className="w-2 h-2 animate-spin text-emerald-600" />
                                )}
                              </label>
                              <FormField
                                control={control}
                                name={`revenueItems.${index}.currency`}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={(val) =>
                                      handleCurrencyChange(
                                        index,
                                        val,
                                        field.value || baseCurrency,
                                        "revenue",
                                      )
                                    }
                                    value={field.value || baseCurrency}>
                                    <FormControl>
                                      <SelectTrigger
                                        className="h-9 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                        disabled={isConvertingRate}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white/90 backdrop-blur-xl border-white/50">
                                      {currencies.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                          {c.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>

                            <div className="col-span-1 lg:col-span-3 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Unit Price
                              </label>
                              <FormField
                                control={control}
                                name={`revenueItems.${index}.unitPrice`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    className="h-9 text-sm text-right bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                  />
                                )}
                              />
                            </div>

                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Rate ({baseCurrency})
                              </label>
                              <FormField
                                control={control}
                                name={`revenueItems.${index}.exchangeRate`}
                                render={({ field }) => (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="any"
                                      {...field}
                                      className="h-9 text-sm text-right bg-white/70 border-white/50 shadow-inner flex-1 focus:bg-white"
                                      disabled={
                                        rowCurrency === baseCurrency ||
                                        isConvertingRate
                                      }
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                    />
                                    {rowCurrency !== baseCurrency && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-emerald-600 hover:text-emerald-700 bg-white/50 hover:bg-white/80 border-white/50 shadow-sm transition-all"
                                        title="Tarik Kurs Terkini"
                                        onClick={() =>
                                          handleCurrencyChange(
                                            index,
                                            rowCurrency,
                                            rowCurrency,
                                            "revenue",
                                            true,
                                          )
                                        }
                                        disabled={isConvertingRate}>
                                        <RefreshCw
                                          className={cn(
                                            "h-4 w-4",
                                            isConvertingRate && "animate-spin",
                                          )}
                                        />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              />
                              {rowCurrency !== "IDR" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-[11px] mt-1 bg-white/60 text-emerald-700 border-white/60 shadow-sm hover:bg-white/90 backdrop-blur-sm transition-all"
                                  title="Ubah nominal ini langsung ke Rupiah (IDR)"
                                  onClick={() =>
                                    convertToRupiahDirectly(index, "revenue")
                                  }
                                  disabled={isConvertingRate}>
                                  <RefreshCw className="mr-1 h-3 w-3" />
                                  Ubah ke IDR
                                </Button>
                              )}
                            </div>

                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Qty
                              </label>
                              <FormField
                                control={control}
                                name={`revenueItems.${index}.quantity`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    className="h-9 text-sm text-center bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                  />
                                )}
                              />
                            </div>

                            {/* Total & Delete (Revenue) */}
                            <div className="col-span-2 lg:col-span-3 flex justify-end items-center gap-4 h-9">
                              <div className="flex flex-col items-end leading-none justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                                  Total {rowCurrency}
                                </span>
                                <span className="text-[15px] font-extrabold text-emerald-700 leading-none drop-shadow-sm">
                                  {formatCurrency(
                                    (Number(
                                      watch(`revenueItems.${index}.unitPrice`),
                                    ) || 0) *
                                      (Number(
                                        watch(`revenueItems.${index}.quantity`),
                                      ) || 0) *
                                      (Number(
                                        watch(
                                          `revenueItems.${index}.exchangeRate`,
                                        ),
                                      ) || 1),
                                    rowCurrency,
                                  )}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:bg-red-500/10 hover:text-red-600 shrink-0 transition-colors rounded-full"
                                onClick={() => revenueFields.remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {revenueFields.fields.length === 0 && (
                      <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-white/60 rounded-xl bg-white/30 backdrop-blur-sm">
                        Belum ada pemasukan diinput.
                      </div>
                    )}
                  </div>

                  {/* Area Tombol Tambah */}
                  <div className="bg-white/30 backdrop-blur-md p-4 border-t border-white/50 flex justify-center rounded-b-2xl relative z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        revenueFields.append({
                          description: "",
                          productId: "",
                          unitPrice: 0,
                          quantity: 1,
                          currency: baseCurrency,
                          exchangeRate: 1,
                          total: 0,
                        })
                      }
                      className="text-emerald-800 border-white/60 bg-white/50 backdrop-blur-sm hover:bg-white/80 shadow-sm transition-all rounded-full px-6">
                      <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pemasukan
                      Baru
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* --- 2. COST SECTION --- */}
              {/* Menggunakan efek Glassmorphism untuk Card Utama */}
              <Card className="border border-white/60 bg-white/40 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl relative mt-8">
                {/* Efek gradasi halus di latar belakang untuk nuansa merah */}
                <div className="absolute inset-0 bg-linear-to-br from-red-100/20 via-transparent to-transparent pointer-events-none" />

                <CardHeader className="bg-white/30 backdrop-blur-md pb-4 border-b border-white/50 relative z-10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-red-900 flex items-center gap-2 font-semibold">
                      <div className="p-2 rounded-xl bg-red-500/20 text-red-700 shadow-sm backdrop-blur-md">
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      Cost (Pengeluaran)
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-white/60 backdrop-blur-md text-red-800 border border-white/50 shadow-sm hover:bg-white/80 transition-colors">
                      Total:{" "}
                      {formatCurrency(totalCostHeaderBadge, firstCostCurrency)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 relative z-10">
                  <div className="p-4 space-y-5">
                    {costFields.fields.map((field, index) => {
                      const isManual = watch(`costItems.${index}.isManual`);
                      const rowCurrency =
                        watch(`costItems.${index}.currency`) || baseCurrency;

                      return (
                        <div
                          key={field.id}
                          // Efek Glass untuk setiap item baris
                          className="flex flex-col gap-4 border border-white/60 shadow-md bg-white/50 backdrop-blur-lg p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-white/60">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-300/40">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={isManual}
                                onCheckedChange={(val) => {
                                  setValue(`costItems.${index}.isManual`, val);
                                  setValue(`costItems.${index}.vendorId`, "");
                                  setValue(
                                    `costItems.${index}.description`,
                                    "",
                                  );
                                }}
                              />
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Input Manual?
                              </span>
                            </div>
                          </div>

                          <div className="w-full">
                            {!isManual ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Vendor
                                  </label>
                                  <FormField
                                    control={control}
                                    name={`costItems.${index}.vendorId`}
                                    render={({ field }) => (
                                      <Select
                                        onValueChange={(val) => {
                                          field.onChange(val);
                                          setValue(
                                            `costItems.${index}.description`,
                                            "",
                                          );
                                        }}
                                        value={field.value || ""}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white w-full transition-colors">
                                            <SelectValue placeholder="Pilih Vendor" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white/90 backdrop-blur-xl border-white/50">
                                          {vendors.map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                              {v.companyName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Item / Servis Vendor
                                  </label>
                                  <FormField
                                    control={control}
                                    name={`costItems.${index}.description`}
                                    render={({ field }) => {
                                      const currentVendorId = watch(
                                        `costItems.${index}.vendorId`,
                                      );
                                      const selectedVendor = vendors.find(
                                        (v) => v.id === currentVendorId,
                                      );
                                      const vendorItems =
                                        selectedVendor?.items || [];

                                      return (
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                          disabled={!currentVendorId}>
                                          <FormControl>
                                            <SelectTrigger className="h-10 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white w-full transition-colors">
                                              <SelectValue placeholder="Pilih Item" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="bg-white/90 backdrop-blur-xl border-white/50">
                                            {vendorItems.length > 0 ? (
                                              vendorItems.map((item: any) => (
                                                <SelectItem
                                                  key={item.id}
                                                  value={item.name}>
                                                  {item.name}
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <div className="p-2 text-xs text-slate-500 text-center">
                                                Item kosong
                                              </div>
                                            )}

                                            {field.value &&
                                              !vendorItems.some(
                                                (vi: any) =>
                                                  vi.name === field.value,
                                              ) &&
                                              field.value !== "Lainnya" && (
                                                <SelectItem value={field.value}>
                                                  {field.value} (Sesuai PO)
                                                </SelectItem>
                                              )}

                                            <SelectItem value="Lainnya">
                                              Lainnya (Manual)
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 w-full">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Nama Pengeluaran / Deskripsi
                                </label>
                                <FormField
                                  control={control}
                                  name={`costItems.${index}.description`}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder="Contoh: Bensin Operasional..."
                                      className="h-10 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white transition-colors"
                                    />
                                  )}
                                />
                              </div>
                            )}
                          </div>

                          {/* Grid Dalam (Angka & Rate) */}
                          <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 items-end bg-white/40 p-3.5 rounded-lg border border-white/50 shadow-sm mt-1">
                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-wider">
                                Curr{" "}
                                {isConvertingRate && (
                                  <Loader2 className="w-2 h-2 animate-spin text-red-600" />
                                )}
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.currency`}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={(val) =>
                                      handleCurrencyChange(
                                        index,
                                        val,
                                        field.value || baseCurrency,
                                        "cost",
                                      )
                                    }
                                    value={field.value || baseCurrency}>
                                    <FormControl>
                                      <SelectTrigger
                                        className="h-9 text-sm bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                        disabled={isConvertingRate}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white/90 backdrop-blur-xl border-white/50">
                                      {currencies.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                          {c.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>

                            <div className="col-span-1 lg:col-span-3 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Cost/Unit
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.costPerUnit`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    className="h-9 text-sm text-right bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                  />
                                )}
                              />
                            </div>

                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Rate ({baseCurrency})
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.exchangeRate`}
                                render={({ field }) => (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="any"
                                      {...field}
                                      className="h-9 text-sm text-right bg-white/70 border-white/50 shadow-inner flex-1 focus:bg-white"
                                      disabled={
                                        rowCurrency === baseCurrency ||
                                        isConvertingRate
                                      }
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                    />
                                    {rowCurrency !== baseCurrency && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-red-600 hover:text-red-700 bg-white/50 hover:bg-white/80 border-white/50 shadow-sm transition-all"
                                        title="Tarik Kurs Terkini"
                                        onClick={() =>
                                          handleCurrencyChange(
                                            index,
                                            rowCurrency,
                                            rowCurrency,
                                            "cost",
                                            true,
                                          )
                                        }
                                        disabled={isConvertingRate}>
                                        <RefreshCw
                                          className={cn(
                                            "h-4 w-4",
                                            isConvertingRate && "animate-spin",
                                          )}
                                        />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              />
                              {rowCurrency !== "IDR" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-[11px] mt-1 bg-white/60 text-red-700 border-white/60 shadow-sm hover:bg-white/90 backdrop-blur-sm transition-all"
                                  title="Ubah nominal ini langsung ke Rupiah (IDR)"
                                  onClick={() =>
                                    convertToRupiahDirectly(index, "cost")
                                  }
                                  disabled={isConvertingRate}>
                                  <RefreshCw className="mr-1 h-3 w-3" />
                                  Ubah ke IDR
                                </Button>
                              )}
                            </div>

                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Qty
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.quantity`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    step="any"
                                    {...field}
                                    className="h-9 text-sm text-center bg-white/70 border-white/50 shadow-inner focus:bg-white"
                                  />
                                )}
                              />
                            </div>

                            {/* Total & Delete (Cost) */}
                            <div className="col-span-2 lg:col-span-3 flex justify-end items-center gap-4 h-9">
                              <div className="flex flex-col items-end leading-none justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                                  Total {rowCurrency}
                                </span>
                                <span className="text-[15px] font-extrabold text-red-700 leading-none drop-shadow-sm">
                                  {formatCurrency(
                                    (Number(
                                      watch(`costItems.${index}.costPerUnit`),
                                    ) || 0) *
                                      (Number(
                                        watch(`costItems.${index}.quantity`),
                                      ) || 0) *
                                      (Number(
                                        watch(
                                          `costItems.${index}.exchangeRate`,
                                        ),
                                      ) || 1),
                                    rowCurrency,
                                  )}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:bg-red-500/10 hover:text-red-600 shrink-0 transition-colors rounded-full"
                                onClick={() => costFields.remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {costFields.fields.length === 0 && (
                      <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-white/60 rounded-xl bg-white/30 backdrop-blur-sm">
                        Belum ada pengeluaran diinput.
                      </div>
                    )}
                  </div>

                  {/* Area Tombol Tambah Cost */}
                  <div className="bg-white/30 backdrop-blur-md p-4 border-t border-white/50 flex justify-center rounded-b-2xl relative z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        costFields.append({
                          isManual: false,
                          description: "",
                          vendorId: "",
                          costPerUnit: 0,
                          quantity: 1,
                          currency: baseCurrency,
                          exchangeRate: 1,
                          total: 0,
                        })
                      }
                      className="text-red-800 border-white/60 bg-white/50 backdrop-blur-sm hover:bg-white/80 shadow-sm transition-all rounded-full px-6">
                      <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                      Baru
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* === RIGHT COLUMN: SUMMARY STICKY (APPLE GLASS STYLE & FIXED STICKY) === */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Kartu Profit Analysis */}
                <Card className="shadow-2xl border border-white/40 bg-white/70 backdrop-blur-xl text-slate-800 rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-100/80 bg-white/40 rounded-t-2xl">
                    <CardTitle className="text-lg flex items-center gap-2.5 text-slate-900">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                        <Calculator className="h-5 w-5" />
                      </div>
                      Profit Analysis (IDR)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    {/* Total Revenue Real-time */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">
                        Total Revenue
                      </span>
                      <span className="font-bold text-emerald-600 text-base">
                        {formatCurrency(totalRevenueCalculated, "IDR")}
                      </span>
                    </div>

                    {/* Total Cost Real-time */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">
                        Total Cost
                      </span>
                      <span className="font-bold text-rose-600 text-base">
                        ({formatCurrency(totalCostCalculated, "IDR")})
                      </span>
                    </div>

                    <Separator className="bg-slate-200/60 my-1" />

                    {/* Net Profit Real-time */}
                    <div className="flex justify-between items-center text-base pt-1">
                      <span className="font-bold text-slate-900">
                        Net Profit
                      </span>
                      <span
                        className={cn(
                          "font-extrabold font-mono text-lg",
                          netProfitCalculated >= 0
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}>
                        {formatCurrency(netProfitCalculated, "IDR")}
                      </span>
                    </div>

                    {/* Margin Info */}
                    {totalRevenueCalculated > 0 && (
                      <div className="text-right text-xs text-slate-400 font-medium pt-0.5">
                        Margin:{" "}
                        <span className="text-slate-700 font-semibold">
                          {(
                            (netProfitCalculated / totalRevenueCalculated) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    )}

                    {/* Tombol Simpan */}
                    <Button
                      className="w-full mt-4 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                      size="lg"
                      onClick={form.handleSubmit(onSubmit, (errors) => {
                        toast.error(
                          "Cek kembali isian form, ada yang belum lengkap/valid.",
                        );
                      })}
                      disabled={submitting || isConvertingRate}>
                      {submitting || isConvertingRate ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Guidelines Card */}
                <Card className="border border-white/40 bg-white/60 backdrop-blur-lg shadow-lg rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-800">
                      Tips Pengisian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p>
                      1. <strong>Real-time Calculation:</strong> Angka profit di
                      atas otomatis berubah seketika saat kamu mengubah harga,
                      jumlah, atau kurs di sebelah kiri.
                    </p>
                    <p>
                      2. Tekan tombol <strong>"Ubah ke IDR"</strong> untuk
                      konversi mata uang asing secara instan.
                    </p>
                    <p>
                      3. Pastikan data sudah benar sebelum menekan tombol{" "}
                      <strong>Save Changes</strong>.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
