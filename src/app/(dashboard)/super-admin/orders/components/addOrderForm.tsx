"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bookmark,
  Check,
  ChevronsUpDown,
  DollarSign,
  FileText,
  FlaskConical,
  Plus,
  PlusCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation"; //  Import useSearchParams
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import FastCurrencyForm from "@/app/(dashboard)/admin-invoice/currency/components/formCurrencyFast";
import { ClientData } from "@/app/(dashboard)/admin-invoice/quotations/components/quotationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useCurrencyConvert } from "@/hooks/use-currency-convert";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import ClientAddForm from "../../clients/components/addClientForm";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../../purchase-channel/components/formPurchaseChannel";
import { OrderFormValues, orderSchema } from "../order-schema";
import { postOrder } from "../order-service";
import {
  Currency,
  Product,
  PurchaseChannel,
  QuotationRef,
  SampleOrderRef,
} from "../types/order.types";
import { SampleFollowUpSection, SampleStepItem } from "./sampleFollowUpSection";

export default function AddOrderForm() {
  const { fetchApi, status } = useApi();
  const { convert, loading: convertLoading } = useCurrencyConvert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const defaultCategory = typeParam === "SAMPLE" ? "SAMPLE" : "SALES";

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      dateOrder: new Date().toISOString().split("T")[0],
      salesCategory: defaultCategory,
      warrantyDays: 30,
      clientPoNumber: "",
      remark: "",
      currencyCode: "",
      referenceQuotationId: "",
      referenceSampleId: "",

      clientId: "",
      clientB2BPICId: "",
      purchaseChannelId: "",
      phone: "",
      shippingAddress: "",
      products: [
        {
          productId: "",
          variantId: "",
          quantity: 1,
          price: 0,
          customization: "",
          remarks: "",
        },
      ],
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [quotationRefs, setQuotationRefs] = useState<QuotationRef[]>([]);
  const [sampleOrderRefs, setSampleOrderRefs] = useState<SampleOrderRef[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [clientOpen, setClientOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState<Record<number, boolean>>({});
  // 👆 ------------------- 👆
  // Watchers
  const selectedClientId = watch("clientId");
  const salesCategory = watch("salesCategory");
  const selectedCurrencyCode = watch("currencyCode");
  const [baseCurrencyCode, setBaseCurrencyCode] = useState("IDR");
  const [isConvertingPrices, setIsConvertingPrices] = useState(false);

  const [sampleSteps, setSampleSteps] = useState<SampleStepItem[]>([]);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;

      try {
        setLoading(true);

        const [resC, resP, resPC, resCur, resQ, resSamp] = await Promise.all([
          fetchApi("/clients/order"),
          fetchApi("/products/order"),
          fetchApi("/purchase-channels/list"),
          fetchApi("/currencies"),
          fetchApi("/quotations/list-references"),
          fetchApi("/orders/list-samples"),
        ]);

        if (!resC.ok || !resP.ok || !resPC.ok) {
          throw new Error("Gagal mengambil data master inti");
        }

        const c = await resC.json();
        const p = await resP.json();
        const pc = await resPC.json();

        const jsonCur = resCur.ok ? await resCur.json() : null;
        const jsonQ = resQ.ok ? await resQ.json() : null;
        const jsonSamp = resSamp.ok ? await resSamp.json() : null;

        const curData = jsonCur?.data || jsonCur || [];
        const qData = jsonQ?.data || jsonQ || [];
        const sampData = jsonSamp?.data || jsonSamp || [];

        setClients(c);
        setProducts(p);
        setPurchaseChannels(pc);

        setCurrencies(
          curData.length
            ? curData
            : [{ code: "IDR", symbol: "Rp", name: "Rupiah" }],
        );
        setQuotationRefs(qData);
        setSampleOrderRefs(sampData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load master data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, fetchApi]);

  const selectedClientData = clients.find((c) => c.id === selectedClientId);
  const isB2B = selectedClientData?.type === "B2B";
  const availablePics = selectedClientData?.pics || [];

  // Sync logistik dari data Client
  useEffect(() => {
    if (selectedClientData) {
      setValue("shippingAddress", selectedClientData.address);

      if (selectedClientData.type === "B2C") {
        setValue("phone", selectedClientData.phone);
      } else {
        setValue("phone", "");
        setValue("clientB2BPICId", "");
      }

      if (selectedClientData.purchaseChannelId) {
        setValue("purchaseChannelId", selectedClientData.purchaseChannelId);
      } else {
        setValue("purchaseChannelId", "");
      }
    }
  }, [selectedClientId, selectedClientData, setValue]);

  const selectedPicId = watch("clientB2BPICId");
  useEffect(() => {
    if (isB2B && selectedPicId) {
      const pic = availablePics.find((p) => p.id === selectedPicId);
      if (pic && (pic as any).phone) {
        setValue("phone", (pic as any).phone);
      }
    }
  }, [selectedPicId, isB2B, availablePics, setValue]);

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      const { phone, ...payload } = data;

      if (!payload.referenceQuotationId) delete payload.referenceQuotationId;
      if (!payload.referenceSampleId) delete payload.referenceSampleId;

      await postOrder(fetchApi, {
        ...payload,
        sampleFollowUps: sampleSteps
          .filter((s) => s.enabled && s.date)
          .map((s) => ({ name: s.name, date: s.date })),
      });

      toast.success("Order created successfully");
      form.reset();
      setSampleSteps([]);
      if (data.salesCategory === "SAMPLE") {
        router.push("/super-admin/orders?tab=sample");
      } else {
        router.push("/super-admin/orders?tab=all");
      }
    } catch {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  // 3. Tambahkan fungsi handler ini
  const handleAddChannelFast = async (data: PurchaseChannelFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/purchase-channels", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create purchase channel");
      }

      const responseData = await res.json();
      const newChannel = responseData.data || responseData;

      setPurchaseChannels((prev) => [...prev, newChannel]);

      form.setValue("purchaseChannelId", newChannel.id);

      // Tutup modal
      setIsChannelModalOpen(false);
      toast.success("Purchase Channel berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat channel.");
    }
  };

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

      setCurrencies((prev) => [...prev, newCurrency]);
      form.setValue("currencyCode", newCurrency.code);
      setIsCurrencyModalOpen(false);
      toast.success("Currency berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat currency.");
    }
  };

  const currentCurrencySymbol =
    currencies.find((c) => c.code === selectedCurrencyCode)?.symbol || "Rp";

  useEffect(() => {
    if (
      selectedCurrencyCode &&
      selectedCurrencyCode !== baseCurrencyCode &&
      fields.length > 0
    ) {
      const hasNonZeroPrices = fields.some((_, idx) => {
        const price = watch(`products.${idx}.price`);
        return price && price > 0;
      });

      if (hasNonZeroPrices) {
        console.log("✅ Setting isConvertingPrices to true");
        setIsConvertingPrices(true);
      }
    }
  }, [selectedCurrencyCode, baseCurrencyCode, fields.length]);

  const convertAllPrices = async () => {
    if (!selectedCurrencyCode) {
      toast.error("❌ Pilih currency terlebih dahulu");
      return;
    }

    if (!baseCurrencyCode) {
      toast.error("❌ Base currency tidak valid");
      return;
    }

    if (selectedCurrencyCode === baseCurrencyCode) {
      toast.info("ℹ️ Currency sama, tidak perlu konversi");
      setIsConvertingPrices(false);
      return;
    }

    console.log("🔄 Starting conversion...", {
      from: baseCurrencyCode,
      to: selectedCurrencyCode,
    });

    try {
      let convertedCount = 0;

      for (let i = 0; i < fields.length; i++) {
        const currentPrice = watch(`products.${i}.price`);

        if (!currentPrice || currentPrice <= 0) {
          console.log(`Product ${i}: Skipped (price: ${currentPrice})`);
          continue;
        }

        console.log(
          `Converting ${currentPrice} from ${baseCurrencyCode} to ${selectedCurrencyCode}`,
        );

        const result = await convert(
          baseCurrencyCode,
          selectedCurrencyCode,
          currentPrice,
        );

        if (result?.success) {
          console.log(`✅ Product ${i} converted:`, result);
          form.setValue(
            `products.${i}.price`,
            parseFloat(result.convertedAmount.toFixed(2)),
          );
          convertedCount++;
        } else {
          console.warn(`⚠️ Product ${i} conversion failed`, result);
        }
      }

      if (convertedCount > 0) {
        toast.success(
          `✅ ${convertedCount} produk dikonversi ke ${selectedCurrencyCode}`,
        );
        setIsConvertingPrices(false);
        setBaseCurrencyCode(selectedCurrencyCode);
      } else {
        toast.info("ℹ️ Tidak ada produk yang dikonversi");
      }
    } catch (error) {
      console.error("❌ Conversion error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal konversi harga",
      );
    }
  };
  const titleText =
    salesCategory === "SAMPLE" ? "Create Sample Order" : "Create Sales Order";
  return (
    <Card className="space-y-4 mx-auto w-full">
      <CardHeader className="border-b p-6">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          {salesCategory === "SAMPLE" ? (
            <FlaskConical className="h-6 w-6 text-indigo-600" />
          ) : (
            <ShoppingBag className="h-6 w-6 text-blue-600" />
          )}
          {titleText}
        </CardTitle>
      </CardHeader>

      {isConvertingPrices && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium text-blue-900 flex items-center gap-2">
              🔄 Konversi Harga Produk?
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Kamu mengubah currency dari <strong>{baseCurrencyCode}</strong> ke{" "}
              <strong>{selectedCurrencyCode}</strong>. Klik tombol dibawah untuk
              konversi semua harga otomatis dengan rate terkini dari
              exchangerate.host.
            </p>
          </div>
          <div className="flex gap-2 ml-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConvertingPrices(false)}
              size="sm">
              Biarkan Manual
            </Button>
            <Button
              type="button"
              onClick={convertAllPrices}
              disabled={convertLoading}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm">
              {convertLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Converting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Konversi Semua
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* === SECTION 1: ORDER DETAILS === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50/50 items-start">
              <h3 className="col-span-full font-medium text-lg text-gray-700">
                Order Details
              </h3>

              <FormField
                control={control}
                name="dateOrder"
                render={({ field }) => {
                  let parsedDate: Date | undefined = undefined;
                  if (field.value) {
                    const d = new Date(field.value);
                    if (!isNaN(d.getTime())) {
                      parsedDate = d;
                    }
                  }

                  return (
                    <FormItem className="flex flex-col gap-1 mt-1.5">
                      <FormLabel>Date Order</FormLabel>
                      <DatePickerHelper
                        date={parsedDate}
                        setDate={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : "",
                          );
                        }}
                        placeholder="Pilih Tanggal Order"
                      />
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={control}
                name="salesCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={true}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10 opacity-70 cursor-not-allowed">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="SAMPLE">Sample</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Kategori dikunci berdasarkan tipe order yang dipilih.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-stone-500" /> Currency
                    </FormLabel>

                    <Dialog
                      open={isCurrencyModalOpen}
                      onOpenChange={setIsCurrencyModalOpen}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Tambah Currency Baru</DialogTitle>
                        </DialogHeader>
                        <FastCurrencyForm onSubmit={handleAddCurrencyFast} />
                      </DialogContent>
                    </Dialog>

                    <Select
                      onValueChange={(val) => {
                        if (val === "add_new_currency") {
                          setIsCurrencyModalOpen(true);
                        } else {
                          field.onChange(val);
                        }
                      }}
                      value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Currency" />
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
                          textValue="Buat Currency Baru"
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

              {salesCategory === "SALES" && (
                <FormField
                  control={control}
                  name="clientPoNumber"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Client PO Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter client PO reference number"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={control}
                name="warrantyDays"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Warranty Period (After Arrival)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select warranty period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Tidak Ada Garansi</SelectItem>
                        <SelectItem value="10">10 Hari</SelectItem>
                        <SelectItem value="20">20 Hari</SelectItem>
                        <SelectItem value="30">30 Hari</SelectItem>
                        <SelectItem value="60">60 Hari</SelectItem>
                        <SelectItem value="90">90 Hari</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Masa aktif garansi dimulai otomatis ketika barang diterima
                      oleh pelanggan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {salesCategory === "SAMPLE" && (
                <div className="col-span-full">
                  <SampleFollowUpSection onChange={setSampleSteps} />
                </div>
              )}
            </div>

            {/* === SECTION 2: DOCUMENT REFERENCES === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="col-span-full font-medium text-lg text-gray-700">
                Document References
              </h3>

              <FormField
                control={control}
                name="referenceQuotationId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-4 h-4 text-stone-500" /> Quotation
                      No. Reference (Optional)
                    </FormLabel>
                    <Popover open={quoteOpen} onOpenChange={setQuoteOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-10 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? quotationRefs.find((q) => q.id === field.value)
                                  ?.quotationNumber
                              : "Pilih nomor penawaran / quotation..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nomor quotation..." />
                          <CommandList>
                            <CommandEmpty>
                              Quotation tidak ditemukan.
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setValue("referenceQuotationId", "");
                                  setQuoteOpen(false);
                                }}
                                className="italic text-muted-foreground">
                                -- Tanpa Referensi Quotation --
                              </CommandItem>
                              {quotationRefs.map((q) => (
                                <CommandItem
                                  key={q.id}
                                  value={`${q.quotationNumber}-${q.id}`}
                                  onSelect={() => {
                                    setValue("referenceQuotationId", q.id);
                                    setQuoteOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      q.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {q.quotationNumber}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {salesCategory === "SALES" && (
                <FormField
                  control={control}
                  name="referenceSampleId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-1.5 mb-1.5">
                        <Bookmark className="w-4 h-4 text-stone-500" /> Sample
                        No. Reference (Optional)
                      </FormLabel>
                      <Popover open={sampleOpen} onOpenChange={setSampleOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between h-10 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value
                                ? sampleOrderRefs.find(
                                    (s) => s.id === field.value,
                                  )?.orderNumber
                                : "Pilih nomor produksi sample terdahulu..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari nomor produksi sample..." />
                            <CommandList>
                              <CommandEmpty>
                                Data sample tidak ditemukan.
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() => {
                                    setValue("referenceSampleId", "");
                                    setSampleOpen(false);
                                  }}
                                  className="italic text-muted-foreground">
                                  -- Tanpa Referensi Sample --
                                </CommandItem>
                                {sampleOrderRefs.map((s) => (
                                  <CommandItem
                                    key={s.id}
                                    value={`${s.orderNumber}-${s.id}`}
                                    onSelect={() => {
                                      setValue("referenceSampleId", s.id);
                                      setSampleOpen(false);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        s.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {s.orderNumber}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* === SECTION 3: CUSTOMER & LOGISTICS === */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Customer & Logistics
              </h3>
              <FormField
                control={control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client / PIC</FormLabel>

                    <Dialog
                      open={isClientModalOpen}
                      onOpenChange={setIsClientModalOpen}>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Tambah Client Baru</DialogTitle>
                        </DialogHeader>
                        <ClientAddForm
                          onSuccess={(newClient: ClientData) => {
                            setClients((prev) => [...prev, newClient]);
                            form.setValue("clientId", newClient.id);
                            setIsClientModalOpen(false);
                            setClientOpen(false);
                          }}
                          isModal={true}
                        />
                      </DialogContent>
                    </Dialog>

                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-10",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? clients.find((c) => c.id === field.value)?.name
                              : "Select client..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search client name..." />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  value={`${client.name}-${client.id}`}
                                  key={client.id}
                                  onSelect={() => {
                                    form.setValue("clientId", client.id);
                                    if (client.type === "B2B")
                                      form.setValue("clientB2BPICId", "");
                                    setClientOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {client.name}
                                </CommandItem>
                              ))}
                              <div className="h-px bg-stone-200 my-1" />
                              <CommandItem
                                value="add_new_client"
                                onSelect={() => setIsClientModalOpen(true)}
                                className="text-blue-600 font-semibold cursor-pointer">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Client Baru...
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isB2B && (
                <FormField
                  control={control}
                  name="clientB2BPICId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select PIC (Person In Charge)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select PIC from company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePics.length > 0 ? (
                            availablePics.map((pic) => (
                              <SelectItem key={pic.id} value={pic.id}>
                                {pic.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No PIC data available.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className="bg-gray-100 h-10"
                        placeholder="Auto-filled from client"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="purchaseChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Channel</FormLabel>
                    {/*  MODAL TAMBAH CHANNEL */}
                    <Dialog
                      open={isChannelModalOpen}
                      onOpenChange={setIsChannelModalOpen}>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            Tambah Purchase Channel Baru
                          </DialogTitle>
                        </DialogHeader>
                        <PurchaseChannelForm onSubmit={handleAddChannelFast} />
                      </DialogContent>
                    </Dialog>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        if (val === "add_new_channel") {
                          setIsChannelModalOpen(true);
                        } else {
                          field.onChange(val);
                        }
                      }}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purchaseChannels.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}

                        {/* Garis Pemisah */}
                        <div className="h-px bg-stone-200 my-1 mx-2" />
                        <SelectItem
                          value="add_new_channel"
                          textValue="Buat Channel Baru"
                          className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Buat Channel Baru...
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Shipping address"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 4: SALES & REMARK (Vendor Dihapus) === */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Internal
              </h3>

              <FormField
                control={control}
                name="remark"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Order Remark / Catatan Internal (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ketik keterangan atau informasi penting pelengkap order disini..."
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 5: PRODUCTS === */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xl text-gray-800">
                  Order Products
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      productId: "",
                      variantId: "",
                      quantity: 1,
                      price: 0,
                      customization: "",
                      remarks: "",
                      selectedAttributes: {},
                    })
                  }
                  className="border-dashed border-gray-400 hover:border-gray-600 hover:bg-gray-50">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-[#975a3e] rounded-t-lg font-medium text-sm text-gray-100">
                  <div className="col-span-4">Product Details</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3">Unit Price</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const currentProductId = watch(`products.${index}.productId`);
                  const selectedProduct = products.find(
                    (p) => p.id === currentProductId,
                  );

                  const currentSelectedAttrs =
                    watch(`products.${index}.selectedAttributes`) || {};
                  const subtotal =
                    (watch(`products.${index}.price`) || 0) *
                    (watch(`products.${index}.quantity`) || 0);

                  const handleAttributeSelect = (
                    attributeId: string,
                    valueId: string,
                  ) => {
                    const newAttrs = {
                      ...currentSelectedAttrs,
                      [attributeId]: valueId,
                    };
                    form.setValue(
                      `products.${index}.selectedAttributes`,
                      newAttrs,
                    );

                    if (selectedProduct?.availableAttributes) {
                      // Cek apakah semua atribut yang dibutuhkan sudah dipilih
                      const isAllSelected =
                        selectedProduct.availableAttributes.every(
                          (attr) => newAttrs[attr.attributeId],
                        );

                      if (isAllSelected) {
                        // Cari varian yang combinationIds-nya sama persis dengan yang dipilih
                        const selectedValIds = Object.values(newAttrs);
                        const matchedVariant =
                          selectedProduct.productVariants.find(
                            (v) =>
                              v.combinationIds.length ===
                                selectedValIds.length &&
                              v.combinationIds.every((id) =>
                                selectedValIds.includes(id),
                              ),
                          );

                        if (matchedVariant) {
                          form.setValue(
                            `products.${index}.variantId`,
                            matchedVariant.id,
                          );
                          form.setValue(
                            `products.${index}.price`,
                            Number(matchedVariant.price),
                          );
                        } else {
                          form.setValue(`products.${index}.variantId`, "");
                          toast.warning(
                            "Kombinasi varian ini tidak ditemukan.",
                          );
                        }
                      }
                    }
                  };

                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4 space-y-4">
                          {/* 1. SEARCHABLE PRODUCT DROPDOWN (COMBOBOX) */}
                          <FormField
                            control={control}
                            name={`products.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="md:hidden">
                                  Product
                                </FormLabel>
                                <Popover
                                  open={openCombobox[index]}
                                  onOpenChange={(val) =>
                                    setOpenCombobox((prev) => ({
                                      ...prev,
                                      [index]: val,
                                    }))
                                  }>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between h-10 font-normal",
                                          !field.value &&
                                            "text-muted-foreground",
                                        )}>
                                        {field.value
                                          ? products.find(
                                              (p) => p.id === field.value,
                                            )?.name
                                          : "Search Product..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-[300px] p-0"
                                    align="start">
                                    <Command>
                                      <CommandInput placeholder="Search by name or SKU..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          Product not found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {products.map((p) => (
                                            <CommandItem
                                              key={p.id}
                                              value={`${p.name} ${p.sku}`}
                                              onSelect={() => {
                                                field.onChange(p.id);
                                                form.setValue(
                                                  `products.${index}.variantId`,
                                                  "",
                                                );
                                                form.setValue(
                                                  `products.${index}.selectedAttributes`,
                                                  {},
                                                );
                                                form.setValue(
                                                  `products.${index}.price`,
                                                  p.productVariants?.length
                                                    ? 0
                                                    : Number(p.basePrice),
                                                );
                                                setOpenCombobox((prev) => ({
                                                  ...prev,
                                                  [index]: false,
                                                }));
                                              }}>
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  p.id === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span>{p.name}</span>
                                                <span className="text-xs text-gray-500">
                                                  SKU: {p.sku}
                                                </span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedProduct && (
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                SKU:{" "}
                                <span className="font-medium text-gray-800">
                                  {selectedProduct.sku || "-"}
                                </span>
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                UOM:{" "}
                                <span className="font-medium text-gray-800">
                                  {selectedProduct.uom || "-"}
                                </span>
                              </span>
                            </div>
                          )}

                          {/* 2. DYNAMIC ATTRIBUTE SELECTION */}
                          {selectedProduct?.availableAttributes &&
                            selectedProduct.availableAttributes.length > 0 && (
                              <div className="bg-gray-50 border rounded-md p-3 space-y-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  Select Attributes:
                                </p>
                                {selectedProduct.availableAttributes.map(
                                  (attr) => (
                                    <div
                                      key={attr.attributeId}
                                      className="flex flex-col space-y-1">
                                      <label className="text-xs text-gray-500">
                                        {attr.attributeName}
                                      </label>
                                      <Select
                                        value={
                                          currentSelectedAttrs[
                                            attr.attributeId
                                          ] || ""
                                        }
                                        onValueChange={(val) =>
                                          handleAttributeSelect(
                                            attr.attributeId,
                                            val,
                                          )
                                        }>
                                        <SelectTrigger className="h-8 text-sm bg-white">
                                          <SelectValue
                                            placeholder={`Select ${attr.attributeName}`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {attr.values.map((val) => (
                                            <SelectItem
                                              key={val.valueId}
                                              value={val.valueId}>
                                              {val.value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                          <FormField
                            control={control}
                            name={`products.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="md:hidden">
                                  Quantity
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        field.onChange(isNaN(val) ? 0 : val);

                                        // Logika Price Tier
                                        if (
                                          selectedProduct &&
                                          !selectedProduct.productVariants
                                            ?.length &&
                                          selectedProduct.priceTiers?.length > 0
                                        ) {
                                          const tiers = [
                                            ...selectedProduct.priceTiers,
                                          ].sort(
                                            (a, b) =>
                                              b.minQuantity - a.minQuantity,
                                          );
                                          const applicableTier = tiers.find(
                                            (tier) => val >= tier.minQuantity,
                                          );
                                          form.setValue(
                                            `products.${index}.price`,
                                            applicableTier
                                              ? Number(applicableTier.price)
                                              : Number(
                                                  selectedProduct.basePrice,
                                                ),
                                          );
                                        }
                                      }}
                                      className="text-center h-10"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium pointer-events-none">
                                      {selectedProduct?.uom}
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <FormField
                            control={control}
                            name={`products.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="md:hidden">
                                  Unit Price
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-medium">
                                      {currentCurrencySymbol || "Rp"}
                                    </span>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        field.onChange(isNaN(val) ? 0 : val);
                                      }}
                                      className="pl-9 h-10 text-right font-mono"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-col justify-center items-end h-10 pt-8 md:pt-0">
                          <span className="md:hidden text-xs text-gray-500 mb-1">
                            Subtotal
                          </span>
                          <span className="font-semibold text-gray-900 font-mono">
                            {currentCurrencySymbol || "Rp"}{" "}
                            {subtotal.toLocaleString("id-ID", {
                              minimumFractionDigits: 0,
                            })}
                          </span>
                        </div>

                        <div className="md:col-span-1 flex justify-center pt-8 md:pt-0">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Additional Details (Customization & Remarks) */}
                      <div className="bg-gray-50/50 p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 rounded-b-lg">
                        {/* ... Kode input customization dan remarks tetap sama ... */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="text-md" disabled={loading}>
              {loading ? "Submitting Order..." : "Create Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
