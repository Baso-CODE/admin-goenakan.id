"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  DollarSign,
  Loader2,
  PlusCircle,
  Settings2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Currency, Product, Vendor } from "../../orders/types/order.types";

// Skema yang sama dengan Add Form
const purchaseOrderSchema = z.object({
  poDate: z.string().min(1, "Date is required"),
  poNumber: z.string().optional(),
  purchaseType: z.enum([
    "DIRECT_MATERIAL",
    "DIRECT_EXPENSES",
    "INDIRECT_EXPENSES",
    "STOCK",
  ]),
  expenseCategory: z.enum(["PRODUCT", "PACKAGING", "LOGISTIC", "UTILITY"]),
  paymentTerms: z.enum(["IMMEDIATELY", "NET_14", "NET_30", "NET_60"]),
  vendorId: z.string().min(1, "Vendor is required"),
  currencyCode: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().min(1),
        productId: z.string().optional(),
        orderId: z.string().optional(),
        quantityOrder: z.number().min(1),
        quantityStock: z.number().min(0),
        quantityPurchase: z.number().min(0),
        uom: z.string().min(1),
        unitPrice: z.number().min(0),
        remarks: z.string().optional(),
      }),
    )
    .min(1),
});
const UOM_OPTIONS = ["pcs", "ctn", "ea", "kg", "liter", "pack", "roll"];
type OrderRef = { id: string; orderNumber: string };
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function EditPurchaseOrderForm({ poId }: { poId: string }) {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRef[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
  });

  const { control, handleSubmit, watch, setValue, getValues } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedCurrencyCode = watch("currencyCode");
  const currentCurrencySymbol =
    currencies.find((c) => c.code === selectedCurrencyCode)?.symbol || "Rp";

  const recalculateQtyPurchase = (index: number) => {
    const qtyOrder = getValues(`items.${index}.quantityOrder`) || 0;
    const qtyStock = getValues(`items.${index}.quantityStock`) || 0;
    const qtyPurchase = Math.max(0, qtyOrder - qtyStock);
    setValue(`items.${index}.quantityPurchase`, qtyPurchase);
  };

  useEffect(() => {
    async function loadAll() {
      if (status !== "authenticated" || !poId) return;
      try {
        setLoading(true);
        const [resV, resCur, resP, resO, resPO] = await Promise.all([
          fetchApi("/vendors/order/add"),
          fetchApi("/currencies"),
          fetchApi("/products/order"),
          fetchApi("/orders/all?take=100"),
          fetchApi(`/purchase-orders/${poId}`),
        ]);

        const [v, curData, p, oData, data] = await Promise.all([
          resV.json(),
          resCur.json(),
          resP.json(),
          resO.json(),
          resPO.json(),
        ]);

        setVendors(v);
        setProducts(p);
        setCurrencies(
          curData?.data ||
            curData || [{ code: "IDR", symbol: "Rp", name: "Rupiah" }],
        );
        setOrders(oData?.data || oData || []);

        // Reset form dengan data PO
        form.reset({
          poDate: data.poDate.split("T")[0],
          poNumber: data.poNumber || "",
          purchaseType: data.purchaseType,
          expenseCategory: data.expenseCategory,
          paymentTerms: data.paymentTerms,
          vendorId: data.vendorId,
          currencyCode: data.currencyCode || "IDR",
          notes: data.notes || "",
          items: data.items.map((i: any) => ({
            itemName: i.itemName || i.itemNameManual || "",
            productId: i.productId || "",
            orderId: i.orderId || "",
            quantityOrder: i.quantityOrder,
            quantityStock: i.quantityStock,
            quantityPurchase: i.quantityPurchase,
            uom: i.uom,
            unitPrice: Number(i.unitPrice),
            remarks: i.remarks || "",
          })),
        });
      } catch {
        toast.error("Gagal memuat data PO");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [poId, status, fetchApi, form]);

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    try {
      setSubmitting(true);

      const payload = {
        ...data,
        items: data.items.map((item) => ({
          ...item,
          productId: item.productId || undefined,
          orderId: item.orderId || undefined,
        })),
      };

      const res = await fetchApi(`/purchase-orders/${poId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success("Purchase Order berhasil diupdate!");
      router.push("/super-admin/purchase-orders");
    } catch {
      toast.error("Gagal mengupdate PO");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin inline mr-2" /> Loading...
      </div>
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Purchase Order: {form.getValues("poNumber")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* === SECTION 1: HEADER PO === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5 border rounded-lg bg-white shadow-sm">
              <h3 className="col-span-full font-semibold text-lg text-slate-700 border-b pb-2">
                Purchase Order Details
              </h3>
              <FormField
                control={control}
                name="poDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>PO Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-10 pl-3 text-left font-normal bg-white",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(new Date(field.value), "PPP")
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
                          // Ubah string "YYYY-MM-DD" dari form state menjadi object Date untuk Calendar
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            // Saat tanggal dipilih, ubah kembali object Date menjadi string "YYYY-MM-DD"
                            // agar sesuai dengan schema Zod dan format database kamu
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : "",
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-generated if empty"
                        className="h-10 bg-slate-50"
                        {...field}
                      />
                    </FormControl>
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
                      <DollarSign className="w-4 h-4 text-slate-500" /> Currency
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10 ">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((cur) => (
                          <SelectItem key={cur.code} value={cur.code}>
                            {cur.code} ({cur.symbol})
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
                name="purchaseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DIRECT_MATERIAL">
                          Direct Material (SO Products)
                        </SelectItem>
                        <SelectItem value="DIRECT_EXPENSES">
                          Direct Expenses (SO Based)
                        </SelectItem>
                        <SelectItem value="INDIRECT_EXPENSES">
                          Indirect Expenses (Non-SO)
                        </SelectItem>
                        <SelectItem value="STOCK">Stock (Inventory)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="expenseCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                        <SelectItem value="PACKAGING">Packaging</SelectItem>
                        <SelectItem value="LOGISTIC">Logistic</SelectItem>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IMMEDIATELY">
                          Immediately / Cash
                        </SelectItem>
                        <SelectItem value="NET_14">14 Days</SelectItem>
                        <SelectItem value="NET_30">30 Days</SelectItem>
                        <SelectItem value="NET_60">60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem className="flex flex-col lg:col-span-3">
                    <FormLabel>Vendor / Supplier</FormLabel>
                    <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
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
                              ? vendors.find((v) => v.id === field.value)
                                  ?.companyName
                              : "Select vendor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search vendor name..." />
                          <CommandList>
                            <CommandEmpty>No vendor found.</CommandEmpty>
                            <CommandGroup>
                              {vendors.map((vendor) => (
                                <CommandItem
                                  value={`${vendor.companyName}-${vendor.id}`}
                                  key={vendor.id}
                                  onSelect={() => {
                                    form.setValue("vendorId", vendor.id);
                                    setVendorOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      vendor.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {vendor.companyName}
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
                name="notes"
                render={({ field }) => (
                  <FormItem className="lg:col-span-3">
                    <FormLabel>Internal Notes / Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add optional notes for this PO..."
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION 2: ITEMS === */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xl text-slate-800">
                  Purchase Order Items
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemName: "",
                      productId: "",
                      orderId: "",
                      quantityOrder: 1,
                      quantityStock: 0,
                      quantityPurchase: 1,
                      uom: "pcs",
                      unitPrice: 0,
                      remarks: "",
                    })
                  }
                  className="border-dashed border-blue-400 text-blue-600 hover:border-blue-600 hover:bg-blue-50">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              {/* Table Header (Hidden di Mobile) */}
              {fields.length > 0 && (
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3 bg-slate-700 rounded-t-lg font-medium text-sm text-slate-50">
                  <div className="col-span-3">Item Name / Service</div>
                  <div className="col-span-2">Reference SO/SN</div>
                  <div className="col-span-3 text-center">
                    Qty (Order | Stock | Buy)
                  </div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const subtotal =
                    (watch(`items.${index}.quantityOrder`) || 0) *
                    (watch(`items.${index}.unitPrice`) || 0);

                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow p-4 lg:p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:p-4">
                        {/* 1. Item Name & Product Relation */}
                        <div className="lg:col-span-3 space-y-3">
                          <FormField
                            control={control}
                            name={`items.${index}.itemName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden">
                                  Item Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Type item name..."
                                    className="h-10"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value}
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    const prod = products.find(
                                      (p) => p.id === val,
                                    );
                                    if (prod) {
                                      // Auto fill nama item & stock
                                      form.setValue(
                                        `items.${index}.itemName`,
                                        prod.name,
                                      );
                                      form.setValue(
                                        `items.${index}.quantityStock`,
                                        prod.stock || 0,
                                      );
                                      recalculateQtyPurchase(index);
                                    }
                                  }}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-xs bg-slate-50 border-dashed">
                                      <SelectValue placeholder="Or link to Master Product..." />
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
                        </div>

                        {/* 2. Order Reference (SO/SN) */}
                        <div className="lg:col-span-2">
                          <FormField
                            control={control}
                            name={`items.${index}.orderId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden">
                                  Reference SO
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Link to SO..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem
                                      value="none"
                                      className="text-muted-foreground italic">
                                      -- No Reference --
                                    </SelectItem>
                                    {orders.map((o) => (
                                      <SelectItem key={o.id} value={o.id}>
                                        {o.orderNumber}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 3. Quantities & UOM */}
                        <div className="lg:col-span-3 grid grid-cols-3 gap-2">
                          <FormField
                            control={control}
                            name={`items.${index}.quantityOrder`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden text-xs text-center block">
                                  Qty Order
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(
                                        e.target.valueAsNumber || 0,
                                      );
                                      recalculateQtyPurchase(index);
                                    }}
                                    className="text-center h-10 border-blue-200 bg-blue-50/30"
                                    title="Quantity Order"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.quantityStock`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden text-xs text-center block">
                                  In Stock
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(
                                        e.target.valueAsNumber || 0,
                                      );
                                      recalculateQtyPurchase(index);
                                    }}
                                    className="text-center h-10 text-slate-500 bg-slate-50"
                                    title="Stock Available"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.quantityPurchase`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden text-xs text-center block">
                                  To Buy
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    readOnly
                                    {...field}
                                    className="text-center h-10 font-bold bg-green-50 text-green-700 border-green-200"
                                    title="Actual Quantity to Purchase"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 4. Unit Price & UOM */}
                        <div className="lg:col-span-2 space-y-2">
                          <FormField
                            control={control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="lg:hidden">
                                  Unit Price
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-slate-500">
                                      {currentCurrencySymbol}
                                    </span>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.valueAsNumber || 0,
                                        )
                                      }
                                      className="pl-9 h-10 text-right font-mono"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`items.${index}.uom`}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs bg-slate-50 border-dashed">
                                    <SelectValue placeholder="UOM" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {UOM_OPTIONS.map((uom) => (
                                    <SelectItem key={uom} value={uom}>
                                      {uom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        {/* 5. Subtotal */}
                        <div className="lg:col-span-1 flex flex-col justify-center items-end h-10 pt-8 lg:pt-0">
                          <span className="lg:hidden text-xs text-slate-500 mb-1">
                            Subtotal
                          </span>
                          <span className="font-semibold text-slate-900 font-mono text-sm">
                            {subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* 6. Action */}
                        <div className="lg:col-span-1 flex justify-center pt-4 lg:pt-0">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Remarks (Baris Bawah per Item) */}
                      <div className="bg-slate-50/50 p-3 lg:px-4 lg:py-3 border-t">
                        <FormField
                          control={control}
                          name={`items.${index}.remarks`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Item remarks (e.g., color, spec, notes)..."
                                    {...field}
                                    className="text-sm border-slate-200 pl-8 bg-white h-9"
                                  />
                                  <span className="absolute left-2.5 top-2.5 text-slate-400">
                                    <Settings2 className="w-4 h-4" />
                                  </span>
                                </div>
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

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto min-w-40"
                disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit Purchase Order"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
