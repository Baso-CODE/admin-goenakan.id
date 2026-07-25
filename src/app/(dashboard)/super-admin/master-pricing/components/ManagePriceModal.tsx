"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { ArrowRight, Info, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Product, VendorPriceRecord } from "../page";

interface ManagePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess: () => void;
}

type EditableTier = {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
};

// Replicate COGS suggested pricing formula
function calculateCogsAndSellingPrice({
  importType,
  beaMasukPercent = 0,
  ppnPercent = 11,
  pphPercent = 2.5,
  formECost = 0,
  insurancePercent = 0,
  handlingCost = 0,
  otherCost = 0,
  foreignPrice,
  gzDeliveryCost,
  exchangeRate,
  qtyPcs,
  qtyPerCtn,
  length,
  width,
  height,
  weight,
  seaFreightRate,
  airFreightRate,
  localFreight,
  margin,
  sponsorPercent,
}: {
  importType: "BORONGAN" | "RESMI";
  beaMasukPercent?: number;
  ppnPercent?: number;
  pphPercent?: number;
  formECost?: number;
  insurancePercent?: number;
  handlingCost?: number;
  otherCost?: number;
  foreignPrice: number;
  gzDeliveryCost: number;
  exchangeRate: number;
  qtyPcs: number;
  qtyPerCtn: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  seaFreightRate: number;
  airFreightRate: number;
  localFreight: number;
  margin: number;
  sponsorPercent: number;
}) {
  const safeQtyPerCtn = Math.max(1, qtyPerCtn || 1);
  const safeQtyPcs = Math.max(1, qtyPcs || safeQtyPerCtn);
  const totalCtn = Math.max(1, Math.ceil(safeQtyPcs / safeQtyPerCtn));

  const cbmPerCtn = (length * width * height) / 1000000;
  const totalCbm = cbmPerCtn * totalCtn;
  const totalSeaCbmAlloc = Math.max(0.1, totalCbm);

  const totalAirWeightAlloc = Math.max(totalSeaCbmAlloc, (weight + 2) * totalCtn);

  const seaFreightCostPcs = importType === "RESMI"
    ? (seaFreightRate / safeQtyPcs)
    : ((totalSeaCbmAlloc * seaFreightRate) / safeQtyPcs);
  const airFreightCostPcs = (totalAirWeightAlloc * airFreightRate) / safeQtyPcs;

  const gzDeliveryCostPcs = gzDeliveryCost * exchangeRate;
  const baseCostPcs = foreignPrice * exchangeRate;

  let cogsSea = 0;
  let cogsAir = 0;

  if (importType === "RESMI") {
    const formECostPcs = (formECost * exchangeRate) / safeQtyPcs;
    const insuranceCostPcs = (insurancePercent / 100) * baseCostPcs;

    const cifSeaPcs = baseCostPcs + gzDeliveryCostPcs + formECostPcs + seaFreightCostPcs + insuranceCostPcs;
    const cifAirPcs = baseCostPcs + gzDeliveryCostPcs + formECostPcs + airFreightCostPcs + insuranceCostPcs;

    const bmSeaPcs = (beaMasukPercent / 100) * cifSeaPcs;
    const bmAirPcs = (beaMasukPercent / 100) * cifAirPcs;

    const ppnSeaPcs = (ppnPercent / 100) * (cifSeaPcs + bmSeaPcs);
    const ppnAirPcs = (ppnPercent / 100) * (cifAirPcs + bmAirPcs);

    const pphSeaPcs = (pphPercent / 100) * (cifSeaPcs + bmSeaPcs);
    const pphAirPcs = (pphPercent / 100) * (cifAirPcs + bmAirPcs);

    const taxSeaPcs = bmSeaPcs + ppnSeaPcs + pphSeaPcs;
    const taxAirPcs = bmAirPcs + ppnAirPcs + pphAirPcs;

    const handlingCostPcs = handlingCost / safeQtyPcs;
    const otherCostPcs = otherCost / safeQtyPcs;

    cogsSea = cifSeaPcs + taxSeaPcs + handlingCostPcs + otherCostPcs + localFreight;
    cogsAir = cifAirPcs + taxAirPcs + handlingCostPcs + otherCostPcs + localFreight;
  } else {
    cogsSea = baseCostPcs + gzDeliveryCostPcs + seaFreightCostPcs + localFreight;
    cogsAir = baseCostPcs + gzDeliveryCostPcs + airFreightCostPcs + localFreight;
  }

  const sponsorMultiplier = 1 + (sponsorPercent / 100);
  const rawSellSea = (cogsSea * sponsorMultiplier) + margin;
  const rawSellAir = (cogsAir * sponsorMultiplier) + margin;

  const sellPriceSea = Math.ceil(rawSellSea / 1000) * 1000;
  const sellPriceAir = Math.ceil(rawSellAir / 1000) * 1000;

  return { sellPriceSea, sellPriceAir };
}

export function ManagePriceModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ManagePriceModalProps) {
  const { fetchApi } = useApi();

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("NONE");
  const [freightMode, setFreightMode] = useState<"SEA" | "AIR" | "CUSTOM">("CUSTOM");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [tiers, setTiers] = useState<EditableTier[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize from product current active prices
  useEffect(() => {
    if (product) {
      setBasePrice(Number(product.basePrice) || 0);
      setSelectedQuoteId(product.activeVendorPriceRecordId || "NONE");
      setFreightMode((product.activePriceFreightMode as "SEA" | "AIR" | "CUSTOM") || "CUSTOM");

      if (product.priceTiers && product.priceTiers.length > 0) {
        setTiers(
          product.priceTiers.map((t) => ({
            id: t.id,
            minQuantity: t.minQuantity,
            maxQuantity: t.maxQuantity,
            price: Number(t.price) || 0,
          })),
        );
      } else {
        setTiers([]);
      }
    }
  }, [product]);

  // Handle quote reference loading and calculation pre-filling
  const applyQuoteReference = (quoteId: string, mode: "SEA" | "AIR" | "CUSTOM") => {
    if (mode === "CUSTOM" || quoteId === "NONE") {
      setFreightMode("CUSTOM");
      setSelectedQuoteId("NONE");
      return;
    }

    const quote = product.vendorPrices?.find((v) => v.id === quoteId);
    if (!quote) return;

    const qtyPerCtn = Number(quote.qtyPerCtn) || 1;
    const moqCtn = Number(quote.moqCtn) || 1;
    const qtyPcs = qtyPerCtn * moqCtn;

    if (quote.calculationMode === "FIXED") {
      // Calculate single suggested price
      const calc = calculateCogsAndSellingPrice({
        importType: quote.importType as "BORONGAN" | "RESMI",
        beaMasukPercent: Number(quote.beaMasukPercent) || 0,
        ppnPercent: Number(quote.ppnPercent) || 0,
        pphPercent: Number(quote.pphPercent) || 0,
        formECost: Number(quote.formECost) || 0,
        insurancePercent: Number(quote.insurancePercent) || 0,
        handlingCost: Number(quote.handlingCost) || 0,
        otherCost: Number(quote.otherCost) || 0,
        foreignPrice: Number(quote.foreignPrice) || 0,
        gzDeliveryCost: Number(quote.gzDeliveryCost) || 0,
        exchangeRate: Number(quote.exchangeRate) || 0,
        qtyPcs,
        qtyPerCtn,
        length: Number(quote.length) || 0,
        width: Number(quote.width) || 0,
        height: Number(quote.height) || 0,
        weight: Number(quote.weight) || 0,
        seaFreightRate: Number(quote.seaFreightRate) || 0,
        airFreightRate: Number(quote.airFreightRate) || 0,
        localFreight: Number(quote.localFreight) || 0,
        margin: Number(quote.margin) || 0,
        sponsorPercent: Number(quote.sponsorPercent) * 100 || 0,
      });

      const finalPrice = mode === "SEA" ? calc.sellPriceSea : calc.sellPriceAir;
      setBasePrice(finalPrice);
      setTiers([]);
    } else {
      // Handle VARIABLE Mode Tiers
      const quoteTiers = quote.tiers;
      if (quoteTiers && Array.isArray(quoteTiers) && quoteTiers.length > 0) {
        // Sort tiers by qty
        const sorted = [...quoteTiers].sort((a: any, b: any) => (Number(a.totalPcs) || 0) - (Number(b.totalPcs) || 0));

        const mappedTiers: EditableTier[] = sorted.map((item: any, idx: number) => {
          const minQuantity = Number(item.totalPcs) || 1;
          const nextItem = sorted[idx + 1];
          const maxQuantity = nextItem ? (Number(nextItem.totalPcs) || 0) - 1 : null;

          const calc = calculateCogsAndSellingPrice({
            importType: quote.importType as "BORONGAN" | "RESMI",
            beaMasukPercent: Number(quote.beaMasukPercent) || 0,
            ppnPercent: Number(quote.ppnPercent) || 0,
            pphPercent: Number(quote.pphPercent) || 0,
            formECost: Number(quote.formECost) || 0,
            insurancePercent: Number(quote.insurancePercent) || 0,
            handlingCost: Number(quote.handlingCost) || 0,
            otherCost: Number(quote.otherCost) || 0,
            foreignPrice: Number(item.pricePcs) || 0,
            gzDeliveryCost: Number(item.gzCost) || Number(quote.gzDeliveryCost) || 0,
            exchangeRate: Number(quote.exchangeRate) || 0,
            qtyPcs: minQuantity,
            qtyPerCtn,
            length: Number(quote.length) || 0,
            width: Number(quote.width) || 0,
            height: Number(quote.height) || 0,
            weight: Number(quote.weight) || 0,
            seaFreightRate: Number(quote.seaFreightRate) || 0,
            airFreightRate: Number(quote.airFreightRate) || 0,
            localFreight: Number(quote.localFreight) || 0,
            margin: Number(quote.margin) || 0,
            sponsorPercent: Number(quote.sponsorPercent) * 100 || 0,
          });

          const finalPrice = mode === "SEA" ? calc.sellPriceSea : calc.sellPriceAir;

          return {
            id: `temp-${idx}`,
            minQuantity,
            maxQuantity,
            price: finalPrice,
          };
        });

        // Set base price to the first tier's price
        if (mappedTiers.length > 0) {
          setBasePrice(mappedTiers[0].price);
        }
        setTiers(mappedTiers);
      } else {
        setTiers([]);
      }
    }

    setSelectedQuoteId(quoteId);
    setFreightMode(mode);
  };

  const handleAddTier = () => {
    // Generate new quantity minimum based on last tier's max or min
    let newMin = 1;
    if (tiers.length > 0) {
      const lastTier = tiers[tiers.length - 1];
      newMin = lastTier.maxQuantity ? lastTier.maxQuantity + 1 : lastTier.minQuantity + 10;
    }

    setTiers([
      ...tiers,
      {
        id: `custom-new-${Date.now()}`,
        minQuantity: newMin,
        maxQuantity: null,
        price: basePrice,
      },
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTierField = (idx: number, field: keyof EditableTier, val: any) => {
    const updated = [...tiers];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setTiers(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate quantity ranges
      if (tiers.length > 0) {
        const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
        for (let i = 0; i < sorted.length; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];

          if (current.maxQuantity && current.minQuantity > current.maxQuantity) {
            throw new Error(`Range tier tidak valid: Min ${current.minQuantity} lebih besar dari Max ${current.maxQuantity}`);
          }

          if (next && current.maxQuantity && next.minQuantity <= current.maxQuantity) {
            throw new Error(`Range tier bentrok: Tier ending at ${current.maxQuantity} overlap dengan starting at ${next.minQuantity}`);
          }
        }
      }

      const payload = {
        basePrice: Number(basePrice) || 0,
        activeVendorPriceRecordId: selectedQuoteId === "NONE" ? null : selectedQuoteId,
        activePriceFreightMode: freightMode,
        priceTiers: tiers.map((t) => ({
          minQuantity: Number(t.minQuantity) || 1,
          maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
          price: Number(t.price) || 0,
        })),
      };

      const res = await fetchApi(`/products/${product.id}/master-price`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update master price");
      }

      toast.success("Master pricing berhasil diperbarui");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui harga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 bg-white border border-stone-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-stone-900">
            Kelola Master Pricing
          </DialogTitle>
          <DialogDescription className="text-stone-500 font-medium">
            Produk: <span className="text-stone-800 font-semibold">{product.name}</span> ({product.sku})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sourcing Selection */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600" />
              1. Pilih Referensi Quote Supplier
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label className="text-xs font-semibold text-stone-600">Pilih Quote Supplier</Label>
                <Select
                  value={selectedQuoteId}
                  onValueChange={(val) => applyQuoteReference(val, "SEA")}>
                  <SelectTrigger className="bg-white border-stone-200 mt-1.5">
                    <SelectValue placeholder="Pilih Quote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Manual Override (Tanpa Link Quote)</SelectItem>
                    {product.vendorPrices?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.vendor?.companyName || "Supplier"} ({v.currencyCode} {Number(v.foreignPrice).toLocaleString("id-ID")} via {v.importType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuoteId !== "NONE" && (
                <div>
                  <Label className="text-xs font-semibold text-stone-600">Mode Pengiriman</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Button
                      type="button"
                      variant={freightMode === "SEA" ? "default" : "outline"}
                      onClick={() => applyQuoteReference(selectedQuoteId, "SEA")}
                      className={`flex-1 text-xs font-bold ${freightMode === "SEA" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-stone-200"}`}>
                      🚢 Sea Suggested
                    </Button>
                    <Button
                      type="button"
                      variant={freightMode === "AIR" ? "default" : "outline"}
                      onClick={() => applyQuoteReference(selectedQuoteId, "AIR")}
                      className={`flex-1 text-xs font-bold ${freightMode === "AIR" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-stone-200"}`}>
                      ✈️ Air Suggested
                    </Button>
                    <Button
                      type="button"
                      variant={freightMode === "CUSTOM" ? "default" : "outline"}
                      onClick={() => setFreightMode("CUSTOM")}
                      className={`flex-1 text-xs font-bold ${freightMode === "CUSTOM" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-stone-200"}`}>
                      ✏️ Custom Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Price Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              2. Harga & Wholesale Tiers
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice" className="text-xs font-semibold text-stone-600">
                  Harga Dasar Produk (Rp)
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  disabled={freightMode !== "CUSTOM"}
                  className="bg-white border-stone-200 mt-1.5 font-bold text-stone-900"
                />
              </div>
            </div>

            {/* Editable Wholesale Tiers Grid */}
            <div className="border border-stone-200 rounded-lg overflow-hidden bg-white mt-4">
              <div className="p-3 bg-stone-50 border-b flex justify-between items-center">
                <span className="text-xs font-bold text-stone-700">Tabel Harga Bertingkat (Wholesale Tiers)</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTier}
                  className="text-xs font-semibold border-dashed border-stone-300 text-indigo-600 hover:bg-indigo-50/50">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Tambah Tier
                </Button>
              </div>

              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="w-28 text-xs font-bold text-stone-600">Min Qty</TableHead>
                    <TableHead className="w-6"></TableHead>
                    <TableHead className="w-36 text-xs font-bold text-stone-600">Max Qty</TableHead>
                    <TableHead className="text-xs font-bold text-stone-600">Harga Satuan Akhir (Rp)</TableHead>
                    <TableHead className="w-12 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-stone-400 text-xs">
                        Belum ada tier harga bertingkat untuk produk ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tiers.map((tier, idx) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={tier.minQuantity}
                            onChange={(e) => handleUpdateTierField(idx, "minQuantity", parseInt(e.target.value) || 1)}
                            className="bg-white border-stone-200 h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-stone-400 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              min={1}
                              value={tier.maxQuantity ?? ""}
                              placeholder="∞"
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateTierField(idx, "maxQuantity", val === "" ? null : parseInt(val));
                              }}
                              className="bg-white border-stone-200 h-8 text-xs pr-14"
                            />
                            {!tier.maxQuantity && (
                              <span className="absolute right-2 top-2 text-[9px] font-bold text-stone-400 uppercase pointer-events-none">
                                Unlimited
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleUpdateTierField(idx, "price", parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-200 h-8 text-xs font-bold text-stone-900"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTier(idx)}
                            className="h-8 w-8 text-stone-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-stone-200 font-semibold text-stone-700">
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
