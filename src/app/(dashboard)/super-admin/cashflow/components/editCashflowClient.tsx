"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Banknote,
  Calculator,
  Loader2,
  PlusCircle,
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
// Format dinamis menyesuaikan currency code
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
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
});
const anyToNumberDefaultOne = z.any().transform((val) => {
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
  const orderId = params.orderId as string;

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

  // === CALCULATIONS STATE ===
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
  });

  const revenues = watch("revenueItems");
  const costs = watch("costItems");

  useEffect(() => {
    const totalRev = revenues.reduce((acc, item) => {
      const val =
        (Number(item.unitPrice) || 0) *
        (Number(item.quantity) || 0) *
        (Number(item.exchangeRate) || 1);
      return acc + val;
    }, 0);

    const totalCst = costs.reduce((acc, item) => {
      const val =
        (Number(item.costPerUnit) || 0) *
        (Number(item.quantity) || 0) *
        (Number(item.exchangeRate) || 1);
      return acc + val;
    }, 0);

    setSummary({
      totalRevenue: totalRev,
      totalCost: totalCst,
      profit: totalRev - totalCst,
    });
  }, [revenues, costs]);

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

      // ✨ 1. Simpan SEMUA data vendor untuk Dropdown pilihan manual
      const allVendors = detailData.availableVendors || [];
      setVendors(allVendors);

      // ✨ 2. Ambil VENDOR KHUSUS dari PO untuk Auto-fill
      const fetchedPOVendors = detailData.poVendors || [];

      const bCurrency = detailData.summary?.baseCurrencyId || "IDR";
      setBaseCurrency(bCurrency);

      // ✨ 3. Logika Auto-fill menggunakan fetchedPOVendors
      const initialCostItems =
        detailData.costs && detailData.costs.length > 0
          ? detailData.costs.map((c: any) => ({
              isManual: !c.vendorId,
              description: c.description,
              vendorId: c.vendorId || "",
              costPerUnit: Number(c.costPerUnit),
              quantity: Number(c.quantity),
              currency: c.currencyCode || c.currency || bCurrency,
              exchangeRate: Number(c.exchangeRate) || 1,
              total: Number(c.total),
            }))
          : fetchedPOVendors.map((v: any) => ({
              // <-- Menggunakan data PO Vendor
              isManual: false,
              description: "",
              vendorId: v.id,
              costPerUnit: 0,
              quantity: 1,
              currency: bCurrency,
              exchangeRate: 1,
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

  // === FUNGSI AUTO CONVERT RATE ===
  const handleCurrencyChange = async (
    index: number,
    newCurrency: string,
    type: "cost" | "revenue",
  ) => {
    setValue(`${type}Items.${index}.currency` as any, newCurrency);

    if (newCurrency === baseCurrency) {
      setValue(`${type}Items.${index}.exchangeRate` as any, 1);
      return;
    }

    // 3. Panggil API Konversi
    try {
      setIsConvertingRate(true);
      const res = await fetchApi("/currencies/convert/rate", {
        method: "POST",
        body: JSON.stringify({
          fromCurrency: newCurrency,
          toCurrency: baseCurrency,
          amount: 1,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal mengkonversi kurs");
      }

      const data = await res.json();
      const rate = data.rate || data.data?.rate;

      setValue(`${type}Items.${index}.exchangeRate` as any, rate);
      toast.success(
        `Kurs ${newCurrency} ke ${baseCurrency} diperbarui (${rate})`,
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Gagal mendapatkan kurs otomatis, mohon isi manual.",
      );
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
        revenueItems: data.revenueItems.map((item) => ({
          ...item,
          total: item.unitPrice * item.quantity * (item.exchangeRate || 1),
        })),
        costItems: data.costItems.map((item) => ({
          ...item,
          vendorId: item.isManual ? undefined : item.vendorId,
          total: item.costPerUnit * item.quantity * (item.exchangeRate || 1),
        })),
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* === LEFT COLUMN: FORM INPUTS (Revenue & Cost) === */}
            <div className="xl:col-span-2 space-y-8">
              {/* --- 1. REVENUE SECTION --- */}
              <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                <CardHeader className="bg-emerald-50/30 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue (Pemasukan)
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      Total:{" "}
                      {formatCurrency(summary.totalRevenue, baseCurrency)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 space-y-4">
                    {revenueFields.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex flex-col md:flex-row gap-3 items-start border-b border-dashed pb-4 last:border-0 last:pb-0">
                        {/* Description */}
                        <div className="flex-1 w-full">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Description
                          </label>
                          <FormField
                            control={control}
                            name={`revenueItems.${index}.description`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                placeholder="Product Name / Service"
                                className="h-9 text-sm"
                              />
                            )}
                          />
                        </div>

                        {/* Unit Price Dinamis */}
                        <div className="w-full md:w-32">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block uppercase">
                            Unit Price (
                            {watch(`revenueItems.${index}.currency`) ||
                              baseCurrency}
                            )
                          </label>
                          <FormField
                            control={control}
                            name={`revenueItems.${index}.unitPrice`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                {...field}
                                className="h-9 text-sm text-right"
                              />
                            )}
                          />
                        </div>

                        {/* Qty */}
                        <div className="w-full md:w-20">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Qty
                          </label>
                          <FormField
                            control={control}
                            name={`revenueItems.${index}.quantity`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                {...field}
                                className="h-9 text-sm text-center"
                              />
                            )}
                          />
                        </div>

                        {/* Subtotal (Readonly) */}
                        <div className="w-full md:w-32 pt-6 text-right">
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(
                              (watch(`revenueItems.${index}.unitPrice`) || 0) *
                                (watch(`revenueItems.${index}.quantity`) || 0) *
                                (watch(`revenueItems.${index}.exchangeRate`) ||
                                  1),
                              baseCurrency,
                            )}
                          </span>
                        </div>

                        {/* Delete */}
                        <div className="pt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-red-600"
                            onClick={() => revenueFields.remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-3 border-t flex justify-center">
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
                      className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Revenue Item
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* --- 2. COST SECTION --- */}
              <Card className="border-t-4 border-t-red-500 shadow-sm">
                <CardHeader className="bg-red-50/30 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Cost (Pengeluaran)
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 hover:bg-red-200">
                      Total: {formatCurrency(summary.totalCost, baseCurrency)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 space-y-5">
                    {costFields.fields.map((field, index) => {
                      const isManual = watch(`costItems.${index}.isManual`);
                      const rowCurrency =
                        watch(`costItems.${index}.currency`) || baseCurrency;

                      return (
                        <div
                          key={field.id}
                          className="flex flex-col gap-4 border border-gray-200 shadow-sm bg-gray-50/30 p-4 rounded-xl">
                          <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
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
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Input Manual?
                              </span>
                            </div>
                          </div>

                          <div className="w-full">
                            {!isManual ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
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
                                        value={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 text-sm bg-white w-full">
                                            <SelectValue placeholder="Pilih Vendor" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
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
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
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
                                          value={field.value}
                                          disabled={!currentVendorId}>
                                          <FormControl>
                                            <SelectTrigger className="h-10 text-sm bg-white w-full">
                                              <SelectValue placeholder="Pilih Item" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {vendorItems.length > 0 ? (
                                              vendorItems.map((item) => (
                                                <SelectItem
                                                  key={item.id}
                                                  value={item.name}>
                                                  {item.name}
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <div className="p-2 text-xs text-muted-foreground text-center">
                                                Item kosong
                                              </div>
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
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Nama Pengeluaran / Deskripsi
                                </label>
                                <FormField
                                  control={control}
                                  name={`costItems.${index}.description`}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder="Contoh: Bensin Operasional, Makan Siang..."
                                      className="h-10 text-sm bg-white"
                                    />
                                  )}
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 items-end bg-white p-3.5 rounded-lg border border-gray-100 shadow-sm mt-1">
                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                Curr{" "}
                                {isConvertingRate && (
                                  <Loader2 className="w-2 h-2 animate-spin text-primary" />
                                )}
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.currency`}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={(val) =>
                                      handleCurrencyChange(index, val, "cost")
                                    }
                                    value={field.value}>
                                    <FormControl>
                                      <SelectTrigger
                                        className="h-9 text-sm bg-white"
                                        disabled={isConvertingRate}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
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

                            {/* Cost/Unit */}
                            <div className="col-span-1 lg:col-span-3 space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Cost/Unit
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.costPerUnit`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-9 text-sm text-right bg-white"
                                  />
                                )}
                              />
                            </div>

                            {/* Rate Otomatis/Manual */}
                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Rate ({baseCurrency})
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.exchangeRate`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-9 text-sm text-right bg-gray-50"
                                    disabled={
                                      rowCurrency === baseCurrency ||
                                      isConvertingRate
                                    }
                                  />
                                )}
                              />
                            </div>

                            {/* Qty */}
                            <div className="col-span-1 lg:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Qty
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.quantity`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-9 text-sm text-center bg-white"
                                  />
                                )}
                              />
                            </div>

                            {/* Total & Delete */}
                            <div className="col-span-2 lg:col-span-3 flex justify-end items-center gap-4 h-9">
                              <div className="flex flex-col items-end leading-none justify-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  Total {baseCurrency}
                                </span>
                                <span className="text-[15px] font-bold text-red-600 leading-none">
                                  {formatCurrency(
                                    (watch(`costItems.${index}.costPerUnit`) ||
                                      0) *
                                      (watch(`costItems.${index}.quantity`) ||
                                        0) *
                                      (watch(
                                        `costItems.${index}.exchangeRate`,
                                      ) || 1),
                                    baseCurrency,
                                  )}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:bg-red-100 hover:text-red-600 shrink-0"
                                onClick={() => costFields.remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {costFields.fields.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-gray-50">
                        Belum ada pengeluaran diinput.
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50/80 p-4 border-t border-gray-200 flex justify-center rounded-b-lg">
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
                      className="text-red-700 border-red-200 hover:bg-red-50 bg-white shadow-sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                      Baru
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* === RIGHT COLUMN: SUMMARY STICKY === */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 space-y-6">
                <Card className="shadow-lg border-t-0 bg-slate-900 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-400" />
                      Profit Analysis ({baseCurrency})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Revenue</span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(summary.totalRevenue, baseCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Cost</span>
                      <span className="font-semibold text-red-400">
                        ({formatCurrency(summary.totalCost, baseCurrency)})
                      </span>
                    </div>
                    <Separator className="bg-slate-700 my-2" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Net Profit</span>
                      <span
                        className={cn(
                          "font-bold font-mono",
                          summary.profit >= 0
                            ? "text-emerald-400"
                            : "text-red-400",
                        )}>
                        {formatCurrency(summary.profit, baseCurrency)}
                      </span>
                    </div>

                    {/* Margin Calc */}
                    {summary.totalRevenue > 0 && (
                      <div className="text-right text-xs text-slate-500">
                        Margin:{" "}
                        {(
                          (summary.profit / summary.totalRevenue) *
                          100
                        ).toFixed(2)}
                        %
                      </div>
                    )}

                    <Button
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-800">
                      Tips Pengisian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-blue-700 space-y-2">
                    <p>
                      1. <strong>Mata Uang Utama:</strong> Halaman ini
                      disesuaikan dengan mata uang awal Order ({baseCurrency}).
                    </p>
                    <p>
                      2. Jika Anda memilih mata uang pengeluaran yang berbeda
                      (misal USD), sistem akan mengontak server untuk mengambil{" "}
                      <strong>kurs terkini</strong>.
                    </p>
                    <p>
                      3. Anda tetap bisa mengubah nilai <strong>Rate</strong>{" "}
                      tersebut secara manual jika diperlukan.
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
