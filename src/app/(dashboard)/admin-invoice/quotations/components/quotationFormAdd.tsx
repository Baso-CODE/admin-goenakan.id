"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Banknote,
  Box,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import ClientAddForm from "@/app/(dashboard)/super-admin/clients/components/addClientForm";
import { ClientAddModal } from "@/app/(dashboard)/super-admin/clients/components/clientAddmodal";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  getNotesStore,
  QuotationNotesSection,
  resetNotesStore,
} from "./helper/quotationNotesSection";
import { ClientData, NoteCategory, ProductData } from "./quotationForm";

export type Currency = { code: string; name: string; symbol: string };

const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "FOLLOW_UP",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

const quotationSchema = z.object({
  date: z.date(),
  validUntil: z.date().optional(),
  status: z.enum(QUOTATION_STATUSES).default("DRAFT"),
  clientId: z.string().min(1, "Client wajib dipilih!"),
  picId: z.string().optional(),
  currencyCode: z.string().default("IDR"),
  paymentTerms: z.string().optional(),
  notes: z
    .array(
      z.object({
        categoryId: z.string(),
        contents: z.array(z.string()).min(1),
      }),
    )
    .optional(),
  items: z
    .array(
      z.object({
        isManualProduct: z.boolean().default(false),
        productId: z.string().optional(),
        variantId: z.string().optional(),
        selectedAttributes: z.record(z.string(), z.any()).optional(),
        productName: z.string().min(1, "Product name is required"),
        description: z.string().optional(),

        // ✨ TAMBAHKAN BARIS INI AGAR QUANTITY IKUT TERVALIDASI DAN TERKIRIM
        quantity: z.coerce.number().min(1, "Quantity minimal 1").default(1),

        unitPrice: z.coerce.number().min(0).default(0), // Pastikan juga unitPrice ada
        discount: z.coerce.number().min(0).default(0),
        remarks: z.string().optional(),
        tiers: z
          .array(
            z.object({
              minQuantity: z.coerce.number().min(1, "Min 1"),
              maxQuantity: z.coerce.number().optional(),
              quantityLabel: z.string().optional(),
              unitPrice: z.coerce.number().min(0),
            }),
          )
          .min(1, "Minimal 1 opsi Qty/Harga harus diisi"),
      }),
    )
    .min(1, "Add at least one item"),
});

export type AddQuotationFormValues = z.infer<typeof quotationSchema>;

// ============================================================
// SUB-COMPONENT: OrderSummary (Glassmorphism & Real-time Calculation)
// ============================================================
function OrderSummary({ form, isLoading }: { form: any; isLoading: boolean }) {
  const items = form.watch("items") || [];
  const currencyCode = form.watch("currencyCode") || "IDR"; // Dinamis mengikuti form

  const subTotal = items.reduce((acc: number, item: any) => {
    const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1; // Ambil dari input Qty baris produk
    const unitPrice = Number(item.unitPrice) || 0; // Harga satuan murni hasil kalkulasi
    return acc + qty * unitPrice;
  }, 0);

  const discount = items.reduce(
    (acc: number, item: any) => acc + Number(item.discount || 0),
    0,
  );

  const grandTotal = subTotal - discount;

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-slate-50/90 to-slate-100/50 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-slate-900/5 h-fit">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-blue-500" /> Estimasi Biaya
        </h3>
      </div>

      <div className="space-y-3 pt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Estimasi Subtotal</span>
          <span className="font-semibold text-slate-700">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: currencyCode,
            }).format(subTotal)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 text-xs">
            <span>Total Diskon Item</span>
            <span>
              -{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: currencyCode,
              }).format(discount)}
            </span>
          </div>
        )}

        <Separator className="bg-slate-200/60" />

        <div className="flex justify-between text-lg font-extrabold items-center">
          <span className="text-slate-800">Estimasi Total</span>
          <span className="text-blue-600 tracking-tight">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: currencyCode,
            }).format(grandTotal >= 0 ? grandTotal : 0)}
          </span>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-2 italic leading-relaxed">
          *Total dihitung secara real-time berdasarkan jumlah kuantitas dan
          harga satuan terkini (termasuk penyesuaian varian/atribut).
        </p>

        <Button
          type="submit"
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
          disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : (
            "Simpan & Generate Penawaran"
          )}
        </Button>
      </div>
    </div>
  );
}
// ============================================================
// SUB-COMPONENT: ItemRow Add Quotation
// ============================================================
function ItemRow({
  index,
  products,
  form,
  onRemove,
  canRemove,
  onImageChange,
  imageFile,
}: {
  index: number;
  products: ProductData[];
  form: any;
  onRemove: () => void;
  canRemove: boolean;
  onImageChange: (index: number, file: File | null) => void;
  imageFile: File | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openCombobox, setOpenCombobox] = useState(false);

  const isManualProduct = form.watch(`items.${index}.isManualProduct`);
  const selectedProductId = form.watch(`items.${index}.productId`);
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  // Menggunakan format object kosong default agar tidak undefined
  const currentSelectedAttrs =
    form.watch(`items.${index}.selectedAttributes`) || {};

  const {
    fields: tierFields,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control: form.control,
    name: `items.${index}.tiers`,
  });

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  // ✨ LOGIKA UTAMA YANG SUDAH DIPERBARUI: (Mencegah Harga Dobel & Menjaga Jarak Tiers)
  const handleAttributeToggle = (attributeId: string, valueId: string) => {
    // 1. Tentukan status baru (toggle)
    const currentArr: string[] = Array.isArray(
      currentSelectedAttrs[attributeId],
    )
      ? currentSelectedAttrs[attributeId]
      : [];

    const isSelected = currentArr.includes(valueId);
    const newArr = isSelected
      ? currentArr.filter((id: string) => id !== valueId)
      : [...currentArr, valueId];

    const newAttrs = {
      ...currentSelectedAttrs,
      [attributeId]: newArr,
    };

    // 2. FUNGSI HITUNG ULANG TOTAL (Murni dari Atribut, tanpa dobel varian)
    const calculateTotalExtra = (attrsObj: Record<string, string[]>) => {
      let extra = 0;
      let matchedVariantId = undefined;

      if (!selectedProduct) return { extra, matchedVariantId };

      const allSelectedValIds = Object.values(attrsObj)
        .flat()
        .filter(Boolean) as string[];

      // A. Hitung modifier atribut (HANYA INI YANG MENAMBAH HARGA EKSTRA)
      selectedProduct.availableAttributes?.forEach((attr: any) => {
        attr.values.forEach((val: any) => {
          if (allSelectedValIds.includes(val.valueId)) {
            extra += Number(val.priceModifier || 0);
          }
        });
      });

      // B. Cari ID Varian yang cocok
      const matchedVariant = selectedProduct.productVariants?.find((v: any) => {
        if (!v.combinationIds) return false;
        // Pastikan jumlah pilihan pas dan semuanya cocok agar mendapat Varian yang tepat
        return (
          v.combinationIds.length === allSelectedValIds.length &&
          v.combinationIds.every((id: string) => allSelectedValIds.includes(id))
        );
      });

      if (matchedVariant) {
        matchedVariantId = matchedVariant.id;
        // ✨ Harga varian tidak lagi ditambahkan di sini agar tidak dobel.
      }

      return { extra, matchedVariantId };
    };

    // Hitung ekstra lama dan ekstra baru untuk mendapatkan SELISIH (Diff) khusus Tiers
    const oldCalc = calculateTotalExtra(currentSelectedAttrs);
    const newCalc = calculateTotalExtra(newAttrs);
    const priceDiff = newCalc.extra - oldCalc.extra;

    // 3. UPDATE FORM DENGAN HARGA PASTI (Base Price + Ekstra Baru)
    const basePrice = Number(selectedProduct?.basePrice || 0);
    const newTotalUnitPrice = basePrice + newCalc.extra;

    form.setValue(`items.${index}.selectedAttributes`, newAttrs);
    form.setValue(`items.${index}.variantId`, newCalc.matchedVariantId);

    // Set harga utama dengan total harga absolut yang aman
    form.setValue(`items.${index}.unitPrice`, newTotalUnitPrice);

    // 4. UPDATE TIERS BERDASARKAN SELISIH (Agar tingkatan harga tetap terjaga jaraknya)
    const currentTiers = form.getValues(`items.${index}.tiers`) || [];
    currentTiers.forEach((tier: any, i: number) => {
      const currentTierPrice = Number(tier.unitPrice || 0);
      form.setValue(
        `items.${index}.tiers.${i}.unitPrice`,
        currentTierPrice + priceDiff,
      );
    });
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm transition-all duration-200">
      {/* --- BARIS UTAMA (GRID) --- */}
      <div className="grid grid-cols-12 gap-3 items-start p-3">
        {/* Toggle Manual/DB */}
        <div className="col-span-1 flex flex-col items-center gap-1 mt-1.5">
          <Switch
            checked={!!isManualProduct}
            onCheckedChange={(v) => {
              form.setValue(`items.${index}.isManualProduct`, v);
              if (v) {
                form.setValue(`items.${index}.productId`, "");
                form.setValue(`items.${index}.variantId`, undefined);
                form.setValue(`items.${index}.selectedAttributes`, {});
              } else {
                form.setValue(`items.${index}.productName`, "");
              }
            }}
            className="scale-75"
          />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            {isManualProduct ? "Man" : "DB"}
          </span>
        </div>

        {/* Input Produk */}
        <div className="col-span-4 flex flex-col gap-2">
          {isManualProduct ? (
            <Input
              placeholder="Nama barang/jasa manual..."
              className="h-10"
              {...form.register(`items.${index}.productName`)}
            />
          ) : (
            <div className="space-y-1">
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between h-10 font-normal bg-white",
                      !selectedProductId && "text-muted-foreground",
                    )}>
                    {selectedProductId
                      ? selectedProduct?.name || "Produk Tidak Ditemukan"
                      : "Cari Produk di Database..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama atau SKU produk..." />
                    <CommandList>
                      <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {products.map((p: any) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.sku || ""}`}
                            onSelect={() => {
                              form.setValue(`items.${index}.productId`, p.id);
                              form.setValue(
                                `items.${index}.productName`,
                                p.name,
                              );
                              form.setValue(
                                `items.${index}.variantId`,
                                undefined,
                              );
                              form.setValue(
                                `items.${index}.selectedAttributes`,
                                {},
                              );

                              const basePrice = Number(p.basePrice || 0);
                              form.setValue(
                                `items.${index}.unitPrice`,
                                basePrice,
                              );

                              if (p.priceTiers && p.priceTiers.length > 0) {
                                const autoTiers = p.priceTiers.map(
                                  (tier: any) => ({
                                    minQuantity: tier.minQuantity,
                                    maxQuantity: tier.maxQuantity || undefined,
                                    quantityLabel: "Pcs",
                                    unitPrice: Number(tier.price),
                                  }),
                                );
                                form.setValue(
                                  `items.${index}.tiers`,
                                  autoTiers,
                                );
                              } else {
                                form.setValue(`items.${index}.tiers`, [
                                  {
                                    minQuantity: 1,
                                    maxQuantity: undefined,
                                    quantityLabel: "Pcs",
                                    unitPrice: basePrice,
                                  },
                                ]);
                              }

                              if (p.description) {
                                form.setValue(
                                  `items.${index}.description`,
                                  p.description,
                                );
                                setExpanded(true);
                              }
                              setOpenCombobox(false);
                            }}>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                p.id === selectedProductId
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{p.name}</span>
                              <span className="text-[10px] text-gray-500">
                                SKU: {p.sku || "-"}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedProduct && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500 pl-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    SKU:{" "}
                    <span className="font-medium text-slate-700">
                      {selectedProduct.sku || "-"}
                    </span>
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    UOM:{" "}
                    <span className="font-medium text-slate-700">
                      {selectedProduct.uom || "-"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Qty */}
        <div className="col-span-2">
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              className="pr-10 h-10 text-center"
              {...form.register(`items.${index}.quantity`)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground pointer-events-none">
              Qty
            </span>
          </div>
        </div>

        {/* Harga */}
        <div className="col-span-2">
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              className="h-10 text-right pr-2"
              {...form.register(`items.${index}.unitPrice`)}
            />
          </div>
        </div>

        {/* Diskon */}
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground pointer-events-none">
              Disc
            </span>
            <Input
              type="number"
              placeholder="0"
              className="pl-9 h-10 text-right pr-2"
              {...form.register(`items.${index}.discount`)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-1 mt-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((v) => !v)}>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-red-50"
            onClick={onRemove}
            disabled={!canRemove}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* ✨ AREA FULL-WIDTH: PILIHAN ATRIBUT/VARIAN (GLASSMORPHISM / iPHONE STYLE) */}
      {!isManualProduct &&
        selectedProduct?.availableAttributes &&
        selectedProduct.availableAttributes.length > 0 && (
          <div className="px-3 pb-4">
            <div className="relative overflow-hidden bg-linear-to-br from-slate-50/90 to-slate-100/50 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-slate-900/5">
              <p className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> Pilih
                Varian/Atribut:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedProduct.availableAttributes.map((attr: any) => (
                  <div
                    key={attr.attributeId}
                    className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      {attr.attributeName}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val: any) => {
                        const attributeSelection =
                          currentSelectedAttrs[attr.attributeId];
                        const isSelected = Array.isArray(attributeSelection)
                          ? attributeSelection.includes(val.valueId)
                          : false;

                        return (
                          <button
                            type="button"
                            key={val.valueId}
                            onClick={() =>
                              handleAttributeToggle(
                                attr.attributeId,
                                val.valueId,
                              )
                            }
                            className={cn(
                              "relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ease-out flex items-center justify-center",
                              isSelected
                                ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.4)] scale-105 border border-blue-500/80"
                                : "bg-white/80 text-slate-600 border border-slate-200/80 shadow-sm hover:bg-white hover:scale-105 hover:shadow-md backdrop-blur-md",
                            )}>
                            {val.value}
                            {val.priceModifier > 0 && (
                              <span
                                className={cn(
                                  "ml-1.5 opacity-90 text-[10px] font-medium tracking-wide",
                                  isSelected
                                    ? "text-blue-100"
                                    : "text-emerald-600",
                                )}>
                                (+{val.priceModifier})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* --- AREA TIERS --- */}
      <div className="p-3 bg-slate-50/50 border-t">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Opsi Kuantitas & Harga (Tiers)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2 py-0 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
            onClick={() =>
              appendTier({
                minQuantity: 1,
                maxQuantity: undefined,
                quantityLabel: "Pcs",
                unitPrice: 0,
              })
            }>
            <Plus className="w-3 h-3 mr-1" /> Tambah Opsi Tier
          </Button>
        </div>

        <div className="space-y-2">
          {tierFields.map((tierField, tierIndex) => (
            <div
              key={tierField.id}
              className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-md shadow-sm">
              <div className="w-24 relative">
                <Input
                  type="number"
                  placeholder="Min"
                  className="pr-7 h-8 text-xs"
                  {...form.register(
                    `items.${index}.tiers.${tierIndex}.minQuantity`,
                  )}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                  Min
                </span>
              </div>
              <div className="w-24 relative">
                <Input
                  type="number"
                  placeholder="Max"
                  className="pr-7 h-8 text-xs"
                  {...form.register(
                    `items.${index}.tiers.${tierIndex}.maxQuantity`,
                  )}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                  Max
                </span>
              </div>
              <div className="w-20">
                <Input
                  placeholder="Pcs"
                  className="h-8 text-xs"
                  {...form.register(
                    `items.${index}.tiers.${tierIndex}.quantityLabel`,
                  )}
                />
              </div>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="Harga Satuan"
                  className="h-8 text-xs"
                  {...form.register(
                    `items.${index}.tiers.${tierIndex}.unitPrice`,
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-red-50"
                onClick={() => removeTier(tierIndex)}
                disabled={tierFields.length <= 1}>
                <X className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* --- AREA EXPANDED (DESKRIPSI, GAMBAR DLL) --- */}
      {expanded && (
        <div className="border-t bg-gray-50/50 px-4 pb-4 pt-3 rounded-b-lg space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Product Specification
            </label>
            <Textarea
              placeholder={
                "Contoh:\nFabric: 100D Anti color moving fabric\nPrint: Full digital print\nShaft: 14mm black fiberglass shaft..."
              }
              className="text-xs min-h-25 resize-none bg-white font-mono"
              {...form.register(`items.${index}.description`)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Remarks / Catatan Item
            </label>
            <Input
              placeholder="Contoh: Warna sesuai request client..."
              className="text-xs bg-white"
              {...form.register(`items.${index}.remarks`)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Referensi Gambar (Opsional)
            </label>
            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-colors bg-white cursor-pointer">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs">
                  Klik untuk upload gambar referensi
                </span>
                <span className="text-[10px] text-slate-300">
                  PNG, JPG, WEBP hingga 5MB
                </span>
              </button>
            ) : (
              <div className="relative w-fit group">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-28 w-28 object-cover rounded-lg border border-slate-200 shadow-sm transition-opacity group-hover:opacity-90"
                />
                <button
                  type="button"
                  onClick={() => {
                    onImageChange(index, null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-md transform hover:scale-110 transition-transform">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageChange(index, file);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN FORM
// ============================================================
export default function QuotationAddForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}) {
  const { fetchApi, status } = useApi();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [itemImages, setItemImages] = useState<Record<number, File | null>>({});
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isClientAddModalOpen, setIsClientAddModalOpen] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);

  const form = useForm<AddQuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<AddQuotationFormValues>,
    defaultValues: {
      date: new Date(),
      status: "DRAFT",
      picId: "",
      clientId: "",
      currencyCode: "IDR",
      paymentTerms: "",
      items: [
        {
          isManualProduct: false,
          productName: "",
          discount: 0,
          remarks: "",
          tiers: [
            {
              minQuantity: 1,
              maxQuantity: undefined,
              quantityLabel: "Pcs",
              unitPrice: 0,
            },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    resetNotesStore();
  }, []);

  // === FETCH MASTER DATA ===
  const fetchMaster = async () => {
    if (status !== "authenticated") return;

    try {
      setLoadingMaster(true);

      const [resC, resP, resN, resS, resCurr] = await Promise.all([
        fetchApi("/clients/order"),
        fetchApi("/products/order"),
        fetchApi("/quotation-notes-categories"),
        fetchApi("/sales?isActive=true"),
        fetchApi("/currencies"),
      ]);

      const clientData = resC.ok ? await resC.json() : [];
      const productData = resP.ok ? await resP.json() : [];
      const noteData = resN.ok ? await resN.json() : [];
      const currData = resCurr.ok ? await resCurr.json() : [];

      setClients(clientData.data || clientData || []);
      setProducts(productData.data || productData || []);
      setNoteCategories(noteData.data || noteData || []);
      setCurrencies(currData.data || currData || []);
    } catch (e) {
      console.error("❌ Error loading master data:", e);
      toast.error("Gagal memuat master data");
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    fetchMaster();
  }, [status]);

  const handleImageChange = (index: number, file: File | null) => {
    setItemImages((prev) => ({ ...prev, [index]: file }));
  };

  const handleFinalSubmit = (data: AddQuotationFormValues) => {
    const notes = getNotesStore();

    const jsonPayload = {
      date: data.date,
      validUntil: data.validUntil || undefined,
      status: data.status,
      clientId: data.clientId,
      picId: data.picId || undefined,
      currencyCode: data.currencyCode,
      paymentTerms: data.paymentTerms || undefined,
      items: data.items,
      notes: notes.length > 0 ? notes : undefined,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(jsonPayload));

    Object.entries(itemImages).forEach(([idx, file]) => {
      if (file) formData.append(`items[${idx}][image]`, file);
    });

    onSubmit(formData);
  };

  const handleClientAdded = async (newClient: ClientData) => {
    try {
      const res = await fetchApi("/clients/order");
      if (res.ok) {
        const clientData = await res.json();
        setClients(clientData.data || clientData || []);

        const addedClient = clientData.data?.find(
          (c: ClientData) => c.id === newClient.id,
        );
        if (addedClient) {
          setSelectedClient(addedClient);
          form.setValue("clientId", addedClient.id);
          form.setValue("picId", "");
        }
      }
    } catch (error) {
      console.error("Error refetching clients:", error);
      toast.error("Gagal me-refresh data client");
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFinalSubmit)}
          className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QUOTATION INFO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Detail Penawaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUOTATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Transaksi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start font-normal">
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih Tanggal</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Berlaku Hingga</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih Tanggal (Opsional)</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {field.value && (
                        <button
                          type="button"
                          onClick={() => field.onChange(undefined)}
                          className="text-[11px] text-red-400 hover:text-red-600 text-left">
                          Hapus tanggal
                        </button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*  TAMBAHAN: Currency Code */}
                <FormField
                  control={form.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-slate-500" /> Mata
                        Uang
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={loadingMaster}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue
                              placeholder={
                                loadingMaster
                                  ? "Memuat Mata Uang..."
                                  : "Pilih Mata Uang"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.code} - {curr.name} ({curr.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/*  TAMBAHAN: Payment Terms */}
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syarat Pembayaran (Payment Terms)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contoh: DP 50%, Pelunasan sebelum pengiriman..."
                          className="text-xs min-h-15"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* CLIENT INFO */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  Informasi Client
                </CardTitle>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setIsClientAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah Client Baru
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Pilih Client dari Database *</FormLabel>
                          <Popover
                            open={openClientCombobox}
                            onOpenChange={setOpenClientCombobox}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  disabled={loadingMaster}
                                  className={cn(
                                    "w-full justify-between bg-white h-11 border-blue-200 font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}>
                                  {field.value
                                    ? (() => {
                                        const c = clients.find(
                                          (client) => client.id === field.value,
                                        );
                                        return c
                                          ? `${c.name} (${c.type})`
                                          : "Pilih Client...";
                                      })()
                                    : loadingMaster
                                      ? "Memuat data client..."
                                      : "Ketik & Cari Client di Database..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-(--radix-popover-trigger-width) p-0"
                              align="start">
                              <Command>
                                <CommandInput placeholder="Cari nama client, tipe, atau kode..." />
                                <CommandList>
                                  <CommandEmpty>
                                    Client tidak ditemukan.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {clients.map((c) => (
                                      <CommandItem
                                        key={c.id}
                                        value={`${c.name} ${c.type} ${c.custCode || ""}`}
                                        onSelect={() => {
                                          field.onChange(c.id);
                                          setSelectedClient(c);
                                          form.setValue("picId", "");
                                          setOpenClientCombobox(false);
                                        }}>
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            c.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>
                                            {c.name} ({c.type})
                                          </span>
                                          {c.status && (
                                            <span className="text-[10px] text-muted-foreground">
                                              Status: {c.status}
                                            </span>
                                          )}
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
                    {selectedClient && (
                      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Detail Client
                              </p>
                              <h3 className="text-lg font-bold text-blue-600">
                                {selectedClient.name}
                              </h3>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]">
                                  {selectedClient.custCode}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-[10px]",
                                    selectedClient.type === "B2B"
                                      ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                                      : "bg-green-100 text-green-700 hover:bg-green-100",
                                  )}>
                                  {selectedClient.type}
                                </Badge>
                                {selectedClient.status === "POTENTIAL" && (
                                  <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    POTENTIAL
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                              <span>{selectedClient.address}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                              <span>{selectedClient.phone || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {selectedClient.type === "B2B" &&
                          selectedClient.pics &&
                          selectedClient.pics.length > 0 && (
                            <div className="border-t border-slate-200 bg-white px-4 py-3">
                              <FormField
                                control={form.control}
                                name="picId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Person in Charge (PIC)
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value ?? ""}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white mt-1.5">
                                          <SelectValue placeholder="Pilih PIC Client..." />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {selectedClient.pics.map((pic) => (
                                          <SelectItem
                                            key={pic.id}
                                            value={pic.id}>
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                                                {pic.name.charAt(0)}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                  {pic.name}
                                                </span>
                                                {(pic.position ||
                                                  pic.phone ||
                                                  pic.email) && (
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {pic.position
                                                      ? pic.position
                                                      : pic.phone || pic.email}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch("picId") &&
                                (() => {
                                  const pic = selectedClient.pics.find(
                                    (p) => p.id === form.watch("picId"),
                                  );
                                  if (!pic) return null;
                                  return (
                                    <div className="mt-2 flex items-center gap-3 p-2 rounded-md bg-blue-50 border border-blue-100">
                                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                        {pic.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                          {pic.name}
                                        </p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                          {pic.position && (
                                            <span className="text-[11px] text-slate-500">
                                              {pic.position}
                                            </span>
                                          )}
                                          {pic.phone && (
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {pic.phone}
                                            </span>
                                          )}
                                          {pic.email && (
                                            <span className="text-[11px] text-slate-500 truncate">
                                              {pic.email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ITEMS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="w-4 h-4" /> Produk & Jasa
              </CardTitle>
              <div className="hidden md:flex items-center gap-4 text-[11px] text-muted-foreground mr-auto ml-4">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">
                    Min/Max Qty
                  </span>
                  = Rentang Jumlah
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600"> Label</span> =
                  Satuan (Pcs/Unit)
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Rp</span> =
                  Harga Satuan
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Disc</span> =
                  Total Diskon Item
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({
                    isManualProduct: true,
                    productName: "",
                    quantity: 1, // ✨ Diperbarui: Memberikan nilai default 1 agar tidak kosong
                    unitPrice: 0,
                    discount: 0,
                    remarks: "",
                    tiers: [
                      {
                        minQuantity: 1,
                        maxQuantity: undefined,
                        quantityLabel: "Pcs",
                        unitPrice: 0,
                      },
                    ],
                  })
                }>
                <Plus className="w-4 h-4 mr-1" /> Tambah Baris
              </Button>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {fields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  index={index}
                  products={products}
                  form={form}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  onImageChange={handleImageChange}
                  imageFile={itemImages[index] ?? null}
                />
              ))}
            </CardContent>
          </Card>

          {/* FOOTER: NOTES & SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <QuotationNotesSection noteCategories={noteCategories} />
            </div>
            <OrderSummary form={form} isLoading={isLoading} />
          </div>
        </form>

        {/* MODAL TAMBAH KLIEN */}
        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Klien Baru</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <ClientAddForm />
            </div>
          </DialogContent>
        </Dialog>
      </Form>
      <ClientAddModal
        isOpen={isClientAddModalOpen}
        onClose={() => setIsClientAddModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </>
  );
}
