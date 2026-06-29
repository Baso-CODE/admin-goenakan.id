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
  Settings2,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation"; // ✨ Import useSearchParams
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import FastCurrencyForm from "@/app/(dashboard)/admin-invoice/currency/components/formCurrencyFast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../../purchase-channel/components/formPurchaseChannel";
import { OrderFormValues, orderSchema } from "../order-schema";
import { postOrder } from "../order-service";
import {
  Client,
  Currency,
  Product,
  PurchaseChannel,
  QuotationRef,
  SampleOrderRef,
} from "../types/order.types";
import { SampleFollowUpSection, SampleStepItem } from "./sampleFollowUpSection";

export default function AddOrderForm() {
  const { fetchApi, status } = useApi();
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

  // Master Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [quotationRefs, setQuotationRefs] = useState<QuotationRef[]>([]);
  const [sampleOrderRefs, setSampleOrderRefs] = useState<SampleOrderRef[]>([]);

  const [loading, setLoading] = useState(false);

  const [clientOpen, setClientOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  // Watchers
  const selectedClientId = watch("clientId");
  const salesCategory = watch("salesCategory");
  const selectedCurrencyCode = watch("currencyCode");
  const [sampleSteps, setSampleSteps] = useState<SampleStepItem[]>([]);

  // Load Initial Master Data (Tanpa Vendor)
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
        router.push("/orders?tab=sample");
      } else {
        router.push("/orders?tab=all");
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
                    {/* ✨ MODAL TAMBAH CHANNEL */}
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

              {/* <FormField
                control={control}
                name="salesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC Sales</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select sales person" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

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
                  const isCustomProduct = selectedProduct?.isCustom;

                  const subtotal =
                    (watch(`products.${index}.price`) || 0) *
                    (watch(`products.${index}.quantity`) || 0);

                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4 space-y-3">
                          <FormField
                            control={control}
                            name={`products.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="md:hidden">
                                  Product
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue(
                                      `products.${index}.variantId`,
                                      "",
                                    );
                                    const prod = products.find(
                                      (p) => p.id === val,
                                    );
                                    if (prod) {
                                      form.setValue(
                                        `products.${index}.price`,
                                        prod.isCustom
                                          ? 0
                                          : Number(prod.basePrice),
                                      );
                                    }
                                  }}>
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem
                                        key={p.id}
                                        value={p.id}
                                        textValue={p.name}>
                                        <div className="flex items-center justify-between w-full gap-4 min-w-50">
                                          <span className="font-medium truncate text-gray-700">
                                            {p.name}
                                          </span>
                                          {p.isCustom && (
                                            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                                              <Settings2 className="w-3 h-3" />
                                              <span className="text-[10px] font-bold tracking-wide">
                                                CUSTOM
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedProduct && (
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                SKU:{" "}
                                <span className="font-medium text-gray-800">
                                  {(selectedProduct as any).sku || "-"}
                                </span>
                              </span>
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                UOM:{" "}
                                <span className="font-medium text-gray-800">
                                  {(selectedProduct as any).uom || "-"}
                                </span>
                              </span>
                            </div>
                          )}

                          {isCustomProduct && (
                            <FormField
                              control={control}
                              name={`products.${index}.variantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={(val) => {
                                      field.onChange(val);
                                      const variant =
                                        selectedProduct?.productVariants.find(
                                          (v) => v.id === val,
                                        );
                                      if (variant)
                                        form.setValue(
                                          `products.${index}.price`,
                                          Number(variant.price),
                                        );
                                    }}>
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm bg-gray-50 border-dashed">
                                        <SelectValue placeholder="Select Variant" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {selectedProduct?.productVariants.map(
                                        (v) => (
                                          <SelectItem key={v.id} value={v.id}>
                                            {v.variantName}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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

                                        if (
                                          selectedProduct &&
                                          !selectedProduct.isCustom &&
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
                                      {currentCurrencySymbol}
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
                            {currentCurrencySymbol}{" "}
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

                      <div className="bg-gray-50/50 p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 rounded-b-lg">
                        <FormField
                          control={control}
                          name={`products.${index}.customization`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Add Customization details..."
                                    {...field}
                                    className="text-sm border-gray-200 pl-8 bg-white"
                                  />
                                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                                    <Settings2 className="w-4 h-4" />
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`products.${index}.remarks`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Internal remarks (optional)..."
                                    {...field}
                                    className="text-sm border-gray-200 pl-8 bg-white"
                                  />
                                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                      <line x1="16" y1="13" x2="8" y2="13" />
                                      <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
