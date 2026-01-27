"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Box, CalendarIcon, Loader2, Plus, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/helper/apiurl"; // Pastikan helper ini ada
import { cn } from "@/lib/utils";

// === TYPES FOR API DATA ===
type ClientData = {
  id: string;
  name: string;
  type: string;
  address: string;
  purchaseChannelId: string;
};

type ProductData = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  // Jika nanti butuh varian, bisa diakses di sini
  productVariants: { id: string; variantName: string; price: number }[];
};

// === SCHEMA ===
const quotationSchema = z.object({
  date: z.date(),
  validUntil: z.date().optional(),

  // Logic Hybrid Client
  isManualClient: z.boolean().default(false),
  clientId: z.string().optional(),
  manualClientName: z.string().optional(),
  manualClientCompany: z.string().optional(),
  manualClientEmail: z.string().email().optional().or(z.literal("")),
  manualClientPhone: z.string().optional(),
  manualClientAddress: z.string().optional(),

  notes: z.string().optional(),
  internalNotes: z.string().optional(),

  // Items
  items: z
    .array(
      z.object({
        // Logic Hybrid Product
        isManualProduct: z.boolean().default(false),
        productId: z.string().optional(),
        productName: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        quantity: z.coerce.number().min(1, "Qty min 1"),
        unitPrice: z.coerce.number().min(0, "Price min 0"),
        discount: z.coerce.number().min(0).default(0),
      }),
    )
    .min(1, "Add at least one item"),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  initialData?: any;
  onSubmit: (data: QuotationFormValues) => void;
  isLoading?: boolean;
}

export default function QuotationForm({
  initialData,
  onSubmit,
  isLoading,
}: QuotationFormProps) {
  // === STATE FOR DATA ===
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // === FETCH DATA (CLIENTS & PRODUCTS) ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const resClients = await fetch(`${apiUrl}/clients/order`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const resProducts = await fetch(`${apiUrl}/products/order`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resClients.ok || !resProducts.ok) {
          throw new Error("Failed to load master data");
        }

        const clientData = await resClients.json();
        const productData = await resProducts.json();

        setClients(
          Array.isArray(clientData) ? clientData : clientData.data || [],
        );
        setProducts(
          Array.isArray(productData) ? productData : productData.data || [],
        );
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Gagal memuat data Client atau Produk");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData || {
      date: new Date(),
      isManualClient: false,
      items: [
        {
          isManualProduct: false,
          productName: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // === WATCHERS ===
  const items = useWatch({ control: form.control, name: "items" });
  const isManualClient = useWatch({
    control: form.control,
    name: "isManualClient",
  });

  // === CALCULATIONS ===
  const { subTotal, totalDiscount, grandTotal } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemDisc = Number(item.discount) || 0;

      sub += qty * price;
      disc += itemDisc;
    });
    return { subTotal: sub, totalDiscount: disc, grandTotal: sub - disc };
  }, [items]);

  // === HANDLERS ===
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name);
      // Menggunakan Base Price sebagai default unit price
      form.setValue(`items.${index}.unitPrice`, Number(product.basePrice));
    }
  };

  const handleClientSelect = (clientId: string) => {
    // Opsional: Jika ingin auto-fill alamat client saat dipilih
    const client = clients.find((c) => c.id === clientId);
    // Anda bisa menambah logic disini jika quotation punya field 'shipTo' dsb.
  };

  const handleSubmit = (data: QuotationFormValues) => {
    if (!data.isManualClient && !data.clientId) {
      form.setError("clientId", { message: "Please select a client" });
      return;
    }
    if (data.isManualClient && !data.manualClientName) {
      form.setError("manualClientName", { message: "Client Name is required" });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* === HEADER & CLIENT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Fields (Sama seperti sebelumnya) */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Quotation Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                Client Information
              </CardTitle>
              <FormField
                control={form.control}
                name="isManualClient"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-normal text-muted-foreground">
                      Manual Input?
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isManualClient ? (
                // === SELECT FROM DB ===
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Client</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            handleClientSelect(val);
                          }}
                          defaultValue={field.value}
                          disabled={loadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingData
                                    ? "Loading clients..."
                                    : "Select a client..."
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({c.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {loadingData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Loading database...
                    </p>
                  )}
                </div>
              ) : (
                // === MANUAL INPUT FIELDS (Sama seperti sebelumnya) ===
                <>
                  <FormField
                    control={form.control}
                    name="manualClientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manualClientCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="PT. ..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manualClientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="mail@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manualClientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+62..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manualClientAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === ITEMS === */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-muted-foreground" />
              Items & Products
            </CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  isManualProduct: false,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                })
              }>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {fields.map((field, index) => {
                const isManual = form.getValues(
                  `items.${index}.isManualProduct`,
                );
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 items-start border p-3 rounded-lg bg-slate-50/50">
                    {/* Toggle Manual/DB */}
                    <div className="col-span-12 md:col-span-1 flex items-center justify-center pt-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.isManualProduct`}
                        render={({ field }) => (
                          <div className="flex flex-col items-center gap-1">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="scale-75"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {field.value ? "Manual" : "DB"}
                            </span>
                          </div>
                        )}
                      />
                    </div>

                    {/* Product Selection */}
                    <div className="col-span-12 md:col-span-4">
                      {isManual ? (
                        <FormField
                          control={form.control}
                          name={`items.${index}.productName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Product Name
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Item name" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Select Product
                              </FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  handleProductSelect(index, val);
                                }}
                                defaultValue={field.value}
                                disabled={loadingData}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Qty</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Price (Rp)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Disc (Rp)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-12 md:col-span-1 flex items-center justify-center pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* === SUMMARY & NOTES === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes to Client</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Payment terms..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Team notes..." />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(subTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Total Discount</span>
                <span>
                  -{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(totalDiscount)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(grandTotal)}
                </span>
              </div>
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Quotation"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
