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
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useCurrencyConvert } from "@/hooks/use-currency-convert";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronsUpDown,
  DollarSign,
  FileText,
  Layers,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  SampleFollowUpSection,
  SampleStepItem,
} from "../../components/sampleFollowUpSection";
import { OrderFormValues, orderSchema } from "../../order-schema";
import { updateOrder } from "../../order-service";
import {
  Client,
  Currency,
  Product,
  PurchaseChannel,
  QuotationRef,
  SampleOrderRef,
} from "../../types/order.types";

export default function EditOrderForm() {
  const { fetchApi, status } = useApi();
  const { convert, loading: convertLoading } = useCurrencyConvert();

  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      dateOrder: "",
      salesCategory: "SALES",
      clientPoNumber: "",
      remark: "",
      currencyCode: "IDR",
      referenceQuotationId: "",
      referenceSampleId: "",
      clientId: "",
      clientB2BPICId: "",
      purchaseChannelId: "",
      phone: "",
      shippingAddress: "",
      products: [],
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Master data
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [quotationRefs, setQuotationRefs] = useState<QuotationRef[]>([]);
  const [sampleOrderRefs, setSampleOrderRefs] = useState<SampleOrderRef[]>([]);
  const [sampleSteps, setSampleSteps] = useState<SampleStepItem[]>([]);
  const [initialFollowUps, setInitialFollowUps] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>("PENDING");
  const [openCombobox, setOpenCombobox] = useState<Record<number, boolean>>({});
  // Popover open states
  const [clientOpen, setClientOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  // Watchers
  const salesCategory = watch("salesCategory");
  const selectedClientId = watch("clientId");
  const selectedCurrencyCode = watch("currencyCode");
  const selectedPicId = watch("clientB2BPICId");
  const isPending = orderStatus === "PENDING";

  const currentCurrencySymbol =
    currencies.find((c) => c.code === selectedCurrencyCode)?.symbol || "Rp";

  const selectedClientData = clients.find((c) => c.id === selectedClientId);
  const isB2B = selectedClientData?.type === "B2B";
  const availablePics = selectedClientData?.pics || [];

  // Load semua data termasuk order yang akan diedit
  useEffect(() => {
    async function loadData() {
      if (status !== "authenticated" || !orderId) return;
      try {
        setLoading(true);
        const [resC, resS, resV, resP, resPC, resCur, resQ, resSamp, resOrder] =
          await Promise.all([
            fetchApi("/clients/order"),
            fetchApi("/sales/order"),
            fetchApi("/vendors/order/add"),
            fetchApi("/products/order"),
            fetchApi("/purchase-channels/list"),
            fetchApi("/currencies"),
            fetchApi("/quotations/list-references"),
            fetchApi("/orders/list-samples"),
            fetchApi(`/orders/${orderId}/edit-data`),
          ]);

        const c = await resC.json();
        const p = await resP.json();
        const pc = await resPC.json();
        const jsonCur = resCur.ok ? await resCur.json() : null;
        const jsonQ = resQ.ok ? await resQ.json() : null;
        const jsonSamp = resSamp.ok ? await resSamp.json() : null;
        const orderData = await resOrder.json();
        console.log("📦 [DEBUG] Data Order dari Backend:", orderData);

        setClients(c);
        setProducts(p);
        setPurchaseChannels(pc);

        const curData = jsonCur?.data || jsonCur || [];
        const qData = jsonQ?.data || jsonQ || [];
        const sampData = jsonSamp?.data || jsonSamp || [];

        setCurrencies(
          curData.length
            ? curData
            : [{ code: "IDR", symbol: "Rp", name: "Rupiah" }],
        );
        setQuotationRefs(qData);
        setSampleOrderRefs(sampData);

        if (orderData.sampleFollowUps) {
          setInitialFollowUps(orderData.sampleFollowUps);
        }
        setOrderStatus(orderData.status || "PENDING");

        const selectedClient = c.find(
          (cl: any) => cl.id === orderData.clientId,
        );
        const selectedPic = selectedClient?.pics?.find(
          (pic: any) => pic.id === orderData.clientB2BPICId,
        );
        const phoneValue = selectedPic?.phone || selectedClient?.phone || "";

        initialClientId.current = orderData.clientId;
        initialPicId.current = orderData.clientB2BPICId || "";

        reset({
          dateOrder: orderData.dateOrder,
          salesCategory: orderData.salesCategory,
          clientPoNumber: orderData.clientPoNumber || "",
          remark: orderData.remark || "",
          currencyCode: orderData.currencyCode || "IDR",
          referenceQuotationId: orderData.referenceQuotationId || "",
          referenceSampleId: orderData.referenceSampleId || "",
          clientId: orderData.clientId,
          clientB2BPICId: orderData.clientB2BPICId || "",
          purchaseChannelId: orderData.purchaseChannelId || "",
          phone: phoneValue,
          shippingAddress: orderData.shippingAddress || "",
          products: orderData.products.map((item: any) => {
            let initialAttrs: Record<string, string> = {};

            if (item.selectedAttributes) {
              if (typeof item.selectedAttributes === "object") {
                initialAttrs = item.selectedAttributes;
              } else if (typeof item.selectedAttributes === "string") {
                try {
                  initialAttrs = JSON.parse(item.selectedAttributes);
                } catch (error) {
                  console.error("Gagal parse selectedAttributes:", error);
                }
              }
            }

            return {
              productId: item.productId,
              variantId: item.variantId || "",
              quantity: item.quantity,
              price: Number(item.price || 0),
              customization: item.customization || "",
              remarks: item.remarks || "",
              selectedAttributes: initialAttrs, // ✨ Masukkan ke form
            };
          }),
        });
      } catch (e) {
        toast.error("Gagal memuat data order");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId, status, fetchApi, reset]);

  const initialClientId = useRef<string | undefined>("");
  const initialPicId = useRef<string | undefined>("");

  useEffect(() => {
    if (!selectedClientData) return;
    if (selectedClientId === initialClientId.current) return;

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
  }, [selectedClientId, selectedClientData, setValue]);

  // Sync phone dari PIC B2B — sama dengan AddOrderForm
  useEffect(() => {
    if (!isB2B || !selectedPicId) return;
    if (selectedPicId === initialPicId.current) return;

    const pic = availablePics.find((p) => p.id === selectedPicId);
    if (pic && (pic as any).phone) {
      setValue("phone", (pic as any).phone);
    }
  }, [selectedPicId, isB2B, availablePics, setValue]);

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setSubmitting(true);
      const { phone, ...payload } = data;
      const finalPayload = {
        ...payload,
        sampleFollowUps:
          salesCategory === "SAMPLE"
            ? sampleSteps
                .filter((s) => s.enabled)
                .map((s) => ({
                  name: s.name,
                  date: s.date,
                  notes: s.notes,
                  method: s.method,
                  nextAction: s.nextAction,
                }))
            : [],
      };
      await updateOrder(fetchApi, orderId, finalPayload);
      toast.success("Order berhasil diupdate!");
      if (data.salesCategory === "SAMPLE") {
        router.push("/super-admin/orders?tab=sample");
      } else {
        router.push("/super-admin/orders?tab=all");
      }
    } catch {
      toast.error("Gagal mengupdate order");
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    // Membaca semua error yang dikembalikan oleh validasi Zod
    Object.keys(errors).forEach((field) => {
      const error = errors[field];

      // Jika error berupa teks (misalnya field teks biasa yang kosong)
      if (error && error.message) {
        toast.error(`${error.message}`);
      }
      // Jika error terjadi di dalam array (seperti form field 'products' yang berlapis)
      else if (Array.isArray(error)) {
        toast.error(`Mohon lengkapi detail pada daftar produk (Products).`);
      }
    });
  };
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order data...</span>
      </div>
    );
  }

  return (
    <Card className="space-y-4 mx-auto w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <CardTitle className="text-2xl font-semibold">Edit Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-8">
            {/* === SECTION 1: ORDER DETAILS === */}
            <div className="grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="col-span-full font-medium text-lg text-gray-700">
                Order Details
              </h3>
              <FormField
                control={control}
                name="dateOrder"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 mt-1.5">
                    <FormLabel>Date Order</FormLabel>
                    <DatePickerHelper
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      placeholder="Pilih Tanggal Order"
                    />
                    <FormMessage />
                  </FormItem>
                )}
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
                      disabled>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10 bg-gray-100 cursor-not-allowed">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="SAMPLE">Sample</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-amber-600">
                      Sales category tidak dapat diubah setelah order dibuat.
                    </FormDescription>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {salesCategory === "SAMPLE" && (
                <div className="col-span-full">
                  <SampleFollowUpSection
                    onChange={setSampleSteps}
                    initialData={initialFollowUps}
                  />
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

              <FormField
                control={control}
                name="referenceSampleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1.5 mb-1.5">
                      <Bookmark className="w-4 h-4 text-stone-500" /> Sample No.
                      Reference (Optional)
                    </FormLabel>
                    <Popover open={sampleOpen} onOpenChange={setSampleOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={salesCategory === "SAMPLE"}
                            className={cn(
                              "w-full justify-between h-10 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? sampleOrderRefs.find(
                                  (s) => s.id === field.value,
                                )?.orderNumber
                              : salesCategory === "SAMPLE"
                                ? "Kategori berupa sample baru"
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
                    <FormDescription>
                      Hanya dapat diaktifkan jika Sales Category diatur ke
                      "Sales".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 3: CUSTOMER & LOGISTICS === */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50 items-start">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Customer & Logistics
              </h3>

              <FormField
                control={control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client / PIC</FormLabel>
                    <Popover
                      open={clientOpen}
                      onOpenChange={isPending ? setClientOpen : undefined}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled
                            className={cn(
                              "w-full justify-between h-10 bg-gray-100 cursor-not-allowed",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? clients.find((c) => c.id === field.value)?.name
                              : "Select client..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                    </Popover>
                    <FormDescription className="text-xs text-amber-600">
                      Client tidak dapat diubah setelah order dibuat.
                    </FormDescription>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            {/* === SECTION 4: SALES, VENDOR, & REMARK === */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Internal & Vendor
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
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-xl text-gray-800">
                    Order Products
                  </h3>
                  {!isPending && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      ⚠ Produk tidak dapat diedit — status {orderStatus}
                    </span>
                  )}
                </div>
                {isPending && (
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
                )}
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
                  const currentQty = watch(`products.${index}.quantity`) || 1;
                  const selectedProduct = products.find(
                    (p) => p.id === currentProductId,
                  );
                  const subtotal =
                    (watch(`products.${index}.price`) || 0) * currentQty;

                  // ✨ FUNGSI BARU: Perhitungan Harga yang sudah diperbaiki (Sama dengan AddOrder)
                  const updateCalculatedPrice = async (
                    idx: number,
                    prod: any,
                    selectedAttrs: any,
                    qty: number,
                  ) => {
                    if (!prod) return;

                    // 1. Tentukan Harga Dasar
                    let baseProductPrice = Number(prod.basePrice || 0);

                    if (
                      baseProductPrice === 0 &&
                      prod.productVariants &&
                      prod.productVariants.length > 0
                    ) {
                      baseProductPrice = Number(
                        prod.productVariants[0].price || 0,
                      );
                    }

                    // 2. Cek apakah ada Varian Fisik yang cocok
                    const nonCustomAttrsObj = Object.fromEntries(
                      Object.entries(selectedAttrs).filter(([key]) => {
                        const foundAttr = prod.availableAttributes?.find(
                          (a: any) => a.attributeId === key,
                        );
                        return foundAttr?.isCustom !== true;
                      }),
                    );

                    const nonCustomVals = Object.values(nonCustomAttrsObj);
                    const matchedVariant = prod.productVariants?.find(
                      (v: any) =>
                        v.combinationIds &&
                        v.combinationIds.length === nonCustomVals.length &&
                        v.combinationIds.length > 0 &&
                        v.combinationIds.every((id: string) =>
                          nonCustomVals.includes(id),
                        ),
                    );

                    if (matchedVariant && Number(matchedVariant.price) > 0) {
                      baseProductPrice = Number(matchedVariant.price);
                    }

                    // 3. Hitung Tambahan Harga (Modifiers)
                    let totalModifiers = 0;
                    const selectedValIds = Object.values(selectedAttrs);

                    if (
                      prod.availableAttributes &&
                      Array.isArray(prod.availableAttributes)
                    ) {
                      prod.availableAttributes.forEach((attr: any) => {
                        if (attr.values && Array.isArray(attr.values)) {
                          attr.values.forEach((val: any) => {
                            if (selectedValIds.includes(val.valueId)) {
                              totalModifiers += Number(val.priceModifier || 0);
                            }
                          });
                        }
                      });
                    }

                    // 4. Totalkan Harga Dasar dengan Tambahan
                    let baseIdr = baseProductPrice + totalModifiers;

                    // 5. Tier Price (Grosir) dengan Pengaman
                    if (
                      prod.priceTiers &&
                      Array.isArray(prod.priceTiers) &&
                      prod.priceTiers.length > 0
                    ) {
                      const tiers = [...prod.priceTiers].sort(
                        (a, b) => b.minQuantity - a.minQuantity,
                      );
                      const applicableTier = tiers.find(
                        (tier) => qty >= tier.minQuantity,
                      );

                      if (applicableTier && Number(applicableTier.price) > 0) {
                        baseIdr = Number(applicableTier.price) + totalModifiers;
                      }
                    }

                    let finalPrice = baseIdr;

                    // 6. Auto Konversi Currency
                    if (
                      selectedCurrencyCode &&
                      selectedCurrencyCode !== "IDR"
                    ) {
                      try {
                        const result = await convert(
                          "IDR",
                          selectedCurrencyCode,
                          baseIdr,
                        );
                        if (result?.success) {
                          finalPrice = parseFloat(
                            result.convertedAmount.toFixed(2),
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Gagal convert saat memilih atribut:",
                          error,
                        );
                      }
                    }

                    // 7. Simpan harga akhir
                    form.setValue(`products.${idx}.price`, finalPrice);
                  };

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "border rounded-lg bg-white shadow-sm transition-all duration-200",
                        !isPending
                          ? "opacity-60 pointer-events-none" // 🔒 Kunci form jika tidak Pending
                          : "hover:shadow-md",
                      )}>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4 space-y-4">
                          {/* 1. SEARCHABLE PRODUCT DROPDOWN */}
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
                                        disabled={!isPending}
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
                                    className="w-75 p-0"
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
                                                setOpenCombobox((prev) => ({
                                                  ...prev,
                                                  [index]: false,
                                                }));

                                                // Update harga awal & Convert
                                                updateCalculatedPrice(
                                                  index,
                                                  p,
                                                  {},
                                                  currentQty,
                                                );
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
                                      disabled={!isPending}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        const newQty = isNaN(val) ? 0 : val;
                                        field.onChange(newQty);

                                        if (selectedProduct) {
                                          const currentAttrs =
                                            form.getValues(
                                              `products.${index}.selectedAttributes`,
                                            ) || {};
                                          updateCalculatedPrice(
                                            index,
                                            selectedProduct,
                                            currentAttrs,
                                            newQty,
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
                                      step="any"
                                      {...field}
                                      disabled={!isPending}
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
                          {fields.length > 1 && isPending && (
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

                      {/* ✨ AREA FULL-WIDTH: DYNAMIC ATTRIBUTE SELECTION (BERURUTAN/STACK) */}
                      {selectedProduct?.availableAttributes &&
                        selectedProduct.availableAttributes.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-inner">
                              <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-500" />{" "}
                                Pilih Varian Produk:
                              </p>

                              <div className="flex flex-col space-y-4">
                                {selectedProduct.availableAttributes.map(
                                  (attr: any, attrIdx: number) => {
                                    const isCustomAttr = attr.isCustom === true;

                                    const currentSelectedAttrs =
                                      watch(
                                        `products.${index}.selectedAttributes`,
                                      ) || {};
                                    const selectedValue =
                                      currentSelectedAttrs[attr.attributeId];

                                    return (
                                      <div
                                        key={attr.attributeId}
                                        className="flex flex-col space-y-2 bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                          Atribut #{attrIdx + 1}:{" "}
                                          {attr.attributeName}{" "}
                                          {isCustomAttr && (
                                            <span className="text-purple-600 font-normal">
                                              (Bebas)
                                            </span>
                                          )}
                                        </label>

                                        <div className="flex flex-wrap gap-2">
                                          {attr.values.map((val: any) => {
                                            const isSelected =
                                              selectedValue === val.valueId;

                                            return (
                                              <button
                                                type="button"
                                                key={val.valueId}
                                                // 🔒 Hanya disable jika bukan Pending (isAvailable logic dihapus)
                                                disabled={!isPending}
                                                onClick={() => {
                                                  // ✨ FITUR TOGGLE SEPERTI DI ADD ORDER
                                                  const newAttrs: Record<
                                                    string,
                                                    string
                                                  > = {
                                                    ...currentSelectedAttrs,
                                                  };

                                                  if (isSelected) {
                                                    delete newAttrs[
                                                      attr.attributeId
                                                    ];
                                                  } else {
                                                    newAttrs[attr.attributeId] =
                                                      val.valueId;
                                                  }

                                                  // Hapus atribut turunan di bawahnya agar kombinasi tetap bersih
                                                  selectedProduct.availableAttributes
                                                    .slice(attrIdx + 1)
                                                    .forEach(
                                                      (nextAttr: any) => {
                                                        delete newAttrs[
                                                          nextAttr.attributeId
                                                        ];
                                                      },
                                                    );

                                                  form.setValue(
                                                    `products.${index}.selectedAttributes`,
                                                    newAttrs,
                                                  );

                                                  // Cek & Set Variant ID
                                                  const nonCustomAttrsObj =
                                                    Object.fromEntries(
                                                      Object.entries(
                                                        newAttrs,
                                                      ).filter(([key]) => {
                                                        const foundAttr =
                                                          selectedProduct.availableAttributes.find(
                                                            (a: any) =>
                                                              a.attributeId ===
                                                              key,
                                                          );
                                                        return (
                                                          foundAttr?.isCustom !==
                                                          true
                                                        );
                                                      }),
                                                    );

                                                  const nonCustomVals =
                                                    Object.values(
                                                      nonCustomAttrsObj,
                                                    );

                                                  const matchedVariant =
                                                    selectedProduct.productVariants?.find(
                                                      (v: any) =>
                                                        v.combinationIds
                                                          .length ===
                                                          nonCustomVals.length &&
                                                        v.combinationIds.every(
                                                          (id: string) =>
                                                            nonCustomVals.includes(
                                                              id,
                                                            ),
                                                        ),
                                                    );

                                                  form.setValue(
                                                    `products.${index}.variantId`,
                                                    matchedVariant?.id || "",
                                                  );

                                                  // Hitung harga
                                                  updateCalculatedPrice(
                                                    index,
                                                    selectedProduct,
                                                    newAttrs,
                                                    currentQty,
                                                  );
                                                }}
                                                className={cn(
                                                  "relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                                  isSelected
                                                    ? "bg-blue-600 text-white shadow-md border-transparent"
                                                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-blue-400",
                                                )}>
                                                {val.value}
                                                {Number(val.priceModifier) >
                                                  0 && (
                                                  <span
                                                    className={cn(
                                                      "ml-1.5 text-[10px] font-semibold",
                                                      isSelected
                                                        ? "text-blue-200"
                                                        : "text-emerald-600",
                                                    )}>
                                                    (+
                                                    {Number(
                                                      val.priceModifier,
                                                    ).toLocaleString("id-ID")}
                                                    )
                                                  </span>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Additional Details (Customization & Remarks) */}
                      <div className="bg-gray-50/50 p-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-b-lg">
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
                                    disabled={!isPending}
                                    className="text-sm border-gray-200 pl-8 bg-white"
                                  />
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
                                    disabled={!isPending}
                                    className="text-sm border-gray-200 pl-8 bg-white"
                                  />
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

            <Button type="submit" className="text-md" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
