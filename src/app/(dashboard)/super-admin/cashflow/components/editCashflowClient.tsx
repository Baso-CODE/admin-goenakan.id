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
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { apiUrl } from "@/helper/apiurl";
import { cn } from "@/lib/utils";

// === UTILS ===
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// === SCHEMA VALIDATION ===
// === HELPER AGAR TIDAK REPETITIF ===
// Terima apa saja (any), ubah jadi number. Kalau gagal/kosong jadi 0.
const anyToNumber = z.any().transform((val) => {
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
});

// Terima apa saja (any), ubah jadi number. Default 1 (untuk Qty/Rate).
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

      // PAKAI z.any() AGAR TYPESCRIPT TIDAK PROTES INPUT STRING
      unitPrice: anyToNumber,
      quantity: anyToNumberDefaultOne,

      currency: z.string().optional(),

      // Exchange rate: Terima any, return number (default 1)
      exchangeRate: anyToNumberDefaultOne,

      total: z.number(), // Calculated field
    }),
  ),
  costItems: z.array(
    z.object({
      isManual: z.boolean().default(false).optional(),
      description: z.string().min(1, "Description required"),
      vendorId: z.string().optional(),

      // PAKAI HELPER YANG SAMA
      costPerUnit: anyToNumber,
      quantity: anyToNumberDefaultOne,

      currency: z.string().optional(),
      exchangeRate: anyToNumberDefaultOne,

      total: z.number(),
    }),
  ),
});

type CashflowFormValues = z.infer<typeof cashflowSchema>;

type VendorItem = { id: string; name: string };
type Vendor = {
  id: string;
  companyName: string;
  items: VendorItem[];
};
type Currency = { code: string; symbol: string };

export default function EditCashflowClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Hardcoded Currency (Bisa fetch dari API jika perlu)
  const currencies: Currency[] = [
    { code: "IDR", symbol: "Rp" },
    { code: "USD", symbol: "$" },
    { code: "CNY", symbol: "¥" },
    { code: "SGD", symbol: "S$" },
  ];

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

  const revenueFields = useFieldArray({
    control,
    name: "revenueItems",
  });

  const costFields = useFieldArray({
    control,
    name: "costItems",
  });

  // === CALCULATIONS STATE ===
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
  });

  // Watch Changes for Realtime Calculation
  const revenues = watch("revenueItems");
  const costs = watch("costItems");

  useEffect(() => {
    const totalRev = revenues.reduce((acc, item) => {
      // Rumus: Unit Price * Qty * Rate
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
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Fetch Cashflow Detail
        const detailRes = await fetch(`${apiUrl}/cashflows/${orderId}`, {
          headers,
        });
        if (!detailRes.ok) throw new Error("Failed to load cashflow data");

        const detailData = await detailRes.json();
        setVendors(detailData.availableVendors || []);

        // 3. Populate Form
        reset({
          poNumber: detailData.summary.poNumber,
          revenueItems: detailData.revenues.map((r: any) => ({
            description: r.description,
            productId: r.productId || "",
            unitPrice: Number(r.unitPrice),
            quantity: Number(r.quantity),
            currency: r.currency || "IDR",
            exchangeRate: Number(r.exchangeRate) || 1,
            total: Number(r.total),
          })),
          costItems: detailData.costs.map((c: any) => ({
            isManual: !c.vendorId,
            description: c.description,
            vendorId: z.string().optional(),
            costPerUnit: Number(c.costPerUnit),
            quantity: Number(c.quantity),
            currency: c.currency || "IDR",
            exchangeRate: Number(c.exchangeRate) || 1,
            total: Number(c.total),
          })),
        });
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId, reset]);

  // === SUBMIT HANDLER ===
  const onSubmit = async (data: CashflowFormValues) => {
    try {
      setSubmitting(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Recalculate totals for payload safety
      const cleanData = {
        poNumber: data.poNumber,
        revenueItems: data.revenueItems.map((item) => ({
          ...item,
          total: item.unitPrice * item.quantity * (item.exchangeRate || 1),
        })),
        costItems: data.costItems.map((item) => ({
          ...item,
          vendorId: item.isManual ? null : item.vendorId,
          total: item.costPerUnit * item.quantity * (item.exchangeRate || 1),
        })),
      };

      const res = await fetch(`${apiUrl}/cashflows/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      });

      if (!res.ok) throw new Error("Failed to save cashflow");

      toast.success("Cashflow berhasil disimpan!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data");
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
    <div className="space-y-6 w-full  mx-auto pb-20">
      {/* Header & Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Update Cashflow</h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Banknote className="h-4 w-4" />
            <span>PO Number: </span>
            <Badge
              variant="outline"
              className="font-mono text-primary border-primary/30 bg-primary/5">
              {getValues("poNumber")}
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
                      Total: {formatCurrency(summary.totalRevenue)}
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

                        {/* Unit Price (IDR) */}
                        <div className="w-full md:w-32">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Unit Price (IDR)
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
                                (watch(`revenueItems.${index}.quantity`) || 0),
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
                          currency: "IDR",
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
                      Total: {formatCurrency(summary.totalCost)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 space-y-4">
                    {costFields.fields.map((field, index) => {
                      // 🔥 AMBIL STATUS MANUAL DARI WATCH
                      const isManual = watch(`costItems.${index}.isManual`);

                      return (
                        <div
                          key={field.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start border-b border-dashed pb-4 last:border-0 last:pb-0 bg-gray-50/50 p-3 rounded-md">
                          {/* 🔥 Row 1: Description & Vendor */}
                          <div className="md:col-span-5 space-y-3">
                            {/* 🔥 TOGGLE INPUT MANUAL / VENDOR */}
                            <div className="flex items-center gap-2 mb-1">
                              <Switch
                                checked={isManual}
                                onCheckedChange={(val) => {
                                  setValue(`costItems.${index}.isManual`, val);
                                  // Bersihkan kolom jika ganti mode
                                  setValue(`costItems.${index}.vendorId`, "");
                                  setValue(
                                    `costItems.${index}.description`,
                                    "",
                                  );
                                }}
                              />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                Input Manual?
                              </span>
                            </div>

                            {!isManual ? (
                              // 🔥 JIKA DARI VENDOR (TAMPILAN LAMA)
                              <div className="space-y-3">
                                <div>
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
                                          <SelectTrigger className="h-8 text-sm bg-white">
                                            <SelectValue placeholder="Select Vendor" />
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

                                <div>
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
                                            <SelectTrigger className="h-8 text-sm bg-white">
                                              <SelectValue placeholder="Select Item Type" />
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
                                                No items found.
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
                              // 🔥 JIKA INPUT MANUAL (TAMPILAN BARU)
                              <div className="pt-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Nama Pengeluaran / Deskripsi
                                </label>
                                <FormField
                                  control={control}
                                  name={`costItems.${index}.description`}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder="Contoh: Bensin, Makan Siang..."
                                      className="h-8 text-sm bg-white mt-1"
                                    />
                                  )}
                                />
                              </div>
                            )}
                          </div>

                          {/* Row 2: Financials (Currency, Cost, Rate, Qty) */}
                          <div className="md:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Curr
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.currency`}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={(val) => {
                                      field.onChange(val);
                                      if (val === "IDR")
                                        setValue(
                                          `costItems.${index}.exchangeRate`,
                                          1,
                                        );
                                    }}
                                    value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-8 text-sm bg-white">
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

                            <div>
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
                                    className="h-8 text-sm text-right bg-white"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Rate (IDR)
                              </label>
                              <FormField
                                control={control}
                                name={`costItems.${index}.exchangeRate`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-8 text-sm text-right bg-white"
                                    disabled={
                                      watch(`costItems.${index}.currency`) ===
                                      "IDR"
                                    }
                                  />
                                )}
                              />
                            </div>

                            <div>
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
                                    className="h-8 text-sm text-center bg-white"
                                  />
                                )}
                              />
                            </div>
                          </div>

                          {/* Delete & Total */}
                          <div className="md:col-span-1 flex flex-col items-end justify-between h-full py-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-600 mb-2"
                              onClick={() => costFields.remove(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-bold text-gray-700">
                              {formatCurrency(
                                (watch(`costItems.${index}.costPerUnit`) || 0) *
                                  (watch(`costItems.${index}.quantity`) || 0) *
                                  (watch(`costItems.${index}.exchangeRate`) ||
                                    1),
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {costFields.fields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-gray-50">
                        Belum ada pengeluaran diinput.
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 border-t flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        costFields.append({
                          isManual: false, // 🔥 SET DEFAULT VALUE ISMANUAL = FALSE
                          description: "",
                          vendorId: "",
                          costPerUnit: 0,
                          quantity: 1,
                          currency: "IDR",
                          exchangeRate: 1,
                          total: 0,
                        })
                      }
                      className="text-red-700 border-red-200 hover:bg-red-50">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Cost Item
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
                      Profit Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Revenue</span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(summary.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Cost</span>
                      <span className="font-semibold text-red-400">
                        ({formatCurrency(summary.totalCost)})
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
                        {formatCurrency(summary.profit)}
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
                      // Tambahkan parameter kedua untuk melihat error di console
                      onClick={form.handleSubmit(onSubmit, (errors) => {
                        console.log("VALIDASI GAGAL:", errors);
                        toast.error(
                          "Cek kembali isian form, ada yang belum lengkap/valid.",
                        );
                      })}
                      disabled={submitting}>
                      {submitting ? (
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
                      1. <strong>Revenue</strong> otomatis diambil dari order,
                      tapi bisa Anda sesuaikan jika ada biaya tambahan yang
                      ditagihkan.
                    </p>
                    <p>
                      2. Untuk <strong>Cost Luar Negeri</strong>, pilih mata
                      uang (misal USD), isi harga asli, lalu isi Rate sesuai
                      kurs saat bayar.
                    </p>
                    <p>
                      3. Pastikan memilih <strong>Vendor</strong> yang benar
                      untuk setiap pengeluaran agar report per vendor akurat.
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
