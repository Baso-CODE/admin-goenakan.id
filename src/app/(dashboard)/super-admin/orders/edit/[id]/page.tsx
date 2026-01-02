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
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { OrderFormValues, orderSchema } from "../../order-schema";
import {
  fetchOrderById,
  fetchWithToken,
  generatePoNumber,
  updateOrder,
} from "../../order-service";

// === TYPES ===
type PIC = {
  id: string;
  name: string;
  position?: string;
  phone?: string;
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

export default function EditOrderForm() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      dateOrder: "",
      salesCategory: "SALES",
      poNumber: "",
      clientId: "",
      clientB2BPICId: "", // Default value
      purchaseChannelId: "", // Default value
      phone: "",
      shippingAddress: "",
      salesId: "",
      vendorIds: [],
      products: [],
    },
  });

  const { control, handleSubmit, watch, setValue, reset, getValues } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  // === STATE ===
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sales[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    []
  ); // State untuk channel

  const [loading, setLoading] = useState(true);
  const [generatingPo, setGeneratingPo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  const selectedClientId = watch("clientId");

  // === LOAD DATA ===
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [c, s, v, p, pc, orderData] = await Promise.all([
          fetchWithToken("http://localhost:8000/clients/order"),
          fetchWithToken("http://localhost:8000/sales/order"),
          fetchWithToken("http://localhost:8000/vendors/order/add"),
          fetchWithToken("http://localhost:8000/products/order"),
          // Load Master Purchase Channel
          fetchWithToken("http://localhost:8000/purchase-channels/list"),
          fetchOrderById(orderId),
        ]);

        setClients(c);
        setSales(s);
        setVendors(v);
        setProducts(p);
        setPurchaseChannels(pc);

        // Populate Form
        if (orderData) {
          const currentClient = c.find(
            (cli: Client) => cli.id === orderData.clientId
          );

          // Backend service Anda sudah return 'formValues' yang rapi (vendorIds sudah array string)
          // Jadi kita tinggal masukkan ke reset()
          reset({
            ...orderData,
            // Pastikan field PIC dan Channel di-set (fallback ke empty string)
            clientB2BPICId: orderData.clientB2BPICId || "",
            purchaseChannelId: orderData.purchaseChannelId || "",
            // Phone logic
            phone: currentClient?.phone || "",
          });

          // Logic tambahan: Jika ada PIC yang tersimpan, update no HP ke HP PIC
          if (orderData.clientB2BPICId && currentClient?.type === "B2B") {
            const selectedPic = currentClient.pics?.find(
              (p: PIC) => p.id === orderData.clientB2BPICId
            );
            if (selectedPic?.phone) {
              setValue("phone", selectedPic.phone);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load order data");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadData();
    }
  }, [orderId, reset, setValue]);

  // === LOGIC CLIENT & PIC ===
  const selectedClientData = clients.find((c) => c.id === selectedClientId);
  const isB2B = selectedClientData?.type === "B2B";
  const availablePics = selectedClientData?.pics || [];

  // Effect: Update Phone saat PIC dipilih (User interaction)
  const selectedPicId = watch("clientB2BPICId");
  useEffect(() => {
    // Jalankan hanya jika loading selesai agar tidak bentrok saat initial render
    if (!loading && isB2B && selectedPicId) {
      const pic = availablePics.find((p) => p.id === selectedPicId);
      if (pic && (pic as any).phone) {
        setValue("phone", (pic as any).phone);
      }
    }
  }, [selectedPicId, isB2B, availablePics, setValue, loading]);

  // Handler: Generate PO Number
  const handleGeneratePO = async () => {
    try {
      setGeneratingPo(true);
      const newPo = await generatePoNumber();
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
      setSubmitting(true);
      const { phone, ...payload } = data;

      // Bersihkan string kosong agar Prisma disconnect (optional, backend sudah handle)
      if (!payload.clientB2BPICId) delete payload.clientB2BPICId;
      if (!payload.purchaseChannelId) delete payload.purchaseChannelId;

      await updateOrder(orderId, payload);

      toast.success("Order updated successfully");
      router.push("/super-admin/orders");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setSubmitting(false);
    }
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
        <CardTitle className="text-2xl font-semibold">
          Edit Order #{getValues("poNumber")}
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
              {/* ... (Date, SalesCategory, PONumber SAMA SEPERTI SEBELUMNYA) ... */}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 2: CUSTOMER & LOGISTICS (UPDATED) === */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Customer & Logistics
              </h3>

              {/* CLIENT SELECT */}
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
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value
                              ? clients.find(
                                  (client) => client.id === field.value
                                )?.name
                              : "Select client..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search client name..." />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  value={`${client.name}-${client.id}`} // Unique
                                  key={client.id}
                                  onSelect={() => {
                                    form.setValue("clientId", client.id);
                                    // Reset Logic saat Ganti Client (Manual Change)
                                    form.setValue("clientB2BPICId", "");

                                    // Auto Select Channel
                                    if (client.purchaseChannelId) {
                                      form.setValue(
                                        "purchaseChannelId",
                                        client.purchaseChannelId
                                      );
                                    } else {
                                      form.setValue("purchaseChannelId", "");
                                    }

                                    setClientOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
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

              {/* PIC SELECT (HANYA MUNCUL JIKA B2B) */}
              {isB2B && (
                <FormField
                  control={control}
                  name="clientB2BPICId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select PIC</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}>
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
                              No PIC available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who is responsible for this invoice?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* PHONE */}
              <FormField
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-gray-100" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* PURCHASE CHANNEL (ADDED) */}
              <FormField
                control={control}
                name="purchaseChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Channel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}>
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
                    <FormDescription>Source of this order.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SHIPPING ADDRESS */}
              <FormField
                control={control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 3: SALES & VENDOR === */}
            {/* ... Bagian ini sama seperti sebelumnya, biarkan vendorIds apa adanya ... */}
            <div className="grid md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="md:col-span-2 font-medium text-lg text-gray-700">
                Internal & Vendor
              </h3>
              {/* SalesId Field ... */}
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

              {/* VendorIds Field */}
              <FormField
                control={control}
                name="vendorIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendors (Multiple)</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        const current = field.value || [];
                        if (!current.includes(val)) {
                          field.onChange([...current, val]);
                        }
                      }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a vendor..." />
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {field.value?.map((id) => {
                        const vendor = vendors.find((v) => v.id === id);
                        if (!vendor) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 bg-white border px-3 py-1 rounded-full text-sm shadow-sm">
                            <span>{vendor.companyName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((vId) => vId !== id)
                                )
                              }
                              className="text-red-500 hover:text-red-700 rounded-full p-0.5">
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 4: PRODUCTS === */}
            {/* ... Bagian Product sama persis dengan Create, copy paste saja ... */}
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

              {/* Product List Header */}
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
                    (p) => p.id === currentProductId
                  );
                  const isCustomProduct = selectedProduct?.isCustom;
                  const subtotal =
                    (watch(`products.${index}.price`) || 0) *
                    (watch(`products.${index}.quantity`) || 0);

                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg bg-white shadow-sm">
                      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* 1. Product & Variant */}
                        <div className="md:col-span-4 space-y-3">
                          <FormField
                            control={control}
                            name={`products.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue(
                                      `products.${index}.variantId`,
                                      ""
                                    );
                                    const prod = products.find(
                                      (p) => p.id === val
                                    );
                                    if (prod && !prod.isCustom) {
                                      form.setValue(
                                        `products.${index}.price`,
                                        prod.basePrice
                                      );
                                    } else {
                                      form.setValue(
                                        `products.${index}.price`,
                                        0
                                      );
                                    }
                                  }}
                                  value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center justify-between w-full gap-4 min-w-[200px]">
                                          <span className="truncate">
                                            {p.name}
                                          </span>
                                          {p.isCustom && (
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                              CUSTOM
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          {/* Variant Select */}
                          {isCustomProduct && (
                            <FormField
                              control={control}
                              name={`products.${index}.variantId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={(val) => {
                                      field.onChange(val);
                                      const variant =
                                        selectedProduct?.productVariants.find(
                                          (v) => v.id === val
                                        );
                                      if (variant)
                                        form.setValue(
                                          `products.${index}.price`,
                                          Number(variant.price)
                                        );
                                    }}
                                    value={field.value}>
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
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* 2. Quantity */}
                        <div className="md:col-span-2">
                          <FormField
                            control={control}
                            name={`products.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      field.onChange(val);
                                    }}
                                    className="text-center"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 3. Unit Price */}
                        <div className="md:col-span-3">
                          <FormField
                            control={control}
                            name={`products.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-gray-500">
                                      Rp
                                    </span>
                                    <Input
                                      type="number"
                                      {...field}
                                      className="pl-9 text-right"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 4. Subtotal */}
                        <div className="md:col-span-2 flex flex-col justify-center items-end h-10">
                          <span className="font-semibold text-gray-900">
                            {subtotal.toLocaleString("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            })}
                          </span>
                        </div>

                        {/* 5. Delete */}
                        <div className="md:col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}>
                            <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Remarks & Customization */}
                      <div className="bg-gray-50/50 p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name={`products.${index}.customization`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Customization details..."
                                  {...field}
                                  className="text-sm bg-white"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`products.${index}.remarks`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Remarks..."
                                  {...field}
                                  className="text-sm bg-white"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update Order
              </Button>
            </div>
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
