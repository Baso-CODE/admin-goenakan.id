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
import { ArrowRight, Info, PlusCircle, Trash2, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Product, VendorPriceRecord } from "../page";
import { Switch } from "@/components/ui/switch";
import FastCurrencyForm from "@/app/(dashboard)/admin-invoice/currency/components/formCurrencyFast";
import { getFixedSimulationSteps } from "@/helper/cogsSimulationHelper";

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
  discount: number;
  freightMode?: "SEA" | "AIR";
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
  roundUpTo = 1000,
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
  roundUpTo?: number;
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

  const sellPriceSea = roundUpTo > 1 ? Math.ceil(rawSellSea / roundUpTo) * roundUpTo : Math.round(rawSellSea);
  const sellPriceAir = roundUpTo > 1 ? Math.ceil(rawSellAir / roundUpTo) * roundUpTo : Math.round(rawSellAir);

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
  const [availableFreightModes, setAvailableFreightModes] = useState<"SEA" | "AIR" | "BOTH">("SEA");
  const [showFreightSelector, setShowFreightSelector] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"SEA" | "AIR">("SEA");

  const [basePriceSea, setBasePriceSea] = useState<number>(0);
  const [tiersSea, setTiersSea] = useState<EditableTier[]>([]);

  const [basePriceAir, setBasePriceAir] = useState<number>(0);
  const [tiersAir, setTiersAir] = useState<EditableTier[]>([]);

  const [currencyCode, setCurrencyCode] = useState<string>("IDR");
  const [foreignPrice, setForeignPrice] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [additionalFee, setAdditionalFee] = useState<number>(0);
  const [foreignPriceAdjuster, setForeignPriceAdjuster] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const basePrice = activeTab === "SEA" ? basePriceSea : basePriceAir;
  const setBasePrice = (val: number) => {
    if (activeTab === "SEA") setBasePriceSea(val);
    else setBasePriceAir(val);
  };

  const tiers = activeTab === "SEA" ? tiersSea : tiersAir;
  const setTiers = (
    action: EditableTier[] | ((prev: EditableTier[]) => EditableTier[]),
  ) => {
    if (activeTab === "SEA") {
      setTiersSea((prev) =>
        typeof action === "function" ? action(prev) : action,
      );
    } else {
      setTiersAir((prev) =>
        typeof action === "function" ? action(prev) : action,
      );
    }
  };

  // Master Currencies & Fast Currency Dialog
  const [masterCurrencies, setMasterCurrencies] = useState<any[]>([]);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState<boolean>(false);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [ratesData, setRatesData] = useState<any>({ RMB: 2250, CNY: 2250, USD: 16200 });

  // Fetch currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetchApi("/currencies");
        if (res.ok) {
          const data = await res.json();
          const currList = Array.isArray(data) ? data : (data.data || []);
          setMasterCurrencies(currList);
        }
      } catch (err) {
        console.error("Failed to fetch currencies", err);
      }
    };
    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen, fetchApi]);

  // Fetch exchange rate automatically via API
  const fetchExchangeRates = useCallback(async (base: string) => {
    if (base === "IDR") return;
    setFetchingRates(true);
    try {
      const apiBase = base === "RMB" ? "CNY" : base;
      const res = await fetch(`https://open.er-api.com/v6/latest/${apiBase}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const rateVal = data.rates.IDR;
          setRatesData((prev: any) => ({
            ...prev,
            [base]: rateVal || prev[base],
          }));
          setExchangeRate(rateVal);
          toast.success(`Kurs ${base} berhasil diperbarui: Rp ${rateVal.toLocaleString("id-ID")}`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengambil kurs terbaru.");
    } finally {
      setFetchingRates(false);
    }
  }, []);

  const handleAddCurrencyFast = async (data: any) => {
    try {
      const res = await fetchApi("/currencies", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat currency");
      }

      const responseData = await res.json();
      const newCurrency = responseData.data || responseData;

      setMasterCurrencies((prev) => [...prev, newCurrency]);
      setCurrencyCode(newCurrency.code);
      if (newCurrency.rate) {
        setExchangeRate(Number(newCurrency.rate));
      } else {
        setExchangeRate(1);
      }
      setIsCurrencyModalOpen(false);
      toast.success("Currency berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat currency.");
    }
  };
 
  // Initialize from product current active prices
  useEffect(() => {
    if (product) {
      const linkedQuote =
        product.vendorPrices?.find(
          (v) => v.id === product.activeVendorPriceRecordId,
        ) ||
        (product.vendorPrices && product.vendorPrices.length > 0
          ? product.vendorPrices[0]
          : null);
      const initialCurrency = linkedQuote
        ? linkedQuote.currencyCode || "IDR"
        : product.currencyCode || "IDR";

      setCurrencyCode(initialCurrency);
      setForeignPrice(
        Number(product.foreignPrice) ||
          (linkedQuote ? Number(linkedQuote.foreignPrice) : 0),
      );
      setExchangeRate(
        Number(product.exchangeRate) ||
          (linkedQuote ? Number(linkedQuote.exchangeRate) : 1),
      );
      setAdditionalFee(Number(product.additionalFee) || 0);
      setForeignPriceAdjuster(
        Number((product as any).foreignPriceAdjuster) || 0,
      );

      const initFreightMode =
        (product.availableFreightModes as "SEA" | "AIR" | "BOTH") || "SEA";
      setAvailableFreightModes(initFreightMode);
      setShowFreightSelector(Boolean(product.showFreightSelector));
      setActiveTab(initFreightMode === "AIR" ? "AIR" : "SEA");

      setSelectedQuoteId(
        product.activeVendorPriceRecordId ||
          (product.vendorPrices && product.vendorPrices.length > 0
            ? product.vendorPrices[0].id
            : "NONE"),
      );

      const pBaseSea = Number(product.basePrice) || 0;
      const pBaseAir = Number(product.basePriceAir) || 0;
      setBasePriceSea(pBaseSea);
      setBasePriceAir(pBaseAir);

      const seaTiersRaw = (product.priceTiers || []).filter(
        (t) => !t.freightMode || t.freightMode === "SEA",
      );
      const airTiersRaw = (product.priceTiers || []).filter(
        (t) => t.freightMode === "AIR",
      );

      if (seaTiersRaw.length > 0) {
        setTiersSea(
          seaTiersRaw.map((t) => {
            const priceVal = Number(t.price) || 0;
            const discountVal = Math.max(0, pBaseSea - priceVal);
            return {
              id: t.id,
              minQuantity: t.minQuantity,
              maxQuantity: t.maxQuantity,
              price: priceVal,
              discount: discountVal,
              freightMode: "SEA",
            };
          }),
        );
      } else {
        setTiersSea([]);
      }

      if (airTiersRaw.length > 0) {
        setTiersAir(
          airTiersRaw.map((t) => {
            const priceVal = Number(t.price) || 0;
            const discountVal = Math.max(0, pBaseAir - priceVal);
            return {
              id: t.id,
              minQuantity: t.minQuantity,
              maxQuantity: t.maxQuantity,
              price: priceVal,
              discount: discountVal,
              freightMode: "AIR",
            };
          }),
        );
      } else {
        setTiersAir([]);
      }
    }
  }, [product, fetchExchangeRates]);

  // Calculate tiers from quote reference for a specific freight mode (SEA or AIR)
  const calculateTiersFromQuote = (
    quote: any,
    mode: "SEA" | "AIR",
    rate: number,
  ): { basePrice: number; tiers: EditableTier[] } => {
    if (!quote) return { basePrice: 0, tiers: [] };

    const qtyPerCtn = Number(quote.qtyPerCtn) || 1;
    const moqCtn = Number(quote.moqCtn) || 1;
    const targetQtyPcs = Number(quote.targetQtyPcs) || 0;
    const roundUpToVal = Number((quote as any).roundUpTo) || 1000;

    if (quote.calculationMode === "FIXED") {
      const steps = getFixedSimulationSteps(moqCtn, qtyPerCtn, targetQtyPcs);
      const tempTiers = steps.map((step, idx) => {
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
          exchangeRate: rate,
          qtyPcs: step.calcQty,
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
          roundUpTo: roundUpToVal,
        });

        const finalPrice = mode === "SEA" ? calc.sellPriceSea : calc.sellPriceAir;
        return {
          id: `temp-${mode.toLowerCase()}-fixed-${idx}`,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          price: finalPrice,
          discount: 0,
          freightMode: mode,
        };
      });

      const computedBasePrice = tempTiers[0]?.price || 0;
      const generatedTiers = tempTiers.map((t) => {
        const discountVal = Math.max(0, computedBasePrice - t.price);
        return {
          ...t,
          discount: discountVal,
          price: Math.max(0, computedBasePrice - discountVal),
        };
      });

      return { basePrice: computedBasePrice, tiers: generatedTiers };
    } else {
      const quoteTiers = quote.tiers;
      if (quoteTiers && Array.isArray(quoteTiers) && quoteTiers.length > 0) {
        const sorted = [...quoteTiers].sort(
          (a: any, b: any) => (Number(a.totalPcs) || 0) - (Number(b.totalPcs) || 0),
        );
        const tempTiers = sorted.map((item: any, idx: number) => {
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
            exchangeRate: rate,
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
            roundUpTo: roundUpToVal,
          });

          const finalPrice = mode === "SEA" ? calc.sellPriceSea : calc.sellPriceAir;
          return {
            id: `temp-${mode.toLowerCase()}-var-${idx}`,
            minQuantity,
            maxQuantity,
            price: finalPrice,
            discount: 0,
            freightMode: mode,
          };
        });

        const computedBasePrice = tempTiers[0]?.price || 0;
        const generatedTiers = tempTiers.map((t) => {
          const discountVal = Math.max(0, computedBasePrice - t.price);
          return {
            ...t,
            discount: discountVal,
            price: Math.max(0, computedBasePrice - discountVal),
          };
        });

        return { basePrice: computedBasePrice, tiers: generatedTiers };
      }
      return { basePrice: 0, tiers: [] };
    }
  };

  // Handle quote reference selection
  const applyQuoteReference = (quoteId: string) => {
    if (quoteId === "NONE") return;
    setSelectedQuoteId(quoteId);

    const quote = product.vendorPrices?.find((v) => v.id === quoteId);
    if (quote) {
      setCurrencyCode(quote.currencyCode || "IDR");
      setForeignPrice(Number(quote.foreignPrice) || 0);
      const rate = Number(quote.exchangeRate) || 1;
      setExchangeRate(rate);

      // Only auto-fill if product has no existing base price or tiers
      if (basePriceSea === 0 && tiersSea.length === 0) {
        const seaResult = calculateTiersFromQuote(quote, "SEA", rate);
        setBasePriceSea(seaResult.basePrice);
        setTiersSea(seaResult.tiers);
      }
      if (basePriceAir === 0 && tiersAir.length === 0) {
        const airResult = calculateTiersFromQuote(quote, "AIR", rate);
        setBasePriceAir(airResult.basePrice);
        setTiersAir(airResult.tiers);
      }
    }
  };

  const handleSyncTiersFromQuote = (targetMode?: "SEA" | "AIR") => {
    const mode = targetMode || activeTab;
    if (selectedQuoteId === "NONE") return;
    const quote = product.vendorPrices?.find((v) => v.id === selectedQuoteId);
    if (!quote) return;

    const result = calculateTiersFromQuote(quote, mode, exchangeRate);
    if (mode === "SEA") {
      setBasePriceSea(result.basePrice);
      setTiersSea(result.tiers);
    } else {
      setBasePriceAir(result.basePrice);
      setTiersAir(result.tiers);
    }
    toast.success(`Tiers ${mode} berhasil disinkronkan dari quote supplier!`);
  };

  const handleSyncAllFromQuote = () => {
    if (selectedQuoteId === "NONE") return;
    const quote = product.vendorPrices?.find((v) => v.id === selectedQuoteId);
    if (!quote) return;

    const seaResult = calculateTiersFromQuote(quote, "SEA", exchangeRate);
    const airResult = calculateTiersFromQuote(quote, "AIR", exchangeRate);

    setBasePriceSea(seaResult.basePrice);
    setTiersSea(seaResult.tiers);
    setBasePriceAir(airResult.basePrice);
    setTiersAir(airResult.tiers);

    toast.success("Tiers SEA dan AIR berhasil disinkronkan dari quote supplier!");
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
        discount: 0,
        freightMode: activeTab,
      },
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTierField = (idx: number, field: keyof EditableTier, val: any) => {
    const updated = [...tiers];
    if (field === "discount") {
      const discountVal = Number(val) || 0;
      updated[idx] = {
        ...updated[idx],
        discount: discountVal,
        price: Math.max(0, basePrice - discountVal),
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        [field]: val,
      };
    }
    setTiers(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const validateTiers = (tiersList: EditableTier[], modeName: string) => {
        if (tiersList.length > 0) {
          const sorted = [...tiersList].sort((a, b) => a.minQuantity - b.minQuantity);
          for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            if (current.maxQuantity && current.minQuantity > current.maxQuantity) {
              throw new Error(
                `Range tier ${modeName} tidak valid: Min ${current.minQuantity} lebih besar dari Max ${current.maxQuantity}`,
              );
            }

            if (next && current.maxQuantity && next.minQuantity <= current.maxQuantity) {
              throw new Error(
                `Range tier ${modeName} bentrok: Tier ending at ${current.maxQuantity} overlap dengan starting at ${next.minQuantity}`,
              );
            }
          }
        }
      };

      if (availableFreightModes === "SEA" || availableFreightModes === "BOTH") {
        validateTiers(tiersSea, "SEA");
      }
      if (availableFreightModes === "AIR" || availableFreightModes === "BOTH") {
        validateTiers(tiersAir, "AIR");
      }

      // Assemble priceTiers to send
      const finalPriceTiers: any[] = [];
      if (availableFreightModes === "SEA" || availableFreightModes === "BOTH") {
        tiersSea.forEach((t) => {
          finalPriceTiers.push({
            minQuantity: Number(t.minQuantity) || 1,
            maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
            price: Number(t.price) || 0,
            freightMode: "SEA",
          });
        });
      }
      if (availableFreightModes === "AIR" || availableFreightModes === "BOTH") {
        tiersAir.forEach((t) => {
          finalPriceTiers.push({
            minQuantity: Number(t.minQuantity) || 1,
            maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
            price: Number(t.price) || 0,
            freightMode: "AIR",
          });
        });
      }

      const payload = {
        basePrice: Number(basePriceSea) || 0,
        basePriceAir:
          availableFreightModes === "AIR" || availableFreightModes === "BOTH"
            ? Number(basePriceAir) || 0
            : null,
        availableFreightModes: availableFreightModes,
        showFreightSelector: showFreightSelector,
        foreignPrice: currencyCode === "IDR" ? null : Number(foreignPrice) || 0,
        currencyCode: currencyCode,
        exchangeRate: currencyCode === "IDR" ? 1 : Number(exchangeRate) || 1,
        additionalFee: Number(additionalFee) || 0,
        foreignPriceAdjuster: Number(foreignPriceAdjuster) || 0,
        activeVendorPriceRecordId: selectedQuoteId === "NONE" ? null : selectedQuoteId,
        activePriceFreightMode: availableFreightModes === "AIR" ? "AIR" : "SEA",
        priceTiers: finalPriceTiers,
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
          {/* Freight Mode & Sourcing Configuration */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600" />
              1. Konfigurasi Metode Pengiriman & Referensi Quote
            </h4>

            <div>
              <Label className="text-xs font-semibold text-stone-600">
                Pilihan Jalur Pengiriman untuk Produk Ini
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <Button
                  type="button"
                  variant={availableFreightModes === "SEA" ? "default" : "outline"}
                  onClick={() => {
                    setAvailableFreightModes("SEA");
                    setActiveTab("SEA");
                  }}
                  className={`text-xs font-bold ${
                    availableFreightModes === "SEA"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                  }`}>
                  🚢 Hanya Laut (SEA)
                </Button>
                <Button
                  type="button"
                  variant={availableFreightModes === "AIR" ? "default" : "outline"}
                  onClick={() => {
                    setAvailableFreightModes("AIR");
                    setActiveTab("AIR");
                  }}
                  className={`text-xs font-bold ${
                    availableFreightModes === "AIR"
                      ? "bg-sky-600 hover:bg-sky-700 text-white"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                  }`}>
                  ✈️ Hanya Udara (AIR)
                </Button>
                <Button
                  type="button"
                  variant={availableFreightModes === "BOTH" ? "default" : "outline"}
                  onClick={() => {
                    setAvailableFreightModes("BOTH");
                  }}
                  className={`text-xs font-bold ${
                    availableFreightModes === "BOTH"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                  }`}>
                  🚢 Laut & ✈️ Udara (Keduanya)
                </Button>
              </div>
            </div>

            {/* Enabler Toggle Switch */}
            <div className="flex items-center justify-between p-3 border border-stone-200/90 rounded-md bg-white">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="showFreightSelector"
                  className="text-xs font-bold text-stone-800 cursor-pointer">
                  Tampilkan Pilihan Jalur Pengiriman ke Pembeli
                </Label>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Jika diaktifkan, tombol pilihan jalur pengiriman akan muncul di halaman produk storefront. Jika dinonaktifkan, pilihan disembunyikan.
                </p>
              </div>
              <Switch
                id="showFreightSelector"
                checked={showFreightSelector}
                onCheckedChange={setShowFreightSelector}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2 border-t border-stone-200/80">
              <div>
                <Label className="text-xs font-semibold text-stone-600">Pilih Quote Supplier</Label>
                <Select
                  value={selectedQuoteId}
                  onValueChange={(val) => applyQuoteReference(val)}>
                  <SelectTrigger className="w-full bg-white border-stone-200 mt-1.5 truncate">
                    <SelectValue placeholder="Pilih Quote" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[90vw] md:max-w-md">
                    {product.vendorPrices?.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="max-w-full">
                        <div className="truncate max-w-[280px] sm:max-w-sm md:max-w-md">
                          {v.vendor?.companyName || "Supplier"} ({v.currencyCode}{" "}
                          {Number(v.foreignPrice).toLocaleString("id-ID")} via {v.importType})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuoteId !== "NONE" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSyncTiersFromQuote(activeTab)}
                    className="flex-1 text-xs font-semibold border-stone-200 bg-white text-stone-700 hover:bg-stone-100">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Sinkronkan {activeTab}
                  </Button>
                  {availableFreightModes === "BOTH" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSyncAllFromQuote}
                      className="flex-1 text-xs font-semibold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Sinkronkan Keduanya
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Core Price Fields */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                2. Harga & Wholesale Tiers{" "}
                {availableFreightModes === "BOTH"
                  ? `(${activeTab})`
                  : `(${availableFreightModes})`}
              </h4>
            </div>

            {availableFreightModes === "BOTH" && (
              <div className="flex border-b border-stone-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("SEA")}
                  className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "SEA"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}>
                  🚢 Jalur Laut (SEA)
                  {tiersSea.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">
                      {tiersSea.length} tiers
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("AIR")}
                  className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "AIR"
                      ? "border-sky-600 text-sky-600 bg-sky-50/50"
                      : "border-transparent text-stone-500 hover:text-stone-700"
                  }`}>
                  ✈️ Jalur Udara (AIR)
                  {tiersAir.length > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.2 rounded-full">
                      {tiersAir.length} tiers
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice" className="text-xs font-semibold text-stone-600">
                    Harga Dasar Produk {availableFreightModes === "BOTH" ? `(${activeTab})` : ""} (Rp)
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={basePrice}
                    disabled
                    className="bg-stone-50 border-stone-200 mt-1.5 font-bold text-stone-500"
                  />
                </div>

                <div>
                  <Label htmlFor="foreignPriceAdjuster" className="text-xs font-semibold text-stone-600">
                    Adjuster Persentase Harga Luar Negeri (%)
                  </Label>
                  <Input
                    id="foreignPriceAdjuster"
                    type="number"
                    min="0"
                    max="100"
                    value={foreignPriceAdjuster}
                    onChange={(e) => setForeignPriceAdjuster(Number(e.target.value) || 0)}
                    className="bg-white border-stone-200 mt-1.5 font-bold text-stone-850"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Editable Wholesale Tiers Grid */}
            <div className="border border-stone-200 rounded-lg overflow-hidden bg-white mt-4">
              <div className="p-3 bg-stone-50 border-b flex justify-between items-center">
                <span className="text-xs font-bold text-stone-700">Tabel Harga Bertingkat (Wholesale Tiers)</span>
                <div className="flex items-center gap-2">
                  {selectedQuoteId !== "NONE" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTiersFromQuote(activeTab)}
                      className="text-xs font-semibold border-stone-200 text-stone-700 hover:bg-stone-50">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Sinkronkan {activeTab} dari Quote
                    </Button>
                  )}
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
              </div>

              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="w-28 text-xs font-bold text-stone-600">Min Qty</TableHead>
                    <TableHead className="w-6"></TableHead>
                    <TableHead className="w-36 text-xs font-bold text-stone-600">Max Qty</TableHead>
                    <TableHead className="w-40 text-xs font-bold text-stone-600">Diskon (Rp)</TableHead>
                    <TableHead className="text-xs font-bold text-stone-600">Harga Satuan Akhir (Rp)</TableHead>
                    <TableHead className="w-12 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-stone-400 text-xs">
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
                            value={tier.discount}
                            onChange={(e) => handleUpdateTierField(idx, "discount", parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-200 h-8 text-xs font-semibold text-stone-900"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={Math.max(0, basePrice - tier.discount)}
                            disabled
                            className="bg-stone-50 border-stone-200 h-8 text-xs font-bold text-stone-500"
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
