"use client";

import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useApi } from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 1. ZOD SCHEMA (Validasi Standar Enterprise)
export const replacementSchema = z.object({
  referenceOrderId: z.string().min(1, "Reference Order ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientB2BPICId: z.string().optional(),
  replacementReason: z.string().min(1, "Replacement reason is required"),
  remarks: z.string().optional(),
  sendToCustDate: z.string().optional(),
  arrivalInCustDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        variantId: z.string().optional(),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.coerce.number().optional(),
        remarks: z.string().optional(),
        customization: z.string().optional(),
        selectedAttributes: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1, "At least one item is required to replace"),
});

export type ReplacementFormValues = z.infer<typeof replacementSchema>;

interface ReplacementOrderFormProps {
  initialData?: ReplacementFormValues | null;
  onSubmit: (data: ReplacementFormValues) => void;
  isSubmitting: boolean;
}

export default function ReplacementOrderForm({
  initialData,
  onSubmit,
  isSubmitting,
}: ReplacementOrderFormProps) {
  const { fetchApi, status } = useApi();

  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderCurrency, setOrderCurrency] = useState("IDR");
  const [loadingData, setLoadingData] = useState(true);
  const [openOrderCombobox, setOpenOrderCombobox] = useState(false);

  // 2. SETUP FORM
  const form = useForm<ReplacementFormValues>({
    resolver: zodResolver(replacementSchema) as Resolver<ReplacementFormValues>,
    defaultValues: initialData || {
      referenceOrderId: "",
      clientId: "",
      clientB2BPICId: "",
      replacementReason: "",
      remarks: "",
      sendToCustDate: "",
      arrivalInCustDate: "",
      items: [
        {
          productId: "",
          variantId: "",
          quantity: 1,
          unitPrice: 0,
          remarks: "",
          customization: "",
        },
      ],
    },
  });

  const { control, handleSubmit, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    const fetchMasterData = async () => {
      if (status !== "authenticated") return;
      try {
        setLoadingData(true);
        const [resClient, resOrder, resProd] = await Promise.all([
          fetchApi("/clients/order"),
          fetchApi("/orders/all"),
          fetchApi("/products/order"),
        ]);

        if (resClient.ok) setClients(await resClient.json());
        if (resOrder.ok) {
          const ordData = await resOrder.json();
          setOrders(ordData.data || []);
        }
        if (resProd.ok) setProducts(await resProd.json());
      } catch (error) {
        console.error("Failed to load master data", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchMasterData();
  }, [status, fetchApi]);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="border-b bg-gray-50/50">
        <CardTitle className="text-xl flex items-center gap-2">
          <RefreshCcw className="w-5 h-5 text-orange-600" />
          {initialData ? "Edit Replacement Order" : "Create Replacement Order"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              // 1. Ambil field pertama yang mengalami error
              const firstErrorField = Object.keys(
                errors,
              )[0] as keyof typeof errors;
              let errorMessage = errors[firstErrorField]?.message as
                | string
                | undefined;

              // 2. Tangani error jika terjadi di dalam tabel 'items' (karena bentuknya array)
              if (!errorMessage && Array.isArray(errors[firstErrorField])) {
                errorMessage =
                  "Mohon lengkapi detail pada daftar barang pengganti (items).";
              }

              // 3. Tampilkan pesan peringatan lewat toast
              toast.error(
                `Periksa kembali isian Anda: ${errorMessage || "Ada field yang belum sesuai."}`,
              );

              // (Opsional) Cetak di console untuk mempermudah proses debugging saat proses development
              console.error("Form Validation Errors:", errors);
            })}
            className="space-y-8">
            {/* --- SECTION 1: DOKUMEN & KLIEN --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white">
              <h3 className="md:col-span-2 font-semibold text-gray-700 border-b pb-2">
                Informasi Utama
              </h3>

              <FormField
                control={control}
                name="referenceOrderId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reference Order (SO Asli)</FormLabel>
                    <Popover
                      open={openOrderCombobox}
                      onOpenChange={setOpenOrderCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingData}
                            className={cn(
                              "w-full justify-between font-normal bg-white",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value
                              ? orders.find((o) => o.id === field.value)
                                  ?.orderNumber
                              : "Pilih Order Asli..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-100 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nomor order (contoh: SO-2026-08...)" />
                          <CommandList>
                            <CommandEmpty>Order tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {orders.map((o) => (
                                <CommandItem
                                  key={o.id}
                                  value={o.orderNumber}
                                  onSelect={async () => {
                                    field.onChange(o.id);
                                    setOpenOrderCombobox(false);

                                    try {
                                      // 2. Ambil detail order dari API
                                      const res = await fetchApi(
                                        `/orders/${o.id}/replacement-data`,
                                      );
                                      if (res.ok) {
                                        const orderDetail = await res.json();
                                        const dataOrder =
                                          orderDetail.data || orderDetail;

                                        // 3. Auto-fill Kustomer (Wajib sama)
                                        if (dataOrder.clientId) {
                                          form.setValue(
                                            "clientId",
                                            dataOrder.clientId,
                                            {
                                              shouldValidate: true,
                                            },
                                          );
                                        }
                                        if (dataOrder.currencyCode) {
                                          setOrderCurrency(
                                            dataOrder.currencyCode,
                                          );
                                        }

                                        // 4. Auto-fill Items
                                        const originalItems =
                                          dataOrder.products;

                                        if (
                                          originalItems &&
                                          originalItems.length > 0
                                        ) {
                                          remove();

                                          const newItems = originalItems.map(
                                            (item: any) => ({
                                              productId: item.productId,
                                              variantId: item.variantId || "",
                                              quantity: item.quantity,
                                              unitPrice: item.unitPrice || 0,
                                              remarks: "",
                                              customization:
                                                item.customization || "",
                                              selectedAttributes:
                                                item.selectedAttributes || {},
                                            }),
                                          );
                                          append(newItems);
                                        }
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Gagal mengambil detail order:",
                                        error,
                                      );
                                    }
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      o.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span className="font-medium">
                                    {o.orderNumber}
                                  </span>
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client / Kustomer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={
                        loadingData || !!form.watch("referenceOrderId")
                      }>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Kustomer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                name="replacementReason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Alasan Penggantian (Reason)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Alasan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cacat Produksi">
                          Cacat Produksi (Defect)
                        </SelectItem>
                        <SelectItem value="Salah Ukuran/Warna">
                          Salah Ukuran / Warna
                        </SelectItem>
                        <SelectItem value="Hilang Pengiriman">
                          Hilang Saat Pengiriman
                        </SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- SECTION 2: BARANG YANG DIGANTI (ITEMS) --- */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800">
                  Barang yang Diganti (Items)
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
                      unitPrice: 0,
                      remarks: "",
                      customization: "",
                      selectedAttributes: {},
                    })
                  }
                  className="gap-2">
                  <PlusCircle className="w-4 h-4" /> Add Item
                </Button>
              </div>

              {fields.map((field, index) => {
                const currentProductId = form.watch(`items.${index}.productId`);
                const currentQty = form.watch(`items.${index}.quantity`) || 1;
                const currentSelectedAttrs =
                  form.watch(`items.${index}.selectedAttributes`) || {};

                const selectedProduct = products.find(
                  (p) => p.id === currentProductId,
                );

                const resolvePrice = (
                  prod: any,
                  variantId: string,
                  qty: number,
                ) => {
                  if (!prod) return 0;
                  let finalPrice = Number(prod.basePrice);

                  if (variantId && prod.productVariants) {
                    const variant = prod.productVariants.find(
                      (v: any) => v.id === variantId,
                    );
                    if (variant) finalPrice = Number(variant.price);
                  }

                  if (prod.priceTiers && prod.priceTiers.length > 0) {
                    const tiers = [...prod.priceTiers].sort(
                      (a, b) => b.minQuantity - a.minQuantity,
                    );
                    const applicableTier = tiers.find(
                      (tier: any) => qty >= tier.minQuantity,
                    );
                    if (applicableTier)
                      finalPrice = Number(applicableTier.price);
                  }
                  return finalPrice;
                };

                const handleAttributeSelect = (
                  attributeId: string,
                  valueId: string,
                ) => {
                  const newAttrs = {
                    ...currentSelectedAttrs,
                    [attributeId]: valueId,
                  };
                  form.setValue(`items.${index}.selectedAttributes`, newAttrs);

                  if (selectedProduct?.productVariants) {
                    const selectedValIds = Object.values(newAttrs);
                    const matchedVariant = [...selectedProduct.productVariants]
                      .sort(
                        (a, b) =>
                          b.combinationIds.length - a.combinationIds.length,
                      )
                      .find(
                        (v) =>
                          v.combinationIds.length > 0 &&
                          v.combinationIds.every((id: string) =>
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
                        resolvePrice(
                          selectedProduct,
                          matchedVariant.id,
                          currentQty,
                        ),
                      );
                    } else {
                      form.setValue(`items.${index}.variantId`, "");
                      form.setValue(
                        `items.${index}.unitPrice`,
                        resolvePrice(selectedProduct, "", currentQty),
                      );
                    }
                  }
                };

                return (
                  <div
                    key={field.id}
                    className="border rounded-lg bg-gray-50/50 hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-start border-b border-gray-100">
                      <div className="md:col-span-4">
                        <FormField
                          control={control}
                          name={`items.${index}.productId`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Produk</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  inputField.onChange(val);
                                  form.setValue(`items.${index}.variantId`, "");
                                  form.setValue(
                                    `items.${index}.selectedAttributes`,
                                    {},
                                  );
                                  const prod = products.find(
                                    (p) => p.id === val,
                                  );
                                  const hasVariants =
                                    prod?.productVariants?.length > 0;
                                  form.setValue(
                                    `items.${index}.unitPrice`,
                                    hasVariants
                                      ? 0
                                      : resolvePrice(prod, "", currentQty),
                                  );
                                }}
                                value={inputField.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white w-full">
                                    <SelectValue placeholder="Pilih Produk" />
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* --- INPUT QUANTITY --- */}
                      <div className="md:col-span-2">
                        <FormField
                          control={control}
                          name={`items.${index}.quantity`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...inputField}
                                  onChange={(e) => {
                                    const val = e.target.valueAsNumber;
                                    const newQty = isNaN(val) ? 0 : val;
                                    inputField.onChange(newQty);

                                    //  PERBAIKAN:
                                    // Logika resolvePrice DIHAPUS dari sini!
                                    // Jika qty diubah (misal dari 10 pcs retur jadi 2 pcs), harga satuan (unit price) tidak boleh berubah otomatis.
                                  }}
                                  className="bg-white text-center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* --- INPUT UNIT PRICE --- */}
                      <div className="md:col-span-2">
                        <FormField
                          control={control}
                          name={`items.${index}.unitPrice`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Harga Unit
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  {/* Tampilkan Simbol Mata Uang */}
                                  <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-medium">
                                    {orderCurrency}
                                  </span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={inputField.value}
                                    onChange={(e) => {
                                      let val = e.target.value;

                                      val = val.replace(/,/g, ".");

                                      val = val.replace(/[^0-9.]/g, "");

                                      inputField.onChange(val);
                                    }}
                                    onBlur={(e) => {
                                      const parsed = parseFloat(e.target.value);
                                      inputField.onChange(
                                        isNaN(parsed) ? 0 : parsed,
                                      );
                                      inputField.onBlur();
                                    }}
                                    className="bg-white text-right pl-10 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-4 flex justify-end pt-7">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => remove(index)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Item
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedProduct?.availableAttributes &&
                      selectedProduct.availableAttributes.length > 0 && (
                        <div className="p-4 bg-gray-50/80">
                          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">
                            Pilih Varian Atribut:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedProduct.availableAttributes.map(
                              (attr: any) => (
                                <div
                                  key={attr.attributeId}
                                  className="flex flex-col space-y-1.5">
                                  <label className="text-xs font-medium text-gray-500">
                                    {attr.attributeName}
                                  </label>
                                  <Select
                                    value={
                                      currentSelectedAttrs[attr.attributeId] ||
                                      ""
                                    }
                                    onValueChange={(val) =>
                                      handleAttributeSelect(
                                        attr.attributeId,
                                        val,
                                      )
                                    }>
                                    <SelectTrigger className="h-9 text-sm bg-white border-gray-300 w-full">
                                      <SelectValue
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
                      )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-b-lg border-t border-gray-100">
                      <FormField
                        control={control}
                        name={`items.${index}.customization`}
                        render={({ field: inputField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Customization (Cetak/Logo dll)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contoh: Sablon logo di dada kiri..."
                                {...inputField}
                                className="bg-white text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`items.${index}.remarks`}
                        render={({ field: inputField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Catatan Kerusakan / Retur
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contoh: Jahitan ketiak lepas..."
                                {...inputField}
                                className="bg-white text-sm"
                              />
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

            {/* --- SECTION 3: TANGGAL PENGIRIMAN & CATATAN --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white">
              <h3 className="md:col-span-2 font-semibold text-gray-700 border-b pb-2">
                Pengiriman & Catatan
              </h3>

              <FormField
                control={control}
                name="sendToCustDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Tanggal Pengiriman (Opsional)</FormLabel>
                    <DatePickerHelper
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(d) =>
                        field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                      }
                      placeholder="Pilih Tanggal Kirim"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="arrivalInCustDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Tanggal Tiba (Opsional)</FormLabel>
                    <DatePickerHelper
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(d) =>
                        field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                      }
                      placeholder="Pilih Tanggal Tiba"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Catatan Internal (Remarks)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan khusus terkait retur ini..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loadingData}
                className="bg-orange-600 hover:bg-orange-700">
                {isSubmitting
                  ? "Menyimpan..."
                  : initialData
                    ? "Update Data"
                    : "Buat Replacement Order"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
