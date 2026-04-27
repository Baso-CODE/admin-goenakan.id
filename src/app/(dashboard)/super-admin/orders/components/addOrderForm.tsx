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
  Check,
  ChevronsUpDown,
  PlusCircle,
  RefreshCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

// Import Schema & Type dari file schema kamu
import { useApi } from "@/hooks/useApi";
import { OrderFormValues, orderSchema } from "../order-schema";
import { generatePoNumber, postOrder } from "../order-service";
import { SampleFollowUpSection, SampleStepItem } from "./sampleFollowUpSection";

type PIC = {
  id: string;
  name: string;
  position?: string;
};

type PurchaseChannel = {
  id: string;
  name: string;
};

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

// ID Product & Variant harus STRING (UUID)
type ProductVariant = {
  id: string;
  variantName: string;
  price: number;
};

type PriceTier = {
  minQuantity: number;
  price: number;
};

type Product = {
  id: string; // Updated to String
  name: string;
  basePrice: number;
  isCustom: boolean;
  productVariants: ProductVariant[];
  priceTiers: PriceTier[];
};

export default function AddOrderForm() {
  const { fetchApi, status } = useApi();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      dateOrder: new Date().toISOString().split("T")[0],
      salesCategory: "SALES",
      poNumber: "",
      clientId: "",
      purchaseChannelId: "",
      clientB2BPICId: "",
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

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sales[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [generatingPo, setGeneratingPo] = useState(false);

  const [clientOpen, setClientOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");

  // Watchers
  const selectedClientId = watch("clientId");

  const [sampleSteps, setSampleSteps] = useState<SampleStepItem[]>([]);
  const salesCategory = watch("salesCategory");

  // Load Initial Data
  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;

      try {
        setLoading(true);

        const [resC, resS, resV, resP, resPC] = await Promise.all([
          fetchApi("/clients/order"),
          fetchApi("/sales/order"),
          fetchApi("/vendors/order/add"),
          fetchApi("/products/order"),
          fetchApi("/purchase-channels/list"),
        ]);

        // Validasi semua response
        if (!resC.ok || !resS.ok || !resV.ok || !resP.ok || !resPC.ok) {
          throw new Error("Gagal mengambil beberapa data master");
        }

        // Parsing data JSON secara paralel
        const [c, s, v, p, pc] = await Promise.all([
          resC.json(),
          resS.json(),
          resV.json(),
          resP.json(),
          resPC.json(),
        ]);

        setClients(c);
        setSales(s);
        setVendors(v);
        setProducts(p);
        setPurchaseChannels(pc);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load master data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, fetchApi]);

  // === LOGIC: Tentukan Client Terpilih & PIC ===
  const selectedClientData = clients.find((c) => c.id === selectedClientId);
  const isB2B = selectedClientData?.type === "B2B";
  const availablePics = selectedClientData?.pics || [];

  // Effect: Update Address, Phone, & Purchase Channel saat Client berubah
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

  // Handler: Generate PO Number
  const handleGeneratePO = async () => {
    try {
      setGeneratingPo(true);
      const newPo = await generatePoNumber(fetchApi);
      setValue("poNumber", newPo);
      toast.success("PO Number generated");
    } catch (e) {
      toast.error("Failed to generate PO Number");
    } finally {
      setGeneratingPo(false);
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      // Remove phone from payload
      const { phone, ...payload } = data;

      await postOrder(fetchApi, {
        ...payload,

        sampleFollowUps: sampleSteps
          .filter((s) => s.enabled && s.date)
          .map((s) => ({ name: s.name, date: s.date })),
      });

      toast.success("Order created successfully");

      // Reset form
      form.reset({
        dateOrder: new Date().toISOString().split("T")[0],
        salesCategory: "SALES",
        poNumber: "",
        clientId: "",
        phone: "",
        shippingAddress: "",
        salesId: "",
        vendorIds: [],

        products: [
          {
            productId: "",
            quantity: 1,
            price: 0,
            customization: "",
            remarks: "",
          },
        ],
      });
    } catch {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Order Details
              </h3>

              <FormField
                control={control}
                name="dateOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Order</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
              {salesCategory === "SAMPLE" && (
                <div className="md:col-span-2">
                  <SampleFollowUpSection onChange={setSampleSteps} />
                </div>
              )}

              <FormField
                control={control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter PO number" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeneratePO}
                        disabled={generatingPo}>
                        {generatingPo ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Click Generate if you don't have a PO Number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 2: CUSTOMER & LOGISTICS === */}
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
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? clients.find(
                                  (client) => client.id === field.value,
                                )?.name
                              : "Select client..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-75 p-0">
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
                                    if (client.type === "B2B") {
                                      form.setValue("clientB2BPICId", "");
                                    }
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
                          <SelectTrigger>
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
                        className="bg-gray-100"
                        placeholder="Auto-filled from client"
                      />
                    </FormControl>
                    <FormDescription>
                      This info comes from the selected client.
                    </FormDescription>
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
                        <SelectTrigger>
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

            {/* === SECTION 3: SALES & VENDOR === */}
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
                        <SelectTrigger>
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

                    {/* ✅ Searchable combobox — sama polanya dengan clientId */}
                    <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal">
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
                                        if (isSelected) {
                                          // Deselect jika sudah dipilih
                                          field.onChange(
                                            current.filter((id) => id !== v.id),
                                          );
                                        } else {
                                          // Select
                                          field.onChange([...current, v.id]);
                                        }
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

                    {/* ✅ Tags vendor yang sudah dipilih */}
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((id) => {
                          const vendor = vendors.find((v) => v.id === id);
                          if (!vendor) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-sm shadow-sm">
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
                                className="text-slate-400 hover:text-red-500 transition-colors rounded-full">
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {field.value?.length === 0 && (
                      <p className="text-sm text-gray-400 italic mt-1">
                        Belum ada vendor yang dipilih.
                      </p>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 4: PRODUCTS === */}
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
                      {/* === BARIS UTAMA (Product, Qty, Price) === */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* 1. Product & Variant Selection */}
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
                                  // VALUE STRING: Langsung pakai field.value karena tipe sudah string
                                  value={field.value}
                                  onValueChange={(val) => {
                                    field.onChange(val); // Save as String

                                    // Reset Variant (as string empty)
                                    form.setValue(
                                      `products.${index}.variantId`,
                                      "",
                                    );

                                    // Find product by string ID
                                    const prod = products.find(
                                      (p) => p.id === val,
                                    );

                                    if (prod) {
                                      if (!prod.isCustom) {
                                        form.setValue(
                                          `products.${index}.price`,
                                          prod.basePrice,
                                        );
                                      } else {
                                        form.setValue(
                                          `products.${index}.price`,
                                          0,
                                        );
                                      }
                                    }
                                  }}>
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((p) => (
                                      // Value Select adalah string (p.id sudah string)
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
                                    // VALUE STRING
                                    value={field.value}
                                    onValueChange={(val) => {
                                      field.onChange(val); // Save as String

                                      const variant =
                                        selectedProduct?.productVariants.find(
                                          (v) => v.id === val,
                                        );
                                      if (variant) {
                                        form.setValue(
                                          `products.${index}.price`,
                                          Number(variant.price),
                                        );
                                      }
                                    }}>
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm bg-gray-50 border-dashed">
                                        <SelectValue placeholder="Select Variant" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {selectedProduct?.productVariants.map(
                                        (v) => (
                                          // v.id sudah string
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

                        {/* 2. Quantity Input (HANDLED AS NUMBER) */}
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
                                      // PENTING: Paksa valueAsNumber agar state TS tetap number
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        field.onChange(isNaN(val) ? 0 : val);

                                        // Logic Price Tiers
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

                                          if (applicableTier) {
                                            form.setValue(
                                              `products.${index}.price`,
                                              Number(applicableTier.price),
                                            );
                                            toast.info(
                                              `Price updated to tier ≥${applicableTier.minQuantity}`,
                                            );
                                          } else {
                                            form.setValue(
                                              `products.${index}.price`,
                                              selectedProduct.basePrice,
                                            );
                                          }
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

                        {/* 3. Unit Price Input (HANDLED AS NUMBER) */}
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
                                      Rp
                                    </span>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      // PENTING: Paksa valueAsNumber
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

                        {/* 4. Subtotal */}
                        <div className="md:col-span-2 flex flex-col justify-center items-end h-10 pt-8 md:pt-0">
                          <span className="md:hidden text-xs text-gray-500 mb-1">
                            Subtotal
                          </span>
                          <span className="font-semibold text-gray-900 font-mono">
                            {subtotal.toLocaleString("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            })}
                          </span>
                        </div>

                        {/* 5. Delete Action */}
                        <div className="md:col-span-1 flex justify-center pt-8 md:pt-0">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove Item">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Customization & Remarks */}
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
                                    className="text-sm border-gray-200 focus:border-blue-300 pl-8 bg-white"
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
                                    className="text-sm border-gray-200 focus:border-blue-300 pl-8 bg-white"
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
                                      <polyline points="10 9 9 9 8 9" />
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

            <Button type="submit" className=" text-md" disabled={loading}>
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
