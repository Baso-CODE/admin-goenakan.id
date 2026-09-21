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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  DollarSign,
  Loader2,
  Lock,
  PlusCircle,
  Settings2,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
// import { Currency, Product, Vendor } from "../../orders/types/order.types";

// ==========================================
// ZOD SCHEMA UNTUK FORM VALIDATION
// ==========================================
const baseItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  vendorItemId: z.string().optional(), //  Untuk menyimpan ID jasa dari vendor
  selectedAttributes: z.record(z.string(), z.string()).optional(),
  orderId: z.string().optional(),
  replacementOrderId: z.string().optional(),
  quantityOrder: z.number().min(1),
  quantityStock: z.number().min(0),
  quantityPurchase: z.number().min(0),
  uom: z.string().min(1, "UOM is required"),
  unitPrice: z.number().positive("Harga harus positif"),
  remarks: z.string().optional(),
});

const purchaseOrderSchema = z
  .object({
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
    items: z.array(baseItemSchema).min(1, "Minimal 1 item dibutuhkan"),
  })
  .superRefine((data, ctx) => {
    //  Validasi Bersyarat: Jika kategori PRODUCT, referensi SO/REP Wajib diisi!
    if (data.expenseCategory === "PRODUCT") {
      data.items.forEach((item, index) => {
        if (!item.orderId && !item.replacementOrderId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reference SO/REP is Wajib for PRODUCT expense",
            path: ["items", index, "orderId"],
          });
        }
      });
    }
  });

const UOM_OPTIONS = [
  "pcs",
  "ctn",
  "ea",
  "kg",
  "liter",
  "pack",
  "roll",
  "lot",
  "trip",
];
type OrderRef = { id: string; orderNumber: string };
type ReplacementRef = {
  id: string;
  replacementNumber: string;
  referenceOrderId?: string;
};
type Vendor = any;
type Currency = any;
type Product = any;
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function EditPurchaseOrderForm({ poId }: { poId: string }) {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  //  STATE TAB UTAMA
  const [poCategory, setPoCategory] = useState<"SO" | "REP">("SO");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRef[]>([]);
  const [replacementOrders, setReplacementOrders] = useState<ReplacementRef[]>(
    [],
  );

  const [vendorOpen, setVendorOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState<Record<number, boolean>>({});
  const [openOrderCombobox, setOpenOrderCombobox] = useState<
    Record<number, boolean>
  >({});
  const [openVendorItemCombobox, setOpenVendorItemCombobox] = useState<
    Record<number, boolean>
  >({});

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

  const selectedExpenseCategory = watch("expenseCategory");
  const selectedVendorId = watch("vendorId");

  const isProductExpense = selectedExpenseCategory === "PRODUCT";

  //  Mengambil daftar service/jasa dari vendor yang dipilih
  const availableVendorItems = useMemo(() => {
    if (isProductExpense || !selectedVendorId) return [];
    const currentVendor = vendors.find((v) => v.id === selectedVendorId);
    return currentVendor?.vendorItems?.map((vi: any) => vi.item) || [];
  }, [selectedVendorId, vendors, isProductExpense]);

  //  Filter vendor pintar berdasarkan kategori pengeluaran
  const filteredVendors = useMemo(() => {
    if (isProductExpense) {
      return vendors.filter((v: any) => v.types && v.types.includes("PRODUCT"));
    } else {
      return vendors.filter((v: any) => v.types && v.types.includes("SERVICE"));
    }
  }, [vendors, isProductExpense]);

  useEffect(() => {
    const currentVendorId = getValues("vendorId");
    if (currentVendorId) {
      const isStillValid = filteredVendors.some(
        (v) => v.id === currentVendorId,
      );
      if (!isStillValid) {
        setValue("vendorId", "");
        fields.forEach((_, index) => {
          setValue(`items.${index}.vendorItemId`, "");
          if (!isProductExpense) setValue(`items.${index}.itemName`, "");
        });
      }
    }
  }, [
    selectedExpenseCategory,
    filteredVendors,
    getValues,
    setValue,
    fields,
    isProductExpense,
  ]);

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
        const [resV, resCur, resP, resO, resRep, resPO] = await Promise.all([
          fetchApi("/vendors/order/add"),
          fetchApi("/currencies"),
          fetchApi("/products/order"),
          fetchApi("/orders/all?take=100"),
          fetchApi("/replacement-orders/all?take=100"),
          fetchApi(`/purchase-orders/${poId}`),
        ]);

        const [v, curData, p, oData, repData, data] = await Promise.all([
          resV.json(),
          resCur.json(),
          resP.json(),
          resO.json(),
          resRep.ok ? resRep.json() : { data: [] },
          resPO.json(),
        ]);

        setVendors(v);
        setProducts(p);
        setCurrencies(
          curData?.data ||
            curData || [{ code: "IDR", symbol: "Rp", name: "Rupiah" }],
        );
        setOrders(oData?.data || oData || []);
        setReplacementOrders(repData?.data || repData || []);

        if (data.items && data.items.length > 0) {
          if (data.items[0].replacementOrderId) {
            setPoCategory("REP");
          } else {
            setPoCategory("SO");
          }
        }

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
            variantId: i.variantId || "",
            vendorItemId: i.vendorItemId || "",
            selectedAttributes: i.selectedAttributes || {},
            orderId: i.orderId || "",
            replacementOrderId: i.replacementOrderId || "",
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
          productId: isProductExpense ? item.productId || undefined : undefined,
          vendorItemId: !isProductExpense
            ? item.vendorItemId || undefined
            : undefined,
          orderId: poCategory === "SO" ? item.orderId || undefined : undefined,
          replacementOrderId:
            poCategory === "REP"
              ? item.replacementOrderId || undefined
              : undefined,
          selectedAttributes: isProductExpense
            ? item.selectedAttributes
            : undefined,
          variantId: isProductExpense ? item.variantId : undefined,
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

  const handleAutoFillFromReference = async (
    refType: "SO" | "REP",
    refId: string,
    index: number,
  ) => {
    try {
      let originalItems = [];
      let suggestedVendorId = "";
      let vendorCount = 0;

      if (refType === "SO") {
        const res = await fetchApi(`/orders/${refId}`);
        if (!res.ok) throw new Error("Gagal mengambil SO");
        const detail = await res.json();
        const orderData = detail.data || detail;

        originalItems = orderData.products || [];
        if (orderData.vendors && orderData.vendors.length > 0) {
          suggestedVendorId = orderData.vendors[0].id;
          vendorCount = orderData.vendors.length;
        }
      } else if (refType === "REP") {
        const resRep = await fetchApi(`/replacement-orders/${refId}`);
        if (!resRep.ok) throw new Error("Gagal mengambil REP");
        const detailRep = await resRep.json();
        const repData = detailRep.data || detailRep;

        originalItems = repData.items || [];

        if (repData.referenceOrderId) {
          const resSo = await fetchApi(`/orders/${repData.referenceOrderId}`);
          if (resSo.ok) {
            const detailSo = await resSo.json();
            const soData = detailSo.data || detailSo;

            if (soData.vendors && soData.vendors.length > 0) {
              suggestedVendorId = soData.vendors[0].id;
              vendorCount = soData.vendors.length;
            }
          }
        }
      }

      if (originalItems.length === 0) {
        toast.warning("Pesanan ini tidak memiliki item/produk.");
        return;
      }

      if (suggestedVendorId) {
        setValue("vendorId", suggestedVendorId);
        if (vendorCount > 1) {
          toast.success(
            `Ditemukan ${vendorCount} vendor pada pesanan asli. Vendor pertama diisi otomatis.`,
          );
        } else {
          toast.success("Vendor berhasil ditarik otomatis.");
        }
      }

      const mapItemToForm = (item: any) => {
        const fallbackProductName =
          products.find((p) => p.id === item.productId)?.name || "";
        return {
          itemName: item.productName || fallbackProductName,
          productId: item.productId || "",
          variantId: item.variantId || "",
          selectedAttributes: item.selectedAttributes || {},
          orderId: refType === "SO" ? refId : "",
          replacementOrderId: refType === "REP" ? refId : "",
          quantityOrder: item.quantity || 1,
          quantityStock: 0,
          quantityPurchase: item.quantity || 1,
          uom: "pcs",
          unitPrice: Number(item.unitPrice || 0),
          remarks: item.remarks || "",
        };
      };

      const firstMappedItem = mapItemToForm(originalItems[0]);
      setValue(`items.${index}.productId`, firstMappedItem.productId);
      setValue(`items.${index}.variantId`, firstMappedItem.variantId);
      setValue(`items.${index}.itemName`, firstMappedItem.itemName);
      setValue(`items.${index}.quantityOrder`, firstMappedItem.quantityOrder);
      setValue(`items.${index}.unitPrice`, firstMappedItem.unitPrice);
      setValue(
        `items.${index}.selectedAttributes`,
        firstMappedItem.selectedAttributes,
      );
      setValue(`items.${index}.remarks`, firstMappedItem.remarks);
      recalculateQtyPurchase(index);

      if (originalItems.length > 1) {
        const remainingMappedItems = originalItems.slice(1).map(mapItemToForm);
        append(remainingMappedItems);
        toast.success(
          `Berhasil menambahkan ${originalItems.length} barang secara otomatis!`,
        );
      }
    } catch (error) {
      console.error("Gagal Auto-fill:", error);
      toast.error("Terjadi kesalahan saat memuat data referensi.");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        <Loader2 className="animate-spin inline mr-2" /> Memuat data Purchase
        Order...
      </div>
    );

  return (
    <Card className="space-y-4 mx-auto w-full">
      <CardHeader className=" border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            Edit Purchase Order: {form.getValues("poNumber")}
          </CardTitle>

          <div className="flex p-1 space-x-1 bg-slate-100/80 rounded-lg w-full md:w-fit border border-slate-200">
            <button
              type="button"
              disabled={poCategory !== "SO"}
              onClick={() => setPoCategory("SO")}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5",
                poCategory === "SO"
                  ? "bg-white shadow-sm text-blue-700 ring-1 ring-black/5"
                  : "text-slate-400 cursor-not-allowed opacity-60",
              )}>
              {poCategory !== "SO" && (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              Sales Order (Reguler)
            </button>
            <button
              type="button"
              disabled={poCategory !== "REP"}
              onClick={() => setPoCategory("REP")}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5",
                poCategory === "REP"
                  ? "bg-white shadow-sm text-orange-600 ring-1 ring-black/5"
                  : "text-slate-400 cursor-not-allowed opacity-60",
              )}>
              {poCategory !== "REP" && (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              Replacement Order
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              const firstErrorField = Object.keys(
                errors,
              )[0] as keyof typeof errors;
              let errorMessage = errors[firstErrorField]?.message as
                | string
                | undefined;

              if (!errorMessage && Array.isArray(errors[firstErrorField])) {
                errorMessage =
                  "Mohon lengkapi detail pada daftar item pesanan.";
              }

              toast.error(
                `Periksa kembali isian Anda: ${errorMessage || "Ada field yang belum sesuai."}`,
              );
              console.error("Form Validation Errors:", errors);
            })}
            className="space-y-8">
            {/* === SECTION 1: HEADER PO === */}
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5 border rounded-lg shadow-sm transition-colors duration-300",
                poCategory === "REP"
                  ? "bg-orange-50/30 border-orange-100"
                  : "bg-white",
              )}>
              <h3 className="col-span-full font-semibold text-lg text-slate-700 border-b pb-2 flex items-center gap-2">
                Purchase Order Details
                {poCategory === "REP" && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    REPLACEMENT MODE
                  </span>
                )}
              </h3>

              <FormField
                control={control}
                name="poDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>PO Date</FormLabel>

                    <DatePickerHelper
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      placeholder="Pick a date"
                    />

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
                        className="h-10 bg-white"
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
                        <SelectTrigger className="h-10 bg-white">
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
                        <SelectTrigger className="h-10 bg-white">
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
                        <SelectTrigger className="h-10 bg-white">
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
                        <SelectTrigger className="h-10 bg-white">
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
                              "w-full justify-between h-10 bg-white",
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
                              {filteredVendors.map((vendor) => (
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
                        className="bg-white"
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
                      variantId: "",
                      vendorItemId: "",
                      selectedAttributes: {},
                      orderId: "",
                      replacementOrderId: "",
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

              {fields.length > 0 && (
                <div
                  className={cn(
                    "hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3 rounded-t-lg font-medium text-sm text-slate-50 transition-colors",
                    poCategory === "REP" ? "bg-orange-600" : "bg-slate-700",
                  )}>
                  <div className="col-span-3">
                    {isProductExpense
                      ? "Item Name & Product"
                      : "Service Name (Vendor Item)"}
                  </div>
                  <div className="col-span-2">
                    {poCategory === "SO" ? "Reference SO" : "Reference REP"}
                  </div>
                  <div className="col-span-3 text-center">
                    {isProductExpense
                      ? "Qty (Order | Stock | Buy)"
                      : "Quantity"}
                  </div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-1 text-right">Subtotal</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const subtotal =
                    (watch(`items.${index}.quantityPurchase`) || 0) *
                    (watch(`items.${index}.unitPrice`) || 0);
                  const currentProductId = watch(`items.${index}.productId`);
                  const selectedProduct = products.find(
                    (p) => p.id === currentProductId,
                  );
                  const currentSelectedAttrs =
                    watch(`items.${index}.selectedAttributes`) || {};

                  const orderIdError =
                    form.formState.errors.items?.[index]?.orderId?.message;

                  const handleAttributeSelect = (
                    attributeId: string,
                    valueId: string,
                  ) => {
                    const newAttrs = {
                      ...currentSelectedAttrs,
                      [attributeId]: valueId,
                    };
                    form.setValue(
                      `items.${index}.selectedAttributes`,
                      newAttrs,
                    );

                    if (selectedProduct?.productVariants) {
                      const selectedValIds = Object.values(newAttrs);
                      const matchedVariant = [
                        ...selectedProduct.productVariants,
                      ]
                        .sort(
                          (a, b) =>
                            b.combinationIds.length - a.combinationIds.length,
                        )
                        .find(
                          (v) =>
                            v.combinationIds.length > 0 &&
                            v.combinationIds.every((id: any) =>
                              selectedValIds.includes(id),
                            ),
                        );

                      if (matchedVariant) {
                        form.setValue(
                          `items.${index}.variantId`,
                          matchedVariant.id,
                        );
                        form.setValue(
                          `items.${index}.unitPrice`,
                          Number(matchedVariant.price),
                        );
                      } else {
                        form.setValue(`items.${index}.variantId`, "");
                      }
                    }
                  };

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200",
                        poCategory === "REP" &&
                          "border-orange-200 hover:border-orange-300",
                      )}>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start p-4 lg:p-4">
                        {/* 1. Item Name & Product / Service Relation */}
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
                                    placeholder={
                                      isProductExpense
                                        ? "Type item name..."
                                        : "Tulis nama manual..."
                                    }
                                    className="h-10"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {isProductExpense ? (
                            <FormField
                              control={control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
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
                                            "w-full justify-between h-9 text-xs font-normal bg-slate-50 border-dashed",
                                            !field.value &&
                                              "text-muted-foreground",
                                          )}>
                                          {field.value
                                            ? products.find(
                                                (p) => p.id === field.value,
                                              )?.name
                                            : "Link to Master Product..."}
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
                                                    `items.${index}.variantId`,
                                                    "",
                                                  );
                                                  form.setValue(
                                                    `items.${index}.selectedAttributes`,
                                                    {},
                                                  );
                                                  form.setValue(
                                                    `items.${index}.itemName`,
                                                    p.name,
                                                  );
                                                  form.setValue(
                                                    `items.${index}.quantityStock`,
                                                    p.stock || 0,
                                                  );
                                                  form.setValue(
                                                    `items.${index}.uom`,
                                                    p.uom || "pcs",
                                                  );
                                                  form.setValue(
                                                    `items.${index}.unitPrice`,
                                                    p.productVariants?.length
                                                      ? 0
                                                      : Number(p.basePrice),
                                                  );
                                                  recalculateQtyPurchase(index);
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
                                                  <span className="text-[10px] text-gray-500">
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
                          ) : (
                            <FormField
                              control={control}
                              name={`items.${index}.vendorItemId`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <Popover
                                    open={openVendorItemCombobox[index]}
                                    onOpenChange={(val) =>
                                      setOpenVendorItemCombobox((prev) => ({
                                        ...prev,
                                        [index]: val,
                                      }))
                                    }>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          disabled={!selectedVendorId}
                                          className={cn(
                                            "w-full justify-between h-9 text-xs font-normal bg-purple-50/50 border-purple-200 border-dashed text-purple-700 hover:bg-purple-100",
                                            !field.value &&
                                              "text-muted-foreground",
                                            !selectedVendorId &&
                                              "opacity-50 cursor-not-allowed",
                                          )}>
                                          {field.value
                                            ? availableVendorItems.find(
                                                (vi: any) =>
                                                  vi.id === field.value,
                                              )?.name
                                            : "Pilih Master Jasa Vendor..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-75 p-0"
                                      align="start">
                                      <Command>
                                        <CommandInput placeholder="Search vendor item..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            Vendor Item not found.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {availableVendorItems.map(
                                              (vi: any) => (
                                                <CommandItem
                                                  key={vi.id}
                                                  value={vi.name}
                                                  onSelect={() => {
                                                    field.onChange(vi.id);
                                                    form.setValue(
                                                      `items.${index}.itemName`,
                                                      vi.name,
                                                    );
                                                    form.setValue(
                                                      `items.${index}.productId`,
                                                      "",
                                                    );
                                                    form.setValue(
                                                      `items.${index}.variantId`,
                                                      "",
                                                    );
                                                    form.setValue(
                                                      `items.${index}.selectedAttributes`,
                                                      {},
                                                    );
                                                    setOpenVendorItemCombobox(
                                                      (prev) => ({
                                                        ...prev,
                                                        [index]: false,
                                                      }),
                                                    );
                                                  }}>
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      vi.id === field.value
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                    )}
                                                  />
                                                  {vi.name}
                                                </CommandItem>
                                              ),
                                            )}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  {!selectedVendorId && (
                                    <p className="text-[10px] text-red-500 mt-1">
                                      Pilih Vendor di atas terlebih dahulu.
                                    </p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* 2. KOTAK REFERENSI */}
                        <div className="lg:col-span-2">
                          <FormItem className="flex flex-col">
                            <FormLabel className="lg:hidden">
                              {poCategory === "SO"
                                ? "Reference SO"
                                : "Reference REP"}
                            </FormLabel>
                            <Popover
                              open={openOrderCombobox[index]}
                              onOpenChange={(val) =>
                                setOpenOrderCombobox((prev) => ({
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
                                      "w-full justify-between h-10 font-normal bg-white",
                                      !watch(`items.${index}.orderId`) &&
                                        !watch(
                                          `items.${index}.replacementOrderId`,
                                        ) &&
                                        "text-muted-foreground",
                                      poCategory === "REP" &&
                                        watch(
                                          `items.${index}.replacementOrderId`,
                                        ) &&
                                        "border-orange-300 text-orange-700 bg-orange-50/50",
                                      orderIdError &&
                                        "border-red-500 ring-1 ring-red-500",
                                    )}>
                                    {poCategory === "SO"
                                      ? watch(`items.${index}.orderId`)
                                        ? `SO: ${orders.find((o) => o.id === watch(`items.${index}.orderId`))?.orderNumber}`
                                        : isProductExpense
                                          ? "Pilih SO (Wajib)..."
                                          : "Pilih SO (Opsional)..."
                                      : watch(
                                            `items.${index}.replacementOrderId`,
                                          )
                                        ? `REP: ${replacementOrders.find((r) => r.id === watch(`items.${index}.replacementOrderId`))?.replacementNumber}`
                                        : isProductExpense
                                          ? "Pilih REP (Wajib)..."
                                          : "Pilih REP (Opsional)..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-0 shadow-lg"
                                align="start">
                                <Command>
                                  <CommandInput
                                    placeholder={
                                      poCategory === "SO"
                                        ? "Search SO number..."
                                        : "Search REP number..."
                                    }
                                  />
                                  <CommandList>
                                    <CommandEmpty>No data found.</CommandEmpty>

                                    <CommandGroup>
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          form.setValue(
                                            `items.${index}.orderId`,
                                            "",
                                          );
                                          form.setValue(
                                            `items.${index}.replacementOrderId`,
                                            "",
                                          );
                                          setOpenOrderCombobox((prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }));
                                        }}>
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !watch(`items.${index}.orderId`) &&
                                              !watch(
                                                `items.${index}.replacementOrderId`,
                                              )
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        <span className="text-muted-foreground italic">
                                          -- Kosongkan Referensi --
                                        </span>
                                      </CommandItem>
                                    </CommandGroup>

                                    {poCategory === "SO" && (
                                      <CommandGroup heading="Daftar Sales Orders">
                                        {orders.map((o) => (
                                          <CommandItem
                                            key={`SO-${o.id}`}
                                            value={o.orderNumber}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.orderId`,
                                                o.id,
                                              );
                                              form.setValue(
                                                `items.${index}.replacementOrderId`,
                                                "",
                                              );
                                              setOpenOrderCombobox((prev) => ({
                                                ...prev,
                                                [index]: false,
                                              }));
                                              if (isProductExpense) {
                                                handleAutoFillFromReference(
                                                  "SO",
                                                  o.id,
                                                  index,
                                                );
                                              }
                                              form.clearErrors(
                                                `items.${index}.orderId`,
                                              );
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                o.id ===
                                                  watch(
                                                    `items.${index}.orderId`,
                                                  )
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            <span className="text-blue-700 font-medium">
                                              {o.orderNumber}
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}

                                    {poCategory === "REP" && (
                                      <CommandGroup heading="Daftar Replacement Orders">
                                        {replacementOrders.map((r) => (
                                          <CommandItem
                                            key={`REP-${r.id}`}
                                            value={r.replacementNumber}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.replacementOrderId`,
                                                r.id,
                                              );
                                              form.setValue(
                                                `items.${index}.orderId`,
                                                "",
                                              );
                                              setOpenOrderCombobox((prev) => ({
                                                ...prev,
                                                [index]: false,
                                              }));
                                              if (isProductExpense) {
                                                handleAutoFillFromReference(
                                                  "REP",
                                                  r.id,
                                                  index,
                                                );
                                              }
                                              form.clearErrors(
                                                `items.${index}.orderId`,
                                              );
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                r.id ===
                                                  watch(
                                                    `items.${index}.replacementOrderId`,
                                                  )
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            <span className="text-orange-600 font-medium">
                                              {r.replacementNumber}
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {orderIdError && (
                              <span className="text-red-500 text-xs mt-1 font-medium">
                                {String(orderIdError)}
                              </span>
                            )}
                          </FormItem>
                        </div>

                        {/* 3. Quantities & UOM */}
                        <div className="lg:col-span-3 grid grid-cols-3 gap-2">
                          <FormField
                            control={control}
                            name={`items.${index}.quantityOrder`}
                            render={({ field }) => (
                              <FormItem
                                className={
                                  !isProductExpense ? "col-span-3" : ""
                                }>
                                <FormLabel className="lg:hidden text-xs text-center block">
                                  {isProductExpense ? "Qty Order" : "Quantity"}
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
                                      if (isProductExpense)
                                        recalculateQtyPurchase(index);
                                      else
                                        form.setValue(
                                          `items.${index}.quantityPurchase`,
                                          e.target.valueAsNumber || 0,
                                        );
                                    }}
                                    className="text-center h-10 border-blue-200 bg-blue-50/30"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {isProductExpense && (
                            <>
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
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
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
                                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">
                                      {currentCurrencySymbol}
                                    </span>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="any"
                                      {...field}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        field.onChange(isNaN(val) ? 0 : val);
                                      }}
                                      className="pl-9 h-10 text-right font-mono"
                                      placeholder="0.00"
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

                      {/* Variants Logic (Hanya untuk Product) */}
                      {isProductExpense &&
                        selectedProduct?.availableAttributes &&
                        selectedProduct.availableAttributes.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-slate-700 mb-3">
                                Pilih Varian Produk:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedProduct.availableAttributes.map(
                                  (attr: any) => (
                                    <div
                                      key={attr.attributeId}
                                      className="flex flex-col space-y-1.5">
                                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
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
                                        <SelectTrigger className="h-9 text-sm bg-white border-slate-300 w-full">
                                          <SelectValue
                                            className="w-full"
                                            placeholder={`Pilih ${attr.attributeName}`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {attr.values.map((val: any) => (
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
                            </div>
                          </div>
                        )}

                      {/* Remarks */}
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
                    Menyimpan...
                  </>
                ) : (
                  "Update Purchase Order"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
