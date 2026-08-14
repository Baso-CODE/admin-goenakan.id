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
  FileText,
  ImageIcon,
  Layers,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Currency } from "./quotationFormAdd";

export type PICData = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
};
export type ClientData = {
  id: string;
  name: string;
  type: "B2B" | "B2C" | string;
  status?: "POTENTIAL" | "OFFICIAL" | string;
  custCode: string;
  phone: string;
  address: string;
  originalAddress?: string;
  purchaseChannelId: string;
  pics: PICData[];
};
export type ProductData = {
  id: string;
  name: string;
  sku: string | null;
  basePrice: number;
  isCustom: boolean;
  description?: string;
  uom: string;
  category: {
    id: string;
    name: string;
  } | null;
  priceTiers: {
    id: string;
    minQuantity: number;
    price: number;
  }[];
  availableAttributes: {
    attributeId: string;
    attributeName: string;
    attributeType: string;
    values: {
      valueId: string;
      value: string;
      priceModifier: number;
      productAttributeValueId: string;
    }[];
  }[];
  productVariants: {
    id: string;
    variantName: string;
    sku: string | null;
    price: number;
    stock: number;
    combinationIds: string[];
    attributesDescription: string;
  }[];
};

export type NoteCategory = {
  id: string;
  name: string;
  isPublic: boolean;
  templates: { title: string; content: string }[];
};

// ============================================================
// MODULE-LEVEL NOTES STORE
// ============================================================
let _editNotesStore: { categoryId: string; contents: string[] }[] = [];
export function getEditNotesStore() {
  return _editNotesStore;
}
export function resetEditNotesStore(
  initial: { categoryId: string; contents: string[] }[] = [],
) {
  _editNotesStore = [...initial];
}

// ============================================================
// NOTES SECTION COMPONENT
// ============================================================
function NotesSection({
  noteCategories,
  initialNotes,
}: {
  noteCategories: NoteCategory[];
  initialNotes: { categoryId: string; contents: string[] }[];
}) {
  const [selectedNotes, setSelectedNotes] =
    useState<{ categoryId: string; contents: string[] }[]>(initialNotes);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  function handleToggle(categoryId: string, content: string) {
    const next = selectedNotes.map((n) => ({
      ...n,
      contents: [...n.contents],
    }));
    const idx = next.findIndex((n) => n.categoryId === categoryId);
    let result: { categoryId: string; contents: string[] }[];
    if (idx === -1) {
      result = [...next, { categoryId, contents: [content] }];
    } else {
      const cat = next[idx];
      const ci = cat.contents.indexOf(content);
      if (ci === -1) cat.contents.push(content);
      else cat.contents.splice(ci, 1);
      result =
        cat.contents.length === 0 ? next.filter((_, i) => i !== idx) : next;
    }
    _editNotesStore = result;
    setSelectedNotes(result);
  }

  function isChecked(catId: string, content: string) {
    return (
      selectedNotes
        .find((n) => n.categoryId === catId)
        ?.contents.includes(content) || false
    );
  }
  function getCount(catId: string) {
    return (
      selectedNotes.find((n) => n.categoryId === catId)?.contents.length || 0
    );
  }

  function renderGroup(
    isPublic: boolean,
    title: string,
    icon: React.ReactNode,
  ) {
    const filtered = noteCategories.filter((c) => c.isPublic === isPublic);
    if (filtered.length === 0) return null;
    return (
      <Card className={!isPublic ? "bg-slate-50 border-slate-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-1">
              {filtered.map((cat) => {
                const isOpen = !!openCats[cat.id];
                const count = getCount(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
                      onClick={() => toggleCat(cat.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5">
                            {count}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t bg-white px-2 py-2 space-y-1">
                        {cat.templates.map((tpl, i) => {
                          const checked = isChecked(cat.id, tpl.content);
                          return (
                            <div
                              key={`${cat.id}-${i}`}
                              className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
                              onClick={() => handleToggle(cat.id, tpl.content)}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                              />
                              <div className="grid gap-0.5 leading-none pointer-events-none">
                                <span className="text-sm font-medium">
                                  {tpl.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {tpl.content}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup(
        true,
        "Notes to Client (Public)",
        <FileText className="w-5 h-5 text-blue-600" />,
      )}
      {renderGroup(
        false,
        "Internal Notes (Private)",
        <Lock className="w-5 h-5 text-amber-600" />,
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: ItemRow Edit Quotation
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

  // ✨ LOGIKA UTAMA YANG SUDAH DIPERBARUI: (Kalkulasi Tiers Dipertahankan)
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

    // 2. FUNGSI HITUNG ULANG TOTAL EKSTRA (Murni dari Atribut, tanpa dobel varian)
    const calculateTotalExtra = (attrsObj: Record<string, string[]>) => {
      let extra = 0;
      let matchedVariantId = undefined;

      if (!selectedProduct) return { extra, matchedVariantId };

      const allSelectedValIds = Object.values(attrsObj)
        .flat()
        .filter(Boolean) as string[];

      // A. Hitung modifier atribut
      selectedProduct.availableAttributes?.forEach((attr: any) => {
        attr.values.forEach((val: any) => {
          if (allSelectedValIds.includes(val.valueId)) {
            extra += Number(val.priceModifier || 0);
          }
        });
      });

      // B. Cari ID Varian yang cocok tanpa menambah harganya lagi ke extra
      const matchedVariant = selectedProduct.productVariants?.find((v: any) => {
        if (!v.combinationIds) return false;
        return (
          v.combinationIds.length === allSelectedValIds.length &&
          v.combinationIds.every((id: string) => allSelectedValIds.includes(id))
        );
      });

      if (matchedVariant) {
        matchedVariantId = matchedVariant.id;
      }

      return { extra, matchedVariantId };
    };

    // Hitung ekstra lama dan ekstra baru untuk mendapatkan SELISIH (Diff)
    const oldCalc = calculateTotalExtra(currentSelectedAttrs);
    const newCalc = calculateTotalExtra(newAttrs);
    const priceDiff = newCalc.extra - oldCalc.extra;

    // 3. UPDATE FORM DENGAN HARGA PASTI UNTUK HARGA UTAMA (Base Price + Ekstra Baru)
    const basePrice = Number(selectedProduct?.basePrice || 0);
    const newTotalUnitPrice = basePrice + newCalc.extra;

    form.setValue(`items.${index}.selectedAttributes`, newAttrs);
    form.setValue(`items.${index}.variantId`, newCalc.matchedVariantId);

    // Set harga utama
    form.setValue(`items.${index}.unitPrice`, newTotalUnitPrice);

    // 4. UPDATE TIERS BERDASARKAN SELISIH (Agar tingkatan harga tetap terjaga)
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

// === CONSTANTS & SCHEMA ===
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
  isManualClient: z.boolean().default(false),
  currencyCode: z.string().default("IDR"),
  paymentTerms: z.string().optional(),
  clientId: z.string().optional(),
  picId: z.string().optional(),
  manualClientName: z.string().optional(),
  manualClientCompany: z.string().optional(),
  manualClientEmail: z.string().email().optional().or(z.literal("")),
  manualClientPhone: z.string().optional(),
  manualClientAddress: z.string().optional(),
  items: z
    .array(
      z.object({
        isManualProduct: z.boolean().default(false),
        productId: z.string().optional(),
        variantId: z.string().optional(),
        selectedAttributes: z.record(z.string(), z.any()).optional(),
        productName: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        quantity: z.coerce.number().min(0).default(0),
        unitPrice: z.coerce.number().min(0).default(0),
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

export type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  initialData?: any;
  onSubmit: (data: QuotationFormValues & { notes: any[] }) => void;
  isLoading?: boolean;
}

// ============================================================
// MAIN FORM - EDIT QUOTATION (UPDATED: + Currency & Payment Terms)
// ============================================================
export default function QuotationForm({
  initialData,
  onSubmit,
  isLoading,
}: QuotationFormProps) {
  const { fetchApi, status } = useApi();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [itemImages, setItemImages] = useState<Record<number, File | null>>({});

  const handleImageChange = (index: number, file: File | null) => {
    setItemImages((prev) => ({ ...prev, [index]: file }));
  };

  const initialNotes = useMemo<
    { categoryId: string; contents: string[] }[]
  >(() => {
    if (!initialData?.notes || !Array.isArray(initialData.notes)) return [];
    const grouped: Record<string, string[]> = {};
    initialData.notes.forEach((n: any) => {
      if (n.content) {
        if (!grouped[n.categoryId]) grouped[n.categoryId] = [];
        grouped[n.categoryId].push(n.content);
      } else if (n.contents) {
        grouped[n.categoryId] = n.contents;
      }
    });
    const result = Object.entries(grouped).map(([categoryId, contents]) => ({
      categoryId,
      contents,
    }));
    resetEditNotesStore(result);
    return result;
  }, [initialData]);

  // === FETCH DATA MASTER ===
  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      try {
        setLoadingData(true);

        const [resClients, resProducts, resNotes, resCurr] = await Promise.all([
          fetchApi("/clients/order"),
          fetchApi("/products/order"),
          fetchApi("/quotation-notes-categories"),
          fetchApi("/currencies"), // ✨ TAMBAH
        ]);

        const clientData = resClients.ok ? await resClients.json() : [];
        const productData = resProducts.ok ? await resProducts.json() : [];
        const notesData = resNotes.ok ? await resNotes.json() : [];
        const currData = resCurr.ok ? await resCurr.json() : []; // ✨ TAMBAH

        setClients(
          Array.isArray(clientData) ? clientData : clientData.data || [],
        );
        setProducts(
          Array.isArray(productData) ? productData : productData.data || [],
        );
        setNoteCategories(Array.isArray(notesData) ? notesData : []);
        setCurrencies(currData.data || currData || []); // ✨ TAMBAH

        if (!resClients.ok || !resProducts.ok || !resNotes.ok || !resCurr.ok) {
          console.warn("Beberapa data Master gagal dimuat sepenuhnya.");
        }
      } catch (error) {
        console.error("❌ Error loading Master data:", error);
        toast.error("Gagal memuat data Master");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [status, fetchApi]);

  const defaultValues = useMemo(() => {
    if (!initialData)
      return {
        date: new Date(),
        status: "DRAFT" as const,
        isManualClient: false,
        picId: "",
        currencyCode: "IDR",
        paymentTerms: "",
        items: [
          {
            isManualProduct: false,
            productName: "",
            quantity: 0,
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
          },
        ],
      };
    return {
      ...initialData,
      date: initialData.date ? new Date(initialData.date) : new Date(),
      validUntil: initialData.validUntil
        ? new Date(initialData.validUntil)
        : undefined,
      picId: initialData.picId || "",
      currencyCode: initialData.currencyCode || "IDR", // ✨ TAMBAH
      paymentTerms: initialData.paymentTerms || "", // ✨ TAMBAH
    };
  }, [initialData]);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<QuotationFormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      form.reset(defaultValues);
      if (initialData.clientId && clients.length > 0) {
        const client = clients.find((c) => c.id === initialData.clientId);
        if (client) setSelectedClient(client);
      }
    }
  }, [initialData, defaultValues, form, clients]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = useWatch({ control: form.control, name: "items" });
  const isManualClient = useWatch({
    control: form.control,
    name: "isManualClient",
  });
  const currencyCode = useWatch({
    control: form.control,
    name: "currencyCode",
  });

  const { subTotal, totalDiscount, grandTotal } = useMemo(() => {
    let sub = 0,
      disc = 0;
    (items || []).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      sub += qty * price;
      disc += Number(item.discount) || 0;
    });
    return { subTotal: sub, totalDiscount: disc, grandTotal: sub - disc };
  }, [items]);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      form.setValue("picId", "");
    }
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
    onSubmit({ ...data, notes: getEditNotesStore() });
  };

  const notesSectionKey = initialData?.id ?? "new";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* QUOTATION DETAILS & CLIENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUOTATION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span
                              className={cn(
                                "font-medium",
                                status === "DRAFT" && "text-slate-500",
                                status === "SENT" && "text-blue-600",
                                status === "ACCEPTED" && "text-green-600",
                                status === "REJECTED" && "text-red-600",
                              )}>
                              {status.replace("_", " ")}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
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
                            variant="outline"
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
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date (Optional)</span>
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

              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-slate-500" /> Mata Uang
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={loadingData}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue
                            placeholder={
                              loadingData
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

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" /> Client
                Information
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
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          setSelectedClient(null);
                          form.setValue("clientId", "");
                          form.setValue("picId", "");
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isManualClient ? (
                  <div className="col-span-2 space-y-4">
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
                            value={field.value ?? ""}
                            disabled={loadingData}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
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

                    {selectedClient && (
                      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Client Detail
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
                ) : (
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
                            <Textarea
                              placeholder="Full address..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ITEMS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4" /> Items & Products
            </CardTitle>

            <div className="hidden md:flex items-center gap-4 text-[11px] text-muted-foreground mr-auto ml-4">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">
                  Min/Max Qty
                </span>{" "}
                = Rentang
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Label</span> =
                Satuan
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Rp</span> = Harga
                Satuan
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  isManualProduct: true,
                  productName: "",
                  quantity: 0,
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
              <Plus className="h-4 w-4 mr-2" /> Add Item
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

        {/* NOTES & SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NotesSection
            key={notesSectionKey}
            noteCategories={noteCategories}
            initialNotes={initialNotes}
          />

          <Card className="bg-slate-50 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Estimasi Biaya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimasi Subtotal</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: currencyCode || "IDR",
                  }).format(subTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Total Discount</span>
                <span>
                  -
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: currencyCode || "IDR",
                  }).format(totalDiscount)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Estimasi Total</span>
                <span className="text-blue-600">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: currencyCode || "IDR",
                  }).format(grandTotal)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
                *Total di atas adalah estimasi menggunakan Qty dan Harga dari
                form utama.
              </p>
              <Button
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Update Quotation"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
