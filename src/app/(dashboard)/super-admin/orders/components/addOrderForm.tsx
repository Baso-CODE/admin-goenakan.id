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
  PlusCircle,
  RefreshCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import { OrderFormValues, orderSchema } from "../order-schema";
import { generatePoNumber, postOrder } from "../order-service";
import { SampleFollowUpSection, SampleStepItem } from "./sampleFollowUpSection";

type PIC = { id: string; name: string; position?: string };
type PurchaseChannel = { id: string; name: string };
type Currency = { code: string; symbol: string; name: string };
type QuotationRef = {
  id: string;
  quotationNumber: string;
  totalAmount: number;
};
type SampleOrderRef = { id: string; orderNumber: string; dateOrder: string };

type Client = {
  id: string;
  name: string;
  phone: string;
  address: string;
  custCode?: string;
  type?: "B2B" | "B2C";
  pics?: PIC[];
  purchaseChannelId?: string;
};

type Sales = { id: string; name: string; phone: string };
type Vendor = { id: string; companyName: string };

type ProductVariant = { id: string; variantName: string; price: number };
type PriceTier = { minQuantity: number; price: number };
type Product = {
  id: string;
  name: string;
  basePrice: number;
  isCustom: boolean;
  productVariants: ProductVariant[];
  priceTiers: PriceTier[];
};

export default function AddOrderForm() {
  const { fetchApi, status } = useApi();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      dateOrder: new Date().toISOString().split("T")[0],
      salesCategory: "SALES",

      poNumber: "",
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
      salesId: "",
      vendorIds: [],
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
  const [sales, setSales] = useState<Sales[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [quotationRefs, setQuotationRefs] = useState<QuotationRef[]>([]);
  console.log("ini adalah quotation ref", quotationRefs);

  const [sampleOrderRefs, setSampleOrderRefs] = useState<SampleOrderRef[]>([]);
  console.log("ini adalah sample order ref", sampleOrderRefs);

  const [loading, setLoading] = useState(false);
  const [generatingPo, setGeneratingPo] = useState(false);

  const [clientOpen, setClientOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  // Watchers
  const selectedClientId = watch("clientId");
  const salesCategory = watch("salesCategory");
  const selectedCurrencyCode = watch("currencyCode");
  const [sampleSteps, setSampleSteps] = useState<SampleStepItem[]>([]);

  // Load Initial Master Data
  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;

      try {
        setLoading(true);

        const [resC, resS, resV, resP, resPC, resCur, resQ, resSamp] =
          await Promise.all([
            fetchApi("/clients/order"),
            fetchApi("/sales/order"),
            fetchApi("/vendors/order/add"),
            fetchApi("/products/order"),
            fetchApi("/purchase-channels/list"),
            fetchApi("/currencies"),
            fetchApi("/quotations/list-references"),
            fetchApi("/orders/list-samples"),
          ]);

        if (!resC.ok || !resS.ok || !resV.ok || !resP.ok || !resPC.ok) {
          throw new Error("Gagal mengambil data master inti");
        }

        const c = await resC.json();
        const s = await resS.json();
        const v = await resV.json();
        const p = await resP.json();
        const pc = await resPC.json();

        // --- PARSING JSON UTAMANYA ---
        const jsonCur = resCur.ok ? await resCur.json() : null;
        const jsonQ = resQ.ok ? await resQ.json() : null;
        const jsonSamp = resSamp.ok ? await resSamp.json() : null;

        // ✨ PERBAIKAN: Ambil properti .data sesuai format console log kamu
        const curData = jsonCur?.data || jsonCur || [];
        const qData = jsonQ?.data || jsonQ || [];
        const sampData = jsonSamp?.data || jsonSamp || [];

        setClients(c);
        setSales(s);
        setVendors(v);
        setProducts(p);
        setPurchaseChannels(pc);

        setCurrencies(
          curData.length
            ? curData
            : [{ code: "IDR", symbol: "Rp", name: "Rupiah" }],
        );
        setQuotationRefs(qData); // 🟢 Sekarang qData isinya murni Array [ {id, quotationNumber} ]
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

  const currentSalesCategory = watch("salesCategory");

  const handleGeneratePO = async () => {
    try {
      setGeneratingPo(true);

      const newPo = await generatePoNumber(fetchApi, currentSalesCategory);

      setValue("poNumber", newPo);

      const typeDoc =
        currentSalesCategory === "SALES"
          ? "Sales Order (SO)"
          : "Sample Note (SN)";
      toast.success(`${typeDoc} Number generated: ${newPo}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Order Number");
    } finally {
      setGeneratingPo(false);
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      const { phone, ...payload } = data;

      // Bersihkan string kosong pada ID referensi opsional agar tidak memicu error UUID prisma
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
    } catch {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const currentCurrencySymbol =
    currencies.find((c) => c.code === selectedCurrencyCode)?.symbol || "Rp";

  return (
    <Card className="space-y-4 mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Create New Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* === SECTION 1: ORDER DETAILS === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="col-span-full font-medium text-lg text-gray-700">
                Order Details
              </h3>

              <FormField
                control={control}
                name="dateOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Order</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="salesCategory"
                render={({ field }) => (
                  <FormItem className="">
                    <FormLabel>Sales Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="SAMPLE">Sample</SelectItem>
                      </SelectContent>
                    </Select>
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
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal PO Number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Internal PO"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={handleGeneratePO}
                        disabled={generatingPo}>
                        {generatingPo ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Gen"
                        )}
                      </Button>
                    </div>
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
                  <SampleFollowUpSection onChange={setSampleSteps} />
                </div>
              )}
            </div>

            {/* === SECTION 2: DOCUMENT REFERENCES (Dinamis Sesuai Alur Proses) === */}
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
              />

              <FormField
                control={control}
                name="vendorIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendors (Multiple)</FormLabel>
                    <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal h-10">
                            <span className="text-muted-foreground">
                              {field.value?.length > 0
                                ? `${field.value.length} vendor dipilih`
                                : "Cari & tambah vendor..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Cari nama vendor..."
                            value={vendorSearch}
                            onValueChange={setVendorSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Vendor tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {vendors
                                .filter((v) =>
                                  v.companyName
                                    .toLowerCase()
                                    .includes(vendorSearch.toLowerCase()),
                                )
                                .map((v) => {
                                  const isSelected = field.value?.includes(
                                    v.id,
                                  );
                                  return (
                                    <CommandItem
                                      key={v.id}
                                      value={`${v.companyName}-${v.id}`}
                                      onSelect={() => {
                                        const current = field.value || [];
                                        field.onChange(
                                          isSelected
                                            ? current.filter(
                                                (id) => id !== v.id,
                                              )
                                            : [...current, v.id],
                                        );
                                      }}>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {v.companyName}
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((id) => {
                          const vendor = vendors.find((v) => v.id === id);
                          if (!vendor) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-1.5 bg-white border px-2.5 py-1 rounded-full text-sm shadow-sm">
                              <span className="text-slate-700">
                                {vendor.companyName}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    field.value.filter((vId) => vId !== id),
                                  )
                                }
                                className="text-slate-400 hover:text-red-500 rounded-full">
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                                        prod.isCustom ? 0 : prod.basePrice,
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
                                      <SelectItem key={p.id} value={p.id}>
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
                                              : selectedProduct.basePrice,
                                          );
                                        }
                                      }}
                                      className="text-center h-10"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 pointer-events-none">
                                      pcs
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
