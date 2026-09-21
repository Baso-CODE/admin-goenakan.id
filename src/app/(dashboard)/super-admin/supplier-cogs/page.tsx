"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import {
  Calculator,
  History,
  Trash,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Edit2,
  Eye,
  Check,
  Tag,
  Copy,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FastCurrencyForm from "@/app/(dashboard)/admin-invoice/currency/components/formCurrencyFast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Volumetric conversions
  const cbmPerCtn = (length * width * height) / 1000000;
  const totalCbm = cbmPerCtn * totalCtn;
  const totalSeaCbmAlloc = Math.max(0.1, totalCbm);

  // Air weight allocation (comparison of Sea CBM vs weight + 2kg packaging overhead per carton)
  const totalAirWeightAlloc = Math.max(totalSeaCbmAlloc, (weight + 2) * totalCtn);

  // Freight costs per piece
  const seaFreightCostPcs = importType === "RESMI"
    ? (seaFreightRate / safeQtyPcs)
    : ((totalSeaCbmAlloc * seaFreightRate) / safeQtyPcs);
  const airFreightCostPcs = (totalAirWeightAlloc * airFreightRate) / safeQtyPcs;

  // Guangzhou delivery cost per piece
  const gzDeliveryCostPcs = gzDeliveryCost * exchangeRate;

  // Base cost per piece
  const baseCostPcs = foreignPrice * exchangeRate;

  let cogsSea = 0;
  let cogsAir = 0;

  if (importType === "RESMI") {
    // Form E allocation per piece
    const formECostPcs = (formECost * exchangeRate) / safeQtyPcs;

    // Insurance allocation per piece
    const insuranceCostPcs = (insurancePercent / 100) * baseCostPcs;

    // CIF per piece
    const cifSeaPcs = baseCostPcs + gzDeliveryCostPcs + formECostPcs + seaFreightCostPcs + insuranceCostPcs;
    const cifAirPcs = baseCostPcs + gzDeliveryCostPcs + formECostPcs + airFreightCostPcs + insuranceCostPcs;

    // Taxes
    const bmSeaPcs = (beaMasukPercent / 100) * cifSeaPcs;
    const bmAirPcs = (beaMasukPercent / 100) * cifAirPcs;

    const ppnSeaPcs = (ppnPercent / 100) * (cifSeaPcs + bmSeaPcs);
    const ppnAirPcs = (ppnPercent / 100) * (cifAirPcs + bmAirPcs);

    const pphSeaPcs = (pphPercent / 100) * (cifSeaPcs + bmSeaPcs);
    const pphAirPcs = (pphPercent / 100) * (cifAirPcs + bmAirPcs);

    const taxSeaPcs = bmSeaPcs + ppnSeaPcs + pphSeaPcs;
    const taxAirPcs = bmAirPcs + ppnAirPcs + pphAirPcs;

    // Handling & Other flat costs allocation
    const handlingCostPcs = handlingCost / safeQtyPcs;
    const otherCostPcs = otherCost / safeQtyPcs;

    cogsSea = cifSeaPcs + taxSeaPcs + handlingCostPcs + otherCostPcs + localFreight;
    cogsAir = cifAirPcs + taxAirPcs + handlingCostPcs + otherCostPcs + localFreight;
  } else {
    // BORONGAN math
    cogsSea = baseCostPcs + gzDeliveryCostPcs + seaFreightCostPcs + localFreight;
    cogsAir = baseCostPcs + gzDeliveryCostPcs + airFreightCostPcs + localFreight;
  }

  // Suggested Selling Prices
  const sponsorMultiplier = 1 + (sponsorPercent / 100);
  const rawSellSea = (cogsSea * sponsorMultiplier) + margin;
  const rawSellAir = (cogsAir * sponsorMultiplier) + margin;

  const sellPriceSea = roundUpTo > 1 ? Math.ceil(rawSellSea / roundUpTo) * roundUpTo : Math.round(rawSellSea);
  const sellPriceAir = roundUpTo > 1 ? Math.ceil(rawSellAir / roundUpTo) * roundUpTo : Math.round(rawSellAir);

  return {
    totalCtn,
    totalSeaCbmAlloc,
    totalAirWeightAlloc,
    seaFreightCostPcs,
    airFreightCostPcs,
    gzDeliveryCostPcs,
    baseCostPcs,
    cogsSea,
    cogsAir,
    sellPriceSea,
    sellPriceAir,
  };
}

export default function SupplierCogsCalculatorPage() {
  const { fetchApi } = useApi();

  // Navigation State: 'list' | 'form'
  const [view, setView] = useState<"list" | "form">("list");
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Masters
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [historyModeFilter, setHistoryModeFilter] = useState<"ALL" | "FIXED" | "VARIABLE">("ALL");
  const itemsPerPage = 10;
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Rates State
  const [fetchingRates, setFetchingRates] = useState(false);
  const [ratesData, setRatesData] = useState<any>({ RMB: 2250, USD: 16200 });

  // Inputs / Form States
  const [selectedProductId, setSelectedProductId] = useState<string>("sandbox");
  const [tempProductName, setTempProductName] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedServiceVendorId, setSelectedServiceVendorId] = useState<string>("");
  const [cogsStatus, setCogsStatus] = useState<"EXISTING" | "POTENTIAL">("POTENTIAL");
  const [potentialProductType, setPotentialProductType] = useState<"NEW" | "EXISTING">("NEW");
  const [productSelectOpen, setProductSelectOpen] = useState(false);
  const [vendorSelectOpen, setVendorSelectOpen] = useState(false);
  const [serviceVendorSelectOpen, setServiceVendorSelectOpen] = useState(false);
  const [platformSelectOpen, setPlatformSelectOpen] = useState(false);
  const [currencySelectOpen, setCurrencySelectOpen] = useState(false);
  const [roundUpSelectOpen, setRoundUpSelectOpen] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | "EXISTING" | "POTENTIAL">("ALL");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"ALL" | "BORONGAN" | "RESMI">("ALL");

  // Potential Supplier Sourcing & Contact Details
  const [supplierPlatform, setSupplierPlatform] = useState<string>("1688");
  const [supplierContactName, setSupplierContactName] = useState<string>("");
  const [supplierContactLink, setSupplierContactLink] = useState<string>("");

  // Potential Product Image Upload States & Handlers
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePublicId, setImagePublicId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const CLOUDINARY_CLOUD_NAME = "do9sfnf5k";
      const CLOUDINARY_UPLOAD_PRESET = "ml_default";
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload ke Cloudinary");

      const data = await res.json();
      setImageUrl(data.secure_url);
      setImagePublicId(data.public_id);
      toast.success("Foto produk berhasil diunggah!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah foto produk");
    } finally {
      setIsUploading(false);
    }
  };

  // Master Currencies & Fast Currency Dialog
  const [masterCurrencies, setMasterCurrencies] = useState<any[]>([]);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState<boolean>(false);

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
      setCurrency(newCurrency.code);
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

  // Master Platforms & Dialog Sourcing
  const [customPlatforms, setCustomPlatforms] = useState<any[]>([]);
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState<boolean>(false);
  const [newPlatformName, setNewPlatformName] = useState<string>("");
  const [isSubmittingPlatform, setIsSubmittingPlatform] = useState<boolean>(false);

  const handleAddPlatformFast = async () => {
    if (!newPlatformName.trim()) {
      toast.error("Nama platform tidak boleh kosong");
      return;
    }
    setIsSubmittingPlatform(true);
    try {
      const res = await fetchApi("/contact-platforms", {
        method: "POST",
        body: JSON.stringify({
          name: newPlatformName.trim(),
          icon: "Globe",
          isActive: true
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gagal membuat platform");
      }

      const responseData = await res.json();
      const newPlatform = responseData.data || responseData;

      setCustomPlatforms((prev) => [...prev, newPlatform]);
      setSupplierPlatform(newPlatform.name);
      setIsPlatformModalOpen(false);
      setNewPlatformName("");
      toast.success("Platform Sourcing berhasil ditambahkan!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat platform.");
    } finally {
      setIsSubmittingPlatform(false);
    }
  };

  // Import Mode: BORONGAN vs RESMI
  const [importType, setImportType] = useState<"BORONGAN" | "RESMI">("BORONGAN");
  const [hsCode, setHsCode] = useState<string>("");
  const [beaMasukPercent, setBeaMasukPercent] = useState<number>(0);
  const [ppnPercent, setPpnPercent] = useState<number>(11);
  const [pphPercent, setPphPercent] = useState<number>(2.5);
  const [formECost, setFormECost] = useState<number>(0);
  const [insurancePercent, setInsurancePercent] = useState<number>(0);
  const [handlingCost, setHandlingCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);

  // Mode Calculation: FIXED vs VARIABLE
  const [calculationMode, setCalculationMode] = useState<"FIXED" | "VARIABLE">("FIXED");
  const [variableTiers, setVariableTiers] = useState<Array<{ id: string; totalPcs: number; pricePcs: number; gzCost: number }>>([
    { id: "1", totalPcs: 12, pricePcs: 85, gzCost: 0 },
    { id: "2", totalPcs: 18, pricePcs: 83, gzCost: 0 },
  ]);

  const handleAddTier = () => {
    const lastTier = variableTiers[variableTiers.length - 1];
    const newQty = lastTier ? lastTier.totalPcs + 10 : 20;
    const newPrice = lastTier ? lastTier.pricePcs : 10;
    setVariableTiers([
      ...variableTiers,
      { id: Date.now().toString(), totalPcs: newQty, pricePcs: newPrice, gzCost: 0 }
    ]);
  };

  const handleRemoveTier = (id: string) => {
    if (variableTiers.length <= 1) {
      toast.error("Minimal harus ada 1 tier kuantitas");
      return;
    }
    setVariableTiers(variableTiers.filter((t) => t.id !== id));
  };

  const handleUpdateTier = (id: string, field: "totalPcs" | "pricePcs" | "gzCost", value: number) => {
    setVariableTiers(
      variableTiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // --- CONVERT CURRENT FORM DATA BETWEEN FIXED & VARIABLE MODE ---
  const handleToggleOrConvertMode = (targetMode: "FIXED" | "VARIABLE") => {
    if (targetMode === calculationMode) return;

    if (targetMode === "VARIABLE") {
      // Fixed -> Variable Conversion
      const baseMoq = Math.max(1, moqCtn || 1);
      const safeQtyPerCtn = Math.max(1, qtyPerCtn || 1);
      
      const newTiers = [
        { id: "1", totalPcs: baseMoq * safeQtyPerCtn, pricePcs: foreignPrice, gzCost: gzDeliveryCost },
        { id: "2", totalPcs: (baseMoq + 1) * safeQtyPerCtn, pricePcs: foreignPrice, gzCost: gzDeliveryCost },
        { id: "3", totalPcs: (baseMoq + 2) * safeQtyPerCtn, pricePcs: foreignPrice, gzCost: gzDeliveryCost },
      ];
      setVariableTiers(newTiers);
      setCalculationMode("VARIABLE");
      toast.success("Dikonversi ke Variable Mode. Anda dapat menyesuaikan harga per tier kuantitas.");
    } else {
      // Variable -> Fixed Conversion
      const firstTier = variableTiers[0];
      if (firstTier) {
        setForeignPrice(firstTier.pricePcs || 0);
        setGzDeliveryCost(firstTier.gzCost || 0);
        const computedMoq = Math.max(1, Math.ceil((firstTier.totalPcs || 1) / (qtyPerCtn || 1)));
        setMoqCtn(computedMoq);
      }
      setCalculationMode("FIXED");
      toast.success("Dikonversi ke Fixed Mode!");
    }
  };

  // --- COPY RECORD TO OPPOSITE MODE (DUPLICATE AS NEW RECORD IN OTHER MODE) ---
  const handleCopyAndConvertMode = (rec: any) => {
    setSelectedProductId(rec.productId || "sandbox");
    setTempProductName(rec.tempProductName || "");
    setSelectedVendorId(rec.vendorId || "");
    setSelectedServiceVendorId(rec.serviceVendorId || "");
    setCogsStatus(rec.status || (rec.productId ? "EXISTING" : "POTENTIAL"));
    setPotentialProductType(rec.productId && rec.productId !== "sandbox" ? "EXISTING" : "NEW");
    setSupplierPlatform(rec.supplierPlatform || "1688");
    setSupplierContactName(rec.supplierContactName || "");
    setSupplierContactLink(rec.supplierContactLink || "");
    
    setForeignPrice(Number(rec.foreignPrice));
    setCurrency(rec.currencyCode);
    setExchangeRate(Number(rec.exchangeRate));
    setQtyPerCtn(rec.qtyPerCtn || 1);
    setLength(Number(rec.length) || 0);
    setWidth(Number(rec.width) || 0);
    setHeight(Number(rec.height) || 0);
    setWeight(Number(rec.weight) || 0);
    setGzDeliveryCost(Number(rec.gzDeliveryCost) || 0);
    setLocalFreight(Number(rec.localFreight) || 0);
    setSeaFreightRate(Number(rec.seaFreightRate) || 10000000);
    setAirFreightRate(Number(rec.airFreightRate) || 260000);
    setMoqCtn(Number(rec.moqCtn) || 10);
    setQtyPcs(rec.targetQtyPcs || (Number(rec.moqCtn) || 10) * (Number(rec.qtyPerCtn) || 1));
    setMargin(Number(rec.margin) || 0);
    setSponsorPercent(Number(rec.sponsorPercent) * 100);
    setRoundUpTo(Number(rec.roundUpTo) || 1000);
    setNotes(rec.notes ? `${rec.notes} (Salinan Mode)` : "Salinan Mode");
    setImageUrl(rec.imageUrl || "");
    setImagePublicId(rec.imagePublicId || "");

    setImportType((rec.importType as "BORONGAN" | "RESMI") || "BORONGAN");
    setHsCode(rec.hsCode || "");
    setBeaMasukPercent(Number(rec.beaMasukPercent) || 0);
    setPpnPercent(Number(rec.ppnPercent) ?? 11);
    setPphPercent(Number(rec.pphPercent) ?? 2.5);
    setFormECost(Number(rec.formECost) || 0);
    setInsurancePercent(Number(rec.insurancePercent) || 0);
    setHandlingCost(Number(rec.handlingCost) || 0);
    setOtherCost(Number(rec.otherCost) || 0);

    // Set editingRecord to null so saving creates a NEW entry
    setEditingRecord(null);

    const currentRecMode = rec.calculationMode || "FIXED";
    if (currentRecMode === "FIXED") {
      const baseMoq = Number(rec.moqCtn) || 1;
      const safeQtyPerCtn = Number(rec.qtyPerCtn) || 1;
      const fPrice = Number(rec.foreignPrice) || 0;
      const gzCost = Number(rec.gzDeliveryCost) || 0;
      setVariableTiers([
        { id: "1", totalPcs: baseMoq * safeQtyPerCtn, pricePcs: fPrice, gzCost },
        { id: "2", totalPcs: (baseMoq + 1) * safeQtyPerCtn, pricePcs: fPrice, gzCost },
        { id: "3", totalPcs: (baseMoq + 2) * safeQtyPerCtn, pricePcs: fPrice, gzCost },
      ]);
      setCalculationMode("VARIABLE");
      toast.success("Catatan disalin dan dikonversi ke Variable Mode. Silakan simpan sebagai catatan baru!");
    } else {
      const firstTier = rec.tiers && rec.tiers[0];
      if (firstTier) {
        setForeignPrice(Number(firstTier.pricePcs) || Number(rec.foreignPrice));
        setGzDeliveryCost(Number(firstTier.gzCost) || Number(rec.gzDeliveryCost));
        const computedMoq = Math.max(1, Math.ceil((firstTier.totalPcs || 1) / (qtyPerCtn || 1)));
        setMoqCtn(computedMoq);
      }
      setCalculationMode("FIXED");
      toast.success("Catatan disalin dan dikonversi ke Fixed Mode. Silakan simpan sebagai catatan baru!");
    }

    setView("form");
  };

  const productVendors = vendors.filter((v) => !v.types || v.types.length === 0 || v.types.includes("PRODUCT"));
  const serviceVendors = vendors.filter((v) => !v.types || v.types.length === 0 || v.types.includes("SERVICE"));
  
  // Pricing
  const [foreignPrice, setForeignPrice] = useState<number>(8);
  const [currency, setCurrency] = useState<string>("RMB");
  const [exchangeRate, setExchangeRate] = useState<number>(2250);
  
  // Packaging Overrides
  const [qtyPerCtn, setQtyPerCtn] = useState<number>(100);
  const [length, setLength] = useState<number>(41);
  const [width, setWidth] = useState<number>(30);
  const [height, setHeight] = useState<number>(11);
  const [weight, setWeight] = useState<number>(10);

  // Logistics & Selling Guides
  const [gzDeliveryCost, setGzDeliveryCost] = useState<number>(1);
  const [localFreight, setLocalFreight] = useState<number>(7000);
  const [seaFreightRate, setSeaFreightRate] = useState<number>(10000000); // per CBM
  const [airFreightRate, setAirFreightRate] = useState<number>(260000); // per KG
  const [moqCtn, setMoqCtn] = useState<number>(10); // MOQ in Carton
  const [qtyPcs, setQtyPcs] = useState<number>(100);
  const [margin, setMargin] = useState<number>(10000);
  const [sponsorPercent, setSponsorPercent] = useState<number>(2); // 2%
  const [roundUpTo, setRoundUpTo] = useState<number>(1000);
  const [notes, setNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, vendRes, currRes, platRes] = await Promise.all([
          fetchApi("/products/order"),
          fetchApi("/vendors/order/add"),
          fetchApi("/currencies"),
          fetchApi("/contact-platforms/active"),
        ]);

        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }
        if (vendRes.ok) {
          const vends = await vendRes.json();
          setVendors(vends);
        }
        if (currRes && currRes.ok) {
          const currs = await currRes.json();
          const currList = Array.isArray(currs) ? currs : (currs.data || []);
          setMasterCurrencies(currList);
        }
        if (platRes && platRes.ok) {
          const plats = await platRes.json();
          const platList = Array.isArray(plats) ? plats : (plats.data || []);
          setCustomPlatforms(platList);
        }
      } catch (e) {
        console.error("Gagal memuat master data", e);
      }
    };
    loadData();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchApi("/supplier-cogs");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error("Gagal memuat history COGS", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch exchange rate automatically
  const fetchExchangeRates = async (base: string) => {
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
          if (currency === base) {
            setExchangeRate(rateVal);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingRates(false);
    }
  };

  // Sync dimensions and pricing when product selection changes
  useEffect(() => {
    if (selectedProductId !== "sandbox" && selectedProductId !== "") {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod) {
        // If editing a record and selecting the same product, do NOT overwrite custom loaded details
        const isEditingThisProduct = editingRecord && editingRecord.productId === selectedProductId;
        if (!isEditingThisProduct) {
          setQtyPerCtn(prod.qtyPerCtn || 1);
          setQtyPcs((moqCtn || 1) * (prod.qtyPerCtn || 1));
          setLength(prod.length || 0);
          setWidth(prod.width || 0);
          setHeight(prod.height || 0);
          setWeight(prod.weight || 0);
          setTempProductName("");
          
          // Auto-link catalog product base price to supplier pricing in IDR
          if (cogsStatus === "EXISTING" || (cogsStatus === "POTENTIAL" && potentialProductType === "EXISTING")) {
            setForeignPrice(Number(prod.basePrice) || 0);
            setCurrency("IDR");
            setExchangeRate(1);
 
            // Link price tiers if available
            if (prod.priceTiers && Array.isArray(prod.priceTiers) && prod.priceTiers.length > 0) {
              const mappedTiers = prod.priceTiers.map((pt: any) => ({
                id: pt.id || Math.random().toString(),
                totalPcs: pt.minQuantity || 1,
                pricePcs: Number(pt.price) || 0,
                gzCost: 0,
              }));
              setVariableTiers(mappedTiers);
            }
          }
        }
      }
    }
  }, [selectedProductId, products, cogsStatus, potentialProductType, editingRecord]);



  // --- MATHEMATICAL COGS FORMULAS ---
  const calcResults = calculateCogsAndSellingPrice({
    importType,
    beaMasukPercent,
    ppnPercent,
    pphPercent,
    formECost,
    insurancePercent,
    handlingCost,
    otherCost,
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
    roundUpTo,
  });

  const {
    totalCtn,
    totalSeaCbmAlloc,
    totalAirWeightAlloc,
    seaFreightCostPcs,
    airFreightCostPcs,
    gzDeliveryCostPcs,
    baseCostPcs,
    cogsSea,
    cogsAir,
    sellPriceSea,
    sellPriceAir,
  } = calcResults;

  const isCalculationStarted = calculationMode === "VARIABLE"
    ? variableTiers.some(t => Number(t.pricePcs) > 0)
    : Number(foreignPrice) > 0;

  const activeQtyPcs = Math.max(1, qtyPcs);
  const formECostPcsVal = (formECost * exchangeRate) / activeQtyPcs;
  const insuranceCostPcsVal = (insurancePercent / 100) * baseCostPcs;
  const cifSeaPcsVal = baseCostPcs + gzDeliveryCostPcs + formECostPcsVal + seaFreightCostPcs + insuranceCostPcsVal;
  const cifAirPcsVal = baseCostPcs + gzDeliveryCostPcs + formECostPcsVal + airFreightCostPcs + insuranceCostPcsVal;
  const bmSeaPcsVal = (beaMasukPercent / 100) * cifSeaPcsVal;
  const bmAirPcsVal = (beaMasukPercent / 100) * cifAirPcsVal;
  const ppnSeaPcsVal = (ppnPercent / 100) * (cifSeaPcsVal + bmSeaPcsVal);
  const ppnAirPcsVal = (ppnPercent / 100) * (cifAirPcsVal + bmAirPcsVal);
  const pphSeaPcsVal = (pphPercent / 100) * (cifSeaPcsVal + bmSeaPcsVal);
  const pphAirPcsVal = (pphPercent / 100) * (cifAirPcsVal + bmAirPcsVal);
  const handlingCostPcsVal = handlingCost / activeQtyPcs;
  const otherCostPcsVal = otherCost / activeQtyPcs;

  // --- SAVE OR UPDATE CALCULATION ---
  const handleSaveRecord = async () => {
    if (cogsStatus === "POTENTIAL") {
      if (potentialProductType === "NEW" && !tempProductName.trim()) {
        toast.error("Mohon masukkan nama produk sourcing");
        return;
      }
      if (potentialProductType === "EXISTING" && (selectedProductId === "sandbox" || !selectedProductId)) {
        toast.error("Mohon pilih produk dari katalog");
        return;
      }
    }

    if (cogsStatus === "EXISTING" && (selectedProductId === "sandbox" || !selectedProductId)) {
      toast.error("Mohon pilih produk dari katalog");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productId: cogsStatus === "EXISTING" 
          ? selectedProductId 
          : (potentialProductType === "EXISTING" && selectedProductId !== "sandbox" ? selectedProductId : undefined),
        tempProductName: cogsStatus === "POTENTIAL" && potentialProductType === "NEW" 
          ? tempProductName.trim() 
          : undefined,
        status: cogsStatus,
        imageUrl: cogsStatus === "POTENTIAL" ? (imageUrl || undefined) : undefined,
        imagePublicId: cogsStatus === "POTENTIAL" ? (imagePublicId || undefined) : undefined,
        calculationMode,
        tiers: calculationMode === "VARIABLE" ? variableTiers : undefined,
        vendorId: selectedVendorId && selectedVendorId !== "none" ? selectedVendorId : undefined,
        serviceVendorId: selectedServiceVendorId && selectedServiceVendorId !== "none" ? selectedServiceVendorId : undefined,
        supplierPlatform: supplierPlatform.trim() || undefined,
        supplierContactName: supplierContactName.trim() || undefined,
        supplierContactLink: supplierContactLink.trim() || undefined,
        foreignPrice,
        currencyCode: currency,
        exchangeRate,
        qtyPerCtn,
        length,
        width,
        height,
        weight,
        gzDeliveryCost,
        localFreight,
        seaFreightRate,
        airFreightRate,
        moqCtn,
        targetQtyPcs: qtyPcs,
        margin,
        sponsorPercent: sponsorPercent / 100,
        roundUpTo,
        notes: notes.trim() || undefined,
        importType,
        hsCode: importType === "RESMI" ? (hsCode.trim() || undefined) : undefined,
        beaMasukPercent: importType === "RESMI" ? beaMasukPercent : undefined,
        ppnPercent: importType === "RESMI" ? ppnPercent : undefined,
        pphPercent: importType === "RESMI" ? pphPercent : undefined,
        formECost: importType === "RESMI" ? formECost : undefined,
        insurancePercent: importType === "RESMI" ? insurancePercent : undefined,
        handlingCost: importType === "RESMI" ? handlingCost : undefined,
        otherCost: importType === "RESMI" ? otherCost : undefined,
      };

      const isEdit = !!editingRecord;
      const url = isEdit ? `/supplier-cogs/${editingRecord.id}` : "/supplier-cogs";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? "Catatan COGS berhasil diperbarui!" : "Catatan COGS berhasil disimpan!");
        resetForm();
        setView("list");
        loadHistory();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyimpan catatan.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedRecordIds([]);
    setEditingRecord(null);
    setSelectedProductId("sandbox");
    setTempProductName("");
    setSelectedVendorId("");
    setSelectedServiceVendorId("");
    setCogsStatus("POTENTIAL");
    setPotentialProductType("NEW");
    setSupplierPlatform("1688");
    setSupplierContactName("");
    setSupplierContactLink("");
    setCalculationMode("FIXED");
    setVariableTiers([
      { id: "1", totalPcs: 0, pricePcs: 0, gzCost: 0 },
    ]);
    setForeignPrice(0);
    setCurrency("RMB");
    setExchangeRate(ratesData.RMB || 2250);
    setQtyPerCtn(0);
    setLength(0);
    setWidth(0);
    setHeight(0);
    setWeight(0);
    setGzDeliveryCost(0);
    setLocalFreight(0);
    setSeaFreightRate(0);
    setAirFreightRate(0);
    setMoqCtn(0);
    setQtyPcs(0);
    setMargin(0);
    setSponsorPercent(0);
    setNotes("");
    setImageUrl("");
    setImagePublicId("");
    setImportType("BORONGAN");
    setHsCode("");
    setBeaMasukPercent(0);
    setPpnPercent(11);
    setPphPercent(2.5);
    setFormECost(0);
    setInsurancePercent(0);
    setHandlingCost(0);
    setOtherCost(0);
  };

  const handleAddNew = () => {
    resetForm();
    setView("form");
    fetchExchangeRates("RMB");
  };

  // --- LOAD HISTORICAL RECORD TO EDIT/DETAIL FORM ---
  const handleLoadDetails = (rec: any) => {
    setEditingRecord(rec);
    setSelectedProductId(rec.productId || "sandbox");
    setTempProductName(rec.tempProductName || "");
    setSelectedVendorId(rec.vendorId || "");
    setSelectedServiceVendorId(rec.serviceVendorId || "");
    setCogsStatus(rec.status || (rec.productId ? "EXISTING" : "POTENTIAL"));
    setPotentialProductType(rec.productId && rec.productId !== "sandbox" ? "EXISTING" : "NEW");
    
    setSupplierPlatform(rec.supplierPlatform || "1688");
    setSupplierContactName(rec.supplierContactName || "");
    setSupplierContactLink(rec.supplierContactLink || "");
    setCalculationMode(rec.calculationMode || "FIXED");
    if (rec.tiers && Array.isArray(rec.tiers) && rec.tiers.length > 0) {
      setVariableTiers(rec.tiers);
    }
    setForeignPrice(Number(rec.foreignPrice));
    setCurrency(rec.currencyCode);
    setExchangeRate(Number(rec.exchangeRate));
    setQtyPerCtn(rec.qtyPerCtn || 1);
    setLength(Number(rec.length) || 0);
    setWidth(Number(rec.width) || 0);
    setHeight(Number(rec.height) || 0);
    setWeight(Number(rec.weight) || 0);
    setGzDeliveryCost(Number(rec.gzDeliveryCost) || 0);
    setLocalFreight(Number(rec.localFreight) || 0);
    setSeaFreightRate(Number(rec.seaFreightRate) || 10000000);
    setAirFreightRate(Number(rec.airFreightRate) || 260000);
    setMoqCtn(Number(rec.moqCtn) || 10);
    setQtyPcs(rec.targetQtyPcs || (Number(rec.moqCtn) || 10) * (Number(rec.qtyPerCtn) || 1));
    setMargin(Number(rec.margin) || 0);
    setSponsorPercent(Number(rec.sponsorPercent) * 100);
    setRoundUpTo(Number(rec.roundUpTo) || 1000);
    setNotes(rec.notes || "");
    setImageUrl(rec.imageUrl || "");
    setImagePublicId(rec.imagePublicId || "");
    setImportType((rec.importType as "BORONGAN" | "RESMI") || "BORONGAN");
    setHsCode(rec.hsCode || "");
    setBeaMasukPercent(Number(rec.beaMasukPercent) || 0);
    setPpnPercent(Number(rec.ppnPercent) ?? 11);
    setPphPercent(Number(rec.pphPercent) ?? 2.5);
    setFormECost(Number(rec.formECost) || 0);
    setInsurancePercent(Number(rec.insurancePercent) || 0);
    setHandlingCost(Number(rec.handlingCost) || 0);
    setOtherCost(Number(rec.otherCost) || 0);
    setView("form");
  };

  // --- DELETE HISTORICAL RECORD ---
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan harga ini?")) return;

    try {
      const res = await fetchApi(`/supplier-cogs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Catatan harga berhasil dihapus");
        loadHistory();
        setCurrentPage(1);
      } else {
        throw new Error("Gagal menghapus");
      }
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  };

  // --- LOCAL FILTER & PAGINATION LOGIC ---
  const filteredRecords = records.filter((rec) => {
    const productName = rec.product ? rec.product.name : (rec.tempProductName || "");
    const vendorName = rec.vendor ? rec.vendor.companyName : "";
    const serviceVendorName = rec.serviceVendor ? rec.serviceVendor.companyName : "";
    const notesContent = rec.notes || "";
    const searchString = `${productName} ${vendorName} ${serviceVendorName} ${notesContent}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());

    const recStatus = rec.status || (rec.productId ? "EXISTING" : "POTENTIAL");
    const matchesStatus = historyStatusFilter === "ALL" || recStatus === historyStatusFilter;

    const recMode = rec.calculationMode || "FIXED";
    const matchesMode = historyModeFilter === "ALL" || recMode === historyModeFilter;

    const recType = rec.importType || "BORONGAN";
    const matchesType = historyTypeFilter === "ALL" || recType === historyTypeFilter;

    return matchesSearch && matchesStatus && matchesMode && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const defaultPlatforms = ["1688", "Alibaba", "WeChat", "Taobao", "Made-In-China", "WhatsApp", "Lokal / Indonesia"];
  const uniquePlatformList = Array.from(
    new Set([
      ...defaultPlatforms,
      ...customPlatforms.map((p) => p.name || p),
      ...(supplierPlatform ? [supplierPlatform] : []),
    ])
  );

  return (
    <div className="space-y-6 w-full max-w-full pb-10">
      
      {/* HEADER SECTION */}
      <div className="border-b pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2 text-stone-800">
            <Calculator className="h-6 w-6 text-stone-700" />
            Supplier COGS & Pricing Calculator
          </h2>
          <p className="text-sm text-stone-500">
            Formulasikan harga penawaran (quotation) client berdasarkan hitungan Sea / Air freight secara akurat.
          </p>
        </div>
      </div>

      {/* VIEW SWITCHER */}
      {showComparison ? (
        /* === 3. COMPARISON VIEW === */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowComparison(false)}
              variant="outline"
              className="text-stone-700 border-stone-200 hover:bg-stone-100 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer h-9 bg-white"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Riwayat
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSelectedRecordIds([]);
                setShowComparison(false);
              }}
              className="text-xs font-bold uppercase tracking-wider h-9 cursor-pointer"
            >
              Bersihkan Pilihan
            </Button>
          </div>

          <Card className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-stone-50 border-b border-stone-200">
              <CardTitle className="text-md font-bold uppercase text-stone-700 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                Perbandingan Sourcing Supplier (Side-by-Side)
              </CardTitle>
              <CardDescription>Bandingkan parameter harga, ekspedisi, pajak, dan HPP dari berbagai supplier secara mendetail.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-max border-collapse">
                <TableHeader className="bg-stone-100">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase text-stone-700 w-[240px] sticky left-0 bg-stone-100 z-10 border-r border-stone-200">Parameter Perbandingan</TableHead>
                    {records.filter(r => selectedRecordIds.includes(r.id)).map((rec) => {
                      const displayProdName = rec.product ? rec.product.name : rec.tempProductName;
                      return (
                        <TableHead key={rec.id} className="font-bold text-xs uppercase text-stone-700 min-w-[280px] border-r border-stone-200 text-center">
                          <div className="space-y-1 py-2">
                            <p className="text-stone-900 font-bold truncate max-w-[260px]">{displayProdName}</p>
                            <p className="text-[10px] text-stone-500 font-semibold normal-case">
                              {rec.vendor?.companyName ? rec.vendor.companyName : (rec.supplierContactName || "Tanpa Supplier")}
                            </p>
                            <div className="flex justify-center gap-1">
                              <Badge className="bg-stone-200 text-stone-800 text-[8px] font-bold py-0.2">
                                {rec.importType}
                              </Badge>
                              <Badge className="bg-indigo-50 text-indigo-700 text-[8px] font-bold py-0.2">
                                {rec.calculationMode}
                              </Badge>
                            </div>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const selectedRecs = records.filter(r => selectedRecordIds.includes(r.id));
                    
                    // Precompute calculations for each selected record
                    const computedRecs = selectedRecs.map(rec => {
                      const safeQtyPerCtn = rec.qtyPerCtn || 1;
                      const safeMoqCtn = rec.moqCtn || 1;
                      const safeQtyPcs = rec.targetQtyPcs || (safeMoqCtn * safeQtyPerCtn);
                      const isVariable = rec.calculationMode === "VARIABLE";

                      // 1. Qty Target
                      const qtyTarget = isVariable 
                        ? (rec.tiers && Array.isArray(rec.tiers) && rec.tiers.length > 0
                            ? `${Math.min(...rec.tiers.map((t: any) => t.totalPcs))} - ${Math.max(...rec.tiers.map((t: any) => t.totalPcs))} pcs`
                            : "Variable")
                        : `${safeQtyPcs} pcs`;

                      // 2. Calculations
                      let hppSeaText = "";
                      let hppAirText = "";
                      let sellSeaText = "";
                      let sellAirText = "";
                      let rawCogsSea = 0;
                      let rawCogsAir = 0;

                      if (isVariable) {
                        if (rec.tiers && Array.isArray(rec.tiers) && rec.tiers.length > 0) {
                          const cogsList = rec.tiers.map((tier: any) => {
                            const tierQtyPcs = Number(tier.totalPcs) || 1;
                            const res = calculateCogsAndSellingPrice({
                              importType: rec.importType as "BORONGAN" | "RESMI",
                              beaMasukPercent: Number(rec.beaMasukPercent) || 0,
                              ppnPercent: Number(rec.ppnPercent) || 0,
                              pphPercent: Number(rec.pphPercent) || 0,
                              formECost: Number(rec.formECost) || 0,
                              insurancePercent: Number(rec.insurancePercent) || 0,
                              handlingCost: Number(rec.handlingCost) || 0,
                              otherCost: Number(rec.otherCost) || 0,
                              foreignPrice: Number(tier.pricePcs) || 0,
                              gzDeliveryCost: Number(tier.gzCost) || Number(rec.gzDeliveryCost) || 0,
                              exchangeRate: Number(rec.exchangeRate) || 0,
                              qtyPcs: tierQtyPcs,
                              qtyPerCtn: safeQtyPerCtn,
                              length: Number(rec.length) || 0,
                              width: Number(rec.width) || 0,
                              height: Number(rec.height) || 0,
                              weight: Number(rec.weight) || 0,
                              seaFreightRate: Number(rec.seaFreightRate) || 0,
                              airFreightRate: Number(rec.airFreightRate) || 0,
                              localFreight: Number(rec.localFreight) || 0,
                              margin: Number(rec.margin) || 0,
                              sponsorPercent: Number(rec.sponsorPercent) * 100 || 0,
                              roundUpTo: Number(rec.roundUpTo) || 1000,
                            });
                            return {
                              cogsSea: res.cogsSea,
                              cogsAir: res.cogsAir,
                              sellSea: res.sellPriceSea,
                              sellAir: res.sellPriceAir,
                            };
                          });

                          const minCogsSea = Math.min(...cogsList.map((c: any) => c.cogsSea));
                          const maxCogsSea = Math.max(...cogsList.map((c: any) => c.cogsSea));
                          const minCogsAir = Math.min(...cogsList.map((c: any) => c.cogsAir));
                          const maxCogsAir = Math.max(...cogsList.map((c: any) => c.cogsAir));

                          const minSellSea = Math.min(...cogsList.map((c: any) => c.sellSea));
                          const maxSellSea = Math.max(...cogsList.map((c: any) => c.sellSea));
                          const minSellAir = Math.min(...cogsList.map((c: any) => c.sellAir));
                          const maxSellAir = Math.max(...cogsList.map((c: any) => c.sellAir));

                          hppSeaText = minCogsSea === maxCogsSea
                            ? `Rp ${Math.round(minCogsSea).toLocaleString("id-ID")}`
                            : `Rp ${Math.round(minCogsSea).toLocaleString("id-ID")} - Rp ${Math.round(maxCogsSea).toLocaleString("id-ID")}`;

                          hppAirText = minCogsAir === maxCogsAir
                            ? `Rp ${Math.round(minCogsAir).toLocaleString("id-ID")}`
                            : `Rp ${Math.round(minCogsAir).toLocaleString("id-ID")} - Rp ${Math.round(maxCogsAir).toLocaleString("id-ID")}`;

                          sellSeaText = minSellSea === maxSellSea
                            ? `Rp ${minSellSea.toLocaleString("id-ID")}`
                            : `Rp ${minSellSea.toLocaleString("id-ID")} - Rp ${maxSellSea.toLocaleString("id-ID")}`;

                          sellAirText = minSellAir === maxSellAir
                            ? `Rp ${minSellAir.toLocaleString("id-ID")}`
                            : `Rp ${minSellAir.toLocaleString("id-ID")} - Rp ${maxSellAir.toLocaleString("id-ID")}`;

                          rawCogsSea = minCogsSea;
                          rawCogsAir = minCogsAir;
                        } else {
                          hppSeaText = "N/A";
                          hppAirText = "N/A";
                          sellSeaText = "N/A";
                          sellAirText = "N/A";
                        }
                      } else {
                        const res = calculateCogsAndSellingPrice({
                          importType: rec.importType as "BORONGAN" | "RESMI",
                          beaMasukPercent: Number(rec.beaMasukPercent) || 0,
                          ppnPercent: Number(rec.ppnPercent) || 0,
                          pphPercent: Number(rec.pphPercent) || 0,
                          formECost: Number(rec.formECost) || 0,
                          insurancePercent: Number(rec.insurancePercent) || 0,
                          handlingCost: Number(rec.handlingCost) || 0,
                          otherCost: Number(rec.otherCost) || 0,
                          foreignPrice: Number(rec.foreignPrice) || 0,
                          gzDeliveryCost: Number(rec.gzDeliveryCost) || 0,
                          exchangeRate: Number(rec.exchangeRate) || 0,
                          qtyPcs: safeQtyPcs,
                          qtyPerCtn: safeQtyPerCtn,
                          length: Number(rec.length) || 0,
                          width: Number(rec.width) || 0,
                          height: Number(rec.height) || 0,
                          weight: Number(rec.weight) || 0,
                          seaFreightRate: Number(rec.seaFreightRate) || 0,
                          airFreightRate: Number(rec.airFreightRate) || 0,
                          localFreight: Number(rec.localFreight) || 0,
                          margin: Number(rec.margin) || 0,
                          sponsorPercent: Number(rec.sponsorPercent) * 100 || 0,
                          roundUpTo: Number(rec.roundUpTo) || 1000,
                        });
                        hppSeaText = `Rp ${Math.round(res.cogsSea).toLocaleString("id-ID")}`;
                        hppAirText = `Rp ${Math.round(res.cogsAir).toLocaleString("id-ID")}`;
                        sellSeaText = `Rp ${res.sellPriceSea.toLocaleString("id-ID")}`;
                        sellAirText = `Rp ${res.sellPriceAir.toLocaleString("id-ID")}`;
                        rawCogsSea = res.cogsSea;
                        rawCogsAir = res.cogsAir;
                      }

                      return {
                        rec,
                        qtyTarget,
                        isVariable,
                        hppSeaText,
                        hppAirText,
                        sellSeaText,
                        sellAirText,
                        rawCogsSea,
                        rawCogsAir,
                      };
                    });

                    const validSeaRates = computedRecs.map(c => c.rawCogsSea).filter(v => v > 0);
                    const minSeaRate = validSeaRates.length > 0 ? Math.min(...validSeaRates) : 0;

                    const validAirRates = computedRecs.map(c => c.rawCogsAir).filter(v => v > 0);
                    const minAirRate = validAirRates.length > 0 ? Math.min(...validAirRates) : 0;

                    // List of parameters/rows to render
                    const renderRow = (label: string, getValue: (c: typeof computedRecs[0]) => React.ReactNode, bgClass = "") => (
                      <TableRow className={`${bgClass} hover:bg-stone-50/50`}>
                        <TableCell className="font-bold text-xs text-stone-700 sticky left-0 bg-white border-r border-stone-200 w-[240px] shadow-xs">
                          {label}
                        </TableCell>
                        {computedRecs.map((c) => (
                          <TableCell key={c.rec.id} className="text-xs text-center border-r border-stone-200 font-medium">
                            {getValue(c)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );

                    return (
                      <>
                        {/* Section Header */}
                        <TableRow className="bg-stone-50">
                          <TableCell colSpan={selectedRecs.length + 1} className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-widest px-4 py-2 border-y border-stone-200">
                            1. PRODUCT & SUPPLIER INFO
                          </TableCell>
                        </TableRow>
                        {renderRow("Produk", (c) => c.rec.product ? c.rec.product.name : c.rec.tempProductName)}
                        {renderRow("Supplier / Sourcing", (c) => c.rec.vendor?.companyName ? c.rec.vendor.companyName : (c.rec.supplierContactName || "-"))}
                        {renderRow("Sourcing Platform", (c) => c.rec.supplierPlatform || "-")}
                        {renderRow("Sourcing Link", (c) => c.rec.supplierContactLink ? (
                          c.rec.supplierContactLink.startsWith("http") ? (
                            <a href={c.rec.supplierContactLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">
                              Buka Link ↗
                            </a>
                          ) : c.rec.supplierContactLink
                        ) : "-")}
                        {renderRow("Logistik Ekspedisi", (c) => c.rec.serviceVendor ? c.rec.serviceVendor.companyName : "-")}

                        {/* Section Header */}
                        <TableRow className="bg-stone-50">
                          <TableCell colSpan={selectedRecs.length + 1} className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-widest px-4 py-2 border-y border-stone-200">
                            2. BASE COST DETAILS (EX WORK)
                          </TableCell>
                        </TableRow>
                        {renderRow("Ex Work (Foreign)", (c) => c.isVariable ? "Variable Tiers" : `${c.rec.currencyCode} ${Number(c.rec.foreignPrice).toLocaleString("id-ID")}`)}
                        {renderRow("Exchange Rate (Kurs)", (c) => `Rp ${Number(c.rec.exchangeRate).toLocaleString("id-ID")}`)}
                        {renderRow("Ex Work (IDR Equivalent)", (c) => c.isVariable ? "Variable" : `Rp ${Math.round(Number(c.rec.foreignPrice) * Number(c.rec.exchangeRate)).toLocaleString("id-ID")}`)}
                        {renderRow("Qty Target / MOQ", (c) => c.qtyTarget)}

                        {/* Section Header */}
                        <TableRow className="bg-stone-50">
                          <TableCell colSpan={selectedRecs.length + 1} className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-widest px-4 py-2 border-y border-stone-200">
                            3. LOGISTICS & FREIGHT RATES
                          </TableCell>
                        </TableRow>
                        {renderRow("Origin Delivery (Foreign)", (c) => `${c.rec.currencyCode} ${Number(c.rec.gzDeliveryCost).toLocaleString("id-ID")}`)}
                        {renderRow("Sea Freight Rate", (c) => c.rec.importType === "RESMI" ? `Rp ${Number(c.rec.seaFreightRate).toLocaleString("id-ID")} / Shipment` : `Rp ${Number(c.rec.seaFreightRate).toLocaleString("id-ID")} / CBM`)}
                        {renderRow("Air Freight Rate", (c) => `Rp ${Number(c.rec.airFreightRate).toLocaleString("id-ID")} / KG`)}
                        {renderRow("Local Delivery (IDR)", (c) => `Rp ${Number(c.rec.localFreight).toLocaleString("id-ID")}`)}

                        {/* Section Header */}
                        <TableRow className="bg-stone-50">
                          <TableCell colSpan={selectedRecs.length + 1} className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-widest px-4 py-2 border-y border-stone-200">
                            4. TAXES & FORM E (FOR RESMI TYPE)
                          </TableCell>
                        </TableRow>
                        {renderRow("Import Type", (c) => c.rec.importType)}
                        {renderRow("HS Code", (c) => c.rec.hsCode || "-")}
                        {renderRow("Bea Masuk", (c) => c.rec.importType === "RESMI" ? `${c.rec.beaMasukPercent}%` : "-")}
                        {renderRow("PPN / PPH", (c) => c.rec.importType === "RESMI" ? `PPN ${c.rec.ppnPercent}% / PPH ${c.rec.pphPercent}%` : "-")}
                        {renderRow("Form E / Insurance", (c) => c.rec.importType === "RESMI" ? `Form E: Rp ${Number(c.rec.formECost).toLocaleString("id-ID")} / Ins: ${c.rec.insurancePercent}%` : "-")}
                        {renderRow("Handling / Other Cost", (c) => c.rec.importType === "RESMI" ? `Hand: Rp ${Number(c.rec.handlingCost).toLocaleString("id-ID")} / Other: Rp ${Number(c.rec.otherCost).toLocaleString("id-ID")}` : "-")}

                        {/* Section Header */}
                        <TableRow className="bg-stone-50">
                          <TableCell colSpan={selectedRecs.length + 1} className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-widest px-4 py-2 border-y border-stone-200">
                            5. FINAL HPP & SELLING PRICE COMPARISON
                          </TableCell>
                        </TableRow>
                        {renderRow("HPP Sea (Laut) 🚢", (c) => {
                          const isCheapest = minSeaRate > 0 && c.rawCogsSea === minSeaRate;
                          return (
                            <div className="flex flex-col items-center justify-center py-1">
                              {isCheapest && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.2 mb-1 animate-pulse border-none">
                                  🏆 Cheapest
                                </Badge>
                              )}
                              <span className={isCheapest ? "text-emerald-700 font-extrabold text-sm" : "text-blue-900 font-bold"}>
                                {c.hppSeaText}
                              </span>
                            </div>
                          );
                        }, "bg-blue-50/10 border-r border-stone-200")}
                        {renderRow("HPP Air (Udara) ✈️", (c) => {
                          const isCheapest = minAirRate > 0 && c.rawCogsAir === minAirRate;
                          return (
                            <div className="flex flex-col items-center justify-center py-1">
                              {isCheapest && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.2 mb-1 animate-pulse border-none">
                                  🏆 Cheapest
                                </Badge>
                              )}
                              <span className={isCheapest ? "text-emerald-700 font-extrabold text-sm" : "text-amber-900 font-bold"}>
                                {c.hppAirText}
                              </span>
                            </div>
                          );
                        }, "bg-amber-50/10 border-r border-stone-200")}
                        {renderRow("Harga Jual Sea (Suggested) 🚢", (c) => c.sellSeaText, "bg-emerald-50/20 text-emerald-800 font-extrabold border-r border-stone-200")}
                        {renderRow("Harga Jual Air (Suggested) ✈️", (c) => c.sellAirText, "bg-orange-50/20 text-orange-800 font-extrabold border-r border-stone-200")}
                        {renderRow("Target Profit Margin (Rp)", (c) => `Rp ${Number(c.rec.margin).toLocaleString("id-ID")}`)}
                        {renderRow("Sponsor Percent Fee", (c) => `${(Number(c.rec.sponsorPercent) * 100).toFixed(0)}%`)}
                        {renderRow("Catatan / Notes", (c) => c.rec.notes || "-", "max-w-[300px]")}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : view === "list" ? (
        
        /* === 1. LIST VIEW === */
        <>
          <Card className="bg-white border border-stone-200 shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-md font-bold uppercase text-stone-700 flex items-center gap-2">
                  <History className="h-5 w-5 text-stone-600" />
                  Daftar Riwayat Harga & COGS Sourcing
                </CardTitle>
                <CardDescription>Kumpulan catatan harga supplier untuk acuan pembuatan quotation client.</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* SEARCH FILTER */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Cari produk atau supplier..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 bg-stone-50 border-stone-300 text-xs h-9"
                  />
                </div>

                {/* MODE FILTER PILLS */}
                <div className="flex gap-1 bg-stone-100 p-0.5 rounded text-[11px] font-semibold border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModeFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyModeFilter === "ALL" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Semua Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModeFilter("FIXED");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyModeFilter === "FIXED" ? "bg-stone-800 text-white shadow-2xs font-bold" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    📏 Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModeFilter("VARIABLE");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyModeFilter === "VARIABLE" ? "bg-indigo-600 text-white shadow-2xs font-bold" : "text-indigo-700 hover:text-indigo-900"
                    }`}
                  >
                    📊 Variable
                  </button>
                </div>

                {/* STATUS FILTER PILLS */}
                <div className="flex gap-1 bg-stone-100 p-0.5 rounded text-[11px] font-semibold border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryStatusFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyStatusFilter === "ALL" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryStatusFilter("EXISTING");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                      historyStatusFilter === "EXISTING" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-emerald-700 hover:text-emerald-900"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryStatusFilter("POTENTIAL");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                      historyStatusFilter === "POTENTIAL" ? "bg-sky-600 text-white shadow-2xs font-bold" : "text-sky-700 hover:text-sky-900"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300"></span>
                    Potential
                  </button>
                </div>

                {/* IMPORT TYPE FILTER PILLS */}
                <div className="flex gap-1 bg-stone-100 p-0.5 rounded text-[11px] font-semibold border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryTypeFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyTypeFilter === "ALL" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Semua Tipe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryTypeFilter("BORONGAN");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyTypeFilter === "BORONGAN" ? "bg-slate-700 text-white shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    📦 Borongan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryTypeFilter("RESMI");
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      historyTypeFilter === "RESMI" ? "bg-indigo-600 text-white shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    🏦 Resmi
                  </button>
                </div>

                {/* COMPARE BUTTON */}
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedRecordIds.length < 2) {
                      toast.warning("Silakan pilih minimal 2 catatan sourcing dari checkbox tabel untuk dibandingkan.");
                    } else {
                      setShowComparison(true);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 h-9 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Bandingkan {selectedRecordIds.length >= 2 ? `(${selectedRecordIds.length})` : ""}
                </Button>

                {/* ADD NEW BUTTON */}
                <Button
                  onClick={handleAddNew}
                  className="bg-primary hover:bg-accent text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 h-9 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Baru
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="rounded-md border border-stone-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead className="w-[40px] py-3">
                      <Checkbox
                        checked={
                          paginatedRecords.length > 0 &&
                          paginatedRecords.every((r) => selectedRecordIds.includes(r.id))
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newIds = [...selectedRecordIds];
                            paginatedRecords.forEach((r) => {
                              if (!newIds.includes(r.id)) newIds.push(r.id);
                            });
                            setSelectedRecordIds(newIds);
                          } else {
                            const newIds = selectedRecordIds.filter(
                              (id) => !paginatedRecords.some((r) => r.id === id)
                            );
                            setSelectedRecordIds(newIds);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Produk</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Qty Target</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Ex Work</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Kurs (IDR)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">HPP</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Est. Harga Jual</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Supplier</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Last Update</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Last Update By</TableHead>
                    <TableHead className="font-bold text-xs text-right uppercase text-stone-600">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-4 mx-auto rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-12 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-20 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-stone-400 py-8 text-sm">
                        {searchQuery || historyStatusFilter !== "ALL" || historyModeFilter !== "ALL" ? "Tidak ditemukan catatan harga yang cocok." : "Belum ada catatan harga supplier yang disimpan."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((rec) => {
                      const displayProdName = rec.product ? rec.product.name : rec.tempProductName;
                      
                      const formattedDate = new Date(rec.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) + " " + new Date(rec.updatedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      const isExisting = rec.status === "EXISTING" || (!rec.status && rec.productId);
                      const isVariable = rec.calculationMode === "VARIABLE";

                      const safeQtyPerCtn = rec.qtyPerCtn || 1;
                      const safeMoqCtn = rec.moqCtn || 1;
                      const safeQtyPcs = rec.targetQtyPcs || (safeMoqCtn * safeQtyPerCtn);

                      // 1. Qty Target
                      const qtyTarget = isVariable 
                        ? (rec.tiers && Array.isArray(rec.tiers) && rec.tiers.length > 0
                            ? `${Math.min(...rec.tiers.map((t: any) => t.totalPcs))} - ${Math.max(...rec.tiers.map((t: any) => t.totalPcs))} pcs`
                            : "Variable")
                        : `${safeQtyPcs} pcs`;

                      // 2. Calculations
                      let hppSeaText = "";
                      let hppAirText = "";
                      let sellSeaText = "";
                      let sellAirText = "";

                      if (isVariable) {
                        if (rec.tiers && Array.isArray(rec.tiers) && rec.tiers.length > 0) {
                          const cogsList = rec.tiers.map((tier: any) => {
                            const tierQtyPcs = Number(tier.totalPcs) || 1;
                            const res = calculateCogsAndSellingPrice({
                              importType: rec.importType as "BORONGAN" | "RESMI",
                              beaMasukPercent: Number(rec.beaMasukPercent) || 0,
                              ppnPercent: Number(rec.ppnPercent) || 0,
                              pphPercent: Number(rec.pphPercent) || 0,
                              formECost: Number(rec.formECost) || 0,
                              insurancePercent: Number(rec.insurancePercent) || 0,
                              handlingCost: Number(rec.handlingCost) || 0,
                              otherCost: Number(rec.otherCost) || 0,
                              foreignPrice: Number(tier.pricePcs) || 0,
                              gzDeliveryCost: Number(tier.gzCost) || Number(rec.gzDeliveryCost) || 0,
                              exchangeRate: Number(rec.exchangeRate) || 0,
                              qtyPcs: tierQtyPcs,
                              qtyPerCtn: safeQtyPerCtn,
                              length: Number(rec.length) || 0,
                              width: Number(rec.width) || 0,
                              height: Number(rec.height) || 0,
                              weight: Number(rec.weight) || 0,
                              seaFreightRate: Number(rec.seaFreightRate) || 0,
                              airFreightRate: Number(rec.airFreightRate) || 0,
                              localFreight: Number(rec.localFreight) || 0,
                              margin: Number(rec.margin) || 0,
                              sponsorPercent: Number(rec.sponsorPercent) * 100 || 0,
                              roundUpTo: Number(rec.roundUpTo) || 1000,
                            });
                            return {
                              cogsSea: res.cogsSea,
                              cogsAir: res.cogsAir,
                              sellSea: res.sellPriceSea,
                              sellAir: res.sellPriceAir,
                            };
                          });

                          const minCogsSea = Math.min(...cogsList.map((c: any) => c.cogsSea));
                          const maxCogsSea = Math.max(...cogsList.map((c: any) => c.cogsSea));
                          const minCogsAir = Math.min(...cogsList.map((c: any) => c.cogsAir));
                          const maxCogsAir = Math.max(...cogsList.map((c: any) => c.cogsAir));

                          const minSellSea = Math.min(...cogsList.map((c: any) => c.sellSea));
                          const maxSellSea = Math.max(...cogsList.map((c: any) => c.sellSea));
                          const minSellAir = Math.min(...cogsList.map((c: any) => c.sellAir));
                          const maxSellAir = Math.max(...cogsList.map((c: any) => c.sellAir));

                          hppSeaText = minCogsSea === maxCogsSea
                            ? `Rp ${Math.round(minCogsSea).toLocaleString("id-ID")}`
                            : `Rp ${Math.round(minCogsSea).toLocaleString("id-ID")} - Rp ${Math.round(maxCogsSea).toLocaleString("id-ID")}`;

                          hppAirText = minCogsAir === maxCogsAir
                            ? `Rp ${Math.round(minCogsAir).toLocaleString("id-ID")}`
                            : `Rp ${Math.round(minCogsAir).toLocaleString("id-ID")} - Rp ${Math.round(maxCogsAir).toLocaleString("id-ID")}`;

                          sellSeaText = minSellSea === maxSellSea
                            ? `Rp ${minSellSea.toLocaleString("id-ID")}`
                            : `Rp ${minSellSea.toLocaleString("id-ID")} - Rp ${maxSellSea.toLocaleString("id-ID")}`;

                          sellAirText = minSellAir === maxSellAir
                            ? `Rp ${minSellAir.toLocaleString("id-ID")}`
                            : `Rp ${minSellAir.toLocaleString("id-ID")} - Rp ${maxSellAir.toLocaleString("id-ID")}`;
                        } else {
                          hppSeaText = "N/A";
                          hppAirText = "N/A";
                          sellSeaText = "N/A";
                          sellAirText = "N/A";
                        }
                      } else {
                        const res = calculateCogsAndSellingPrice({
                          importType: rec.importType as "BORONGAN" | "RESMI",
                          beaMasukPercent: Number(rec.beaMasukPercent) || 0,
                          ppnPercent: Number(rec.ppnPercent) || 0,
                          pphPercent: Number(rec.pphPercent) || 0,
                          formECost: Number(rec.formECost) || 0,
                          insurancePercent: Number(rec.insurancePercent) || 0,
                          handlingCost: Number(rec.handlingCost) || 0,
                          otherCost: Number(rec.otherCost) || 0,
                          foreignPrice: Number(rec.foreignPrice) || 0,
                          gzDeliveryCost: Number(rec.gzDeliveryCost) || 0,
                          exchangeRate: Number(rec.exchangeRate) || 0,
                          qtyPcs: safeQtyPcs,
                          qtyPerCtn: safeQtyPerCtn,
                          length: Number(rec.length) || 0,
                          width: Number(rec.width) || 0,
                          height: Number(rec.height) || 0,
                          weight: Number(rec.weight) || 0,
                          seaFreightRate: Number(rec.seaFreightRate) || 0,
                          airFreightRate: Number(rec.airFreightRate) || 0,
                          localFreight: Number(rec.localFreight) || 0,
                          margin: Number(rec.margin) || 0,
                          sponsorPercent: Number(rec.sponsorPercent) * 100 || 0,
                          roundUpTo: Number(rec.roundUpTo) || 1000,
                        });
                        hppSeaText = `Rp ${Math.round(res.cogsSea).toLocaleString("id-ID")}`;
                        hppAirText = `Rp ${Math.round(res.cogsAir).toLocaleString("id-ID")}`;
                        sellSeaText = `Rp ${res.sellPriceSea.toLocaleString("id-ID")}`;
                        sellAirText = `Rp ${res.sellPriceAir.toLocaleString("id-ID")}`;
                      }

                      return (
                        <TableRow key={rec.id} className="hover:bg-stone-50 transition-colors">
                          <TableCell className="w-[40px] py-3">
                            <Checkbox
                              checked={selectedRecordIds.includes(rec.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecordIds([...selectedRecordIds, rec.id]);
                                } else {
                                  setSelectedRecordIds(selectedRecordIds.filter((id) => id !== rec.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-stone-850">
                            <div className="flex items-center gap-3">
                              {!isExisting && rec.imageUrl ? (
                                <div className="relative w-10 h-10 border rounded bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img
                                    src={rec.imageUrl}
                                    alt={displayProdName || "Produk Sourcing"}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : !isExisting ? (
                                <div className="w-10 h-10 border border-dashed rounded bg-stone-50 flex items-center justify-center text-stone-400 flex-shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              ) : null}
                              <div>
                                <span>{displayProdName}</span>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {isExisting ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      Existing
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      Potential
                                    </Badge>
                                  )}
                                  {isVariable ? (
                                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      📊 Variable
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-100 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      📏 Fixed
                                    </Badge>
                                  )}
                                  {rec.importType === "RESMI" ? (
                                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      🏦 Resmi
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      📦 Borongan
                                    </Badge>
                                  )}
                                  {!rec.productId && (
                                    <Badge className="bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-100 text-[9px] px-1.5 py-0.2">Draft</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-stone-700">
                            {qtyTarget}
                          </TableCell>
                          <TableCell className="font-semibold text-stone-700">
                            {isVariable ? (
                              <span className="text-stone-400">Variable</span>
                            ) : (
                              `${rec.currencyCode} ${Number(rec.foreignPrice).toLocaleString("id-ID")}`
                            )}
                          </TableCell>
                          <TableCell className="text-stone-500 font-semibold text-xs">
                            Rp {Number(rec.exchangeRate).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-1 text-blue-900 font-bold" title="HPP Sea / Laut">
                                <span className="text-[11px]">🚢</span> {hppSeaText}
                              </div>
                              <div className="flex items-center gap-1 text-amber-900 font-bold" title="HPP Air / Udara">
                                <span className="text-[11px]">✈️</span> {hppAirText}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-1 text-emerald-700 font-bold" title="Suggested Selling Price Sea / Laut">
                                <span className="text-[11px]">🚢</span> {sellSeaText}
                              </div>
                              <div className="flex items-center gap-1 text-orange-750 font-bold" title="Suggested Selling Price Air / Udara">
                                <span className="text-[11px]">✈️</span> {sellAirText}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-stone-600">
                            <div className="space-y-1">
                              {rec.vendor?.companyName ? (
                                <p className="font-medium text-stone-800">{rec.vendor.companyName}</p>
                              ) : rec.supplierContactName || rec.supplierPlatform ? (
                                <div className="space-y-0.5">
                                  {rec.supplierPlatform && (
                                    <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0 font-bold uppercase">
                                      🌐 {rec.supplierPlatform}
                                    </Badge>
                                  )}
                                  {rec.supplierContactName && (
                                    <p className="font-semibold text-stone-800 text-xs flex items-center gap-1">
                                      👤 {rec.supplierContactName}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-stone-400 text-xs">- Tanpa Supplier -</p>
                              )}

                              {rec.supplierContactLink && (
                                <div className="text-[11px]">
                                  {rec.supplierContactLink.startsWith("http://") || rec.supplierContactLink.startsWith("https://") ? (
                                    <a
                                      href={rec.supplierContactLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 text-[10px]"
                                    >
                                      🔗 Buka Link Supplier ↗
                                    </a>
                                  ) : (
                                    <span className="text-stone-500 font-mono text-[10px]">
                                      💬 {rec.supplierContactLink}
                                    </span>
                                  )}
                                </div>
                              )}

                              {rec.serviceVendor && (
                                <p className="text-[10px] text-stone-500 font-normal flex items-center gap-1 pt-0.5">
                                  <span>🚚 Logistik:</span> {rec.serviceVendor.companyName}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-stone-500 text-xs">
                            {formattedDate}
                          </TableCell>
                          <TableCell className="text-stone-500 text-xs">
                            Super Admin
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyAndConvertMode(rec)}
                                className="text-stone-700 border-stone-200 hover:bg-stone-100 text-[11px] h-8 font-semibold flex items-center gap-1"
                                title={`Salin data ini dan konversi ke ${isVariable ? "Fixed Mode" : "Variable Mode"}`}
                              >
                                <Copy className="h-3 w-3 text-indigo-600" />
                                Salin ke {isVariable ? "Fixed" : "Variable"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadDetails(rec)}
                                className="text-stone-700 border-stone-200 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 h-8"
                              >
                                <Eye className="h-3 w-3" />
                                Detail
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION FOOTER */}
            {/* Pagination moved to Card sibling level */}

          </CardContent>
        </Card>

        {/* === Pagination === */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
        </>
      ) : (

        /* === 2. FORM & SIMULATOR VIEW === */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setView("list")}
              className="text-stone-700 border-stone-300 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar
            </Button>
            
            <Badge className="bg-stone-200 text-stone-800 border hover:bg-stone-200 text-xs font-bold px-3 py-1">
              {editingRecord ? "Mode Detail & Edit" : "Mode Tambah Baru"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* INPUT PANEL (LEFT COLUMN) */}
            <Card className="xl:col-span-7 bg-white shadow-sm border border-stone-200">
              <CardHeader className="border-b pb-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <CardTitle className="text-md font-bold uppercase text-stone-700 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-stone-600" />
                      Konfigurasi Cost Sourcing
                    </CardTitle>
                    <CardDescription>Tentukan parameter harga beli supplier, berat, dimensi dan markup harga.</CardDescription>
                  </div>
                  
                  {/* MODE SWITCHER & CONVERT */}
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-md border border-stone-200 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleOrConvertMode("FIXED")}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === "FIXED"
                          ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                      title="Konversi / Alihkan ke Fixed Mode"
                    >
                      📏 Fixed Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleOrConvertMode("VARIABLE")}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === "VARIABLE"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                      title="Konversi / Alihkan ke Variable Mode"
                    >
                      📊 Variable Mode
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* 0. TIPE IMPOR SELECTOR */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-stone-500" /> Tipe Impor
                  </Label>
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setImportType("BORONGAN")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        importType === "BORONGAN"
                          ? "bg-white text-stone-900 shadow-xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      📦 Borongan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportType("RESMI");
                        setCalculationMode("FIXED");
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        importType === "RESMI"
                          ? "bg-white text-stone-900 shadow-xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      🏦 Resmi
                    </button>
                  </div>
                </div>

                {/* 1. STATUS / TAG SELECTION */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-stone-500" /> Status / Tag Produk COGS
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCogsStatus("EXISTING");
                          if (selectedProductId === "sandbox") {
                            setSelectedProductId("");
                          }
                        }}
                        className={`p-3 rounded-md border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          cogsStatus === "EXISTING"
                            ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-2xs"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Existing Product
                          </span>
                          {cogsStatus === "EXISTING" && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-stone-600 leading-tight">
                          Produk yang sudah pernah dibeli atau dijual dalam katalog.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCogsStatus("POTENTIAL");
                          setSelectedProductId("sandbox");
                        }}
                        className={`p-3 rounded-md border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          cogsStatus === "POTENTIAL"
                            ? "border-sky-600 bg-sky-50/70 ring-1 ring-sky-600 shadow-2xs"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                            Potential Product
                          </span>
                          {cogsStatus === "POTENTIAL" && <Check className="w-4 h-4 text-sky-600" />}
                        </div>
                        <p className="text-[10px] text-stone-600 leading-tight">
                          Potensi produk sourcing baru untuk dipakai/dibeli nanti.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 2. DYNAMIC INPUTS BASED ON STATUS */}
                  {cogsStatus === "EXISTING" ? (
                    <div className="space-y-2 pt-2 border-t border-stone-100 min-w-0">
                      <Label className="text-xs font-bold uppercase text-stone-600">Master Product Catalog</Label>
                      <Popover open={productSelectOpen} onOpenChange={setProductSelectOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 max-w-full overflow-hidden">
                            <span className="truncate text-left flex-1 min-w-0 pr-2">
                              {selectedProductId && selectedProductId !== "sandbox"
                                ? (() => {
                                    const p = products.find((prod) => prod.id === selectedProductId);
                                    return p ? `${p.name} (${p.sku})` : "Pilih Produk dari Katalog";
                                  })()
                                : "Pilih Produk dari Katalog"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                          <Command>
                            <CommandInput placeholder="Cari produk..." />
                            <CommandList>
                              <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {products.map((p) => {
                                  const label = `${p.name} (${p.sku})`;
                                  return (
                                    <CommandItem
                                      key={p.id}
                                      value={label}
                                      onSelect={() => {
                                        setSelectedProductId(p.id);
                                        setProductSelectOpen(false);
                                      }}>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="block truncate" title={label}>
                                        {label}
                                      </span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-stone-100">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPotentialProductType("NEW");
                            setSelectedProductId("sandbox");
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all duration-150 ${
                            potentialProductType === "NEW"
                              ? "bg-sky-600 text-white shadow-xs"
                              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                          }`}
                        >
                          Produk Baru (Ketik Nama)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPotentialProductType("EXISTING");
                            if (selectedProductId === "sandbox") {
                              setSelectedProductId("");
                            }
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all duration-150 ${
                            potentialProductType === "EXISTING"
                              ? "bg-sky-600 text-white shadow-xs"
                              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                          }`}
                        >
                          Pilih dari Katalog
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {potentialProductType === "NEW" ? (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-stone-600">Nama Produk Sourcing</Label>
                            <Input
                              placeholder="Contoh: Tumbler Ceramic Type-D"
                              value={tempProductName}
                              onChange={(e) => setTempProductName(e.target.value)}
                              className="bg-stone-50 border-stone-300"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2 min-w-0">
                            <Label className="text-xs font-bold uppercase text-stone-600">Master Product Catalog</Label>
                            <Popover open={productSelectOpen} onOpenChange={setProductSelectOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 max-w-full overflow-hidden">
                                  <span className="truncate text-left flex-1 min-w-0 pr-2">
                                    {selectedProductId && selectedProductId !== "sandbox"
                                      ? (() => {
                                          const p = products.find((prod) => prod.id === selectedProductId);
                                          return p ? `${p.name} (${p.sku})` : "Pilih Produk dari Katalog";
                                        })()
                                      : "Pilih Produk dari Katalog"}
                                  </span>
                                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                                <Command>
                                  <CommandInput placeholder="Cari produk..." />
                                  <CommandList>
                                    <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                      {products.map((p) => {
                                        const label = `${p.name} (${p.sku})`;
                                        return (
                                          <CommandItem
                                            key={p.id}
                                            value={label}
                                            onSelect={() => {
                                              setSelectedProductId(p.id);
                                              setProductSelectOpen(false);
                                            }}>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <span className="block truncate" title={label}>
                                              {label}
                                            </span>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-stone-600">Foto Produk Potential</Label>
                        {imageUrl ? (
                          <div className="relative w-full h-[90px] border border-stone-200 rounded-md overflow-hidden bg-stone-50 flex items-center justify-center group">
                            <img
                              src={imageUrl}
                              alt="Preview Produk"
                              className="object-contain w-full h-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageUrl("");
                                setImagePublicId("");
                              }}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full h-[90px] border border-dashed border-stone-300 rounded-md bg-stone-50 hover:bg-stone-100/80 transition-colors flex flex-col items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-1">
                                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                                <span className="text-[9px] text-stone-500">Mengunggah...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-stone-400">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-[9px] text-stone-500">Upload Foto Produk</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* 2. SELECT SUPPLIER & SERVICE VENDOR (SIDE BY SIDE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Vendor */}
                  <div className="space-y-2 min-w-0">
                    <Label className="text-xs font-bold uppercase text-stone-600">
                      Supplier / Vendor Product
                    </Label>
                    <Popover open={vendorSelectOpen} onOpenChange={setVendorSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 max-w-full overflow-hidden h-10">
                          <span className="truncate text-left flex-1 min-w-0 pr-2">
                            {selectedVendorId && selectedVendorId !== "none"
                              ? productVendors.find((v) => v.id === selectedVendorId)?.companyName || "Pilih Supplier Product"
                              : "Pilih Supplier Product"}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                        <Command>
                          <CommandInput placeholder="Cari supplier / vendor product..." />
                          <CommandList>
                            <CommandEmpty>Vendor tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="-- Tanpa Vendor Product -- none"
                                onSelect={() => {
                                  setSelectedVendorId("none");
                                  setVendorSelectOpen(false);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !selectedVendorId || selectedVendorId === "none" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-stone-500 italic">-- Tanpa Vendor Product --</span>
                              </CommandItem>
                              {productVendors.map((v) => {
                                const isSelected = selectedVendorId === v.id;
                                const searchVal = `${v.companyName} ${v.picName || ""}`;
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={searchVal}
                                    onSelect={() => {
                                      setSelectedVendorId(v.id);
                                      if (v.picName) {
                                        setSupplierContactName(v.picName);
                                      }
                                      if (v.contacts && v.contacts.length > 0) {
                                        const primary = v.contacts.find((c: any) => c.isPrimary) || v.contacts[0];
                                        if (primary) {
                                          if (primary.contactId) {
                                            setSupplierContactLink(primary.contactId);
                                          }
                                          if (primary.platform && primary.platform.name) {
                                            const platformName = primary.platform.name;
                                            const matchedPlat = ["1688", "Alibaba", "WeChat", "Taobao", "Made-In-China", "WhatsApp", "Lokal / Indonesia"].find(
                                              (plat) => plat.toLowerCase() === platformName.toLowerCase()
                                            );
                                            setSupplierPlatform(matchedPlat || platformName);
                                          }
                                        }
                                      }
                                      setVendorSelectOpen(false);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center justify-between w-full gap-2 min-w-0">
                                      <span className="truncate">{v.companyName}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase shrink-0">
                                        Product
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Service Vendor */}
                  <div className="space-y-2 min-w-0">
                    <Label className="text-xs font-bold uppercase text-stone-600">
                      Vendor Ekspedisi / Service (Opsional)
                    </Label>
                    <Popover open={serviceVendorSelectOpen} onOpenChange={setServiceVendorSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 max-w-full overflow-hidden h-10">
                          <span className="truncate text-left flex-1 min-w-0 pr-2">
                            {selectedServiceVendorId && selectedServiceVendorId !== "none"
                              ? serviceVendors.find((v) => v.id === selectedServiceVendorId)?.companyName || "Pilih Vendor Service (Opsional)"
                              : "Pilih Vendor Service (Opsional)"}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                        <Command>
                          <CommandInput placeholder="Cari vendor service..." />
                          <CommandList>
                            <CommandEmpty>Vendor tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="-- Tanpa Vendor Service -- none"
                                onSelect={() => {
                                  setSelectedServiceVendorId("none");
                                  setServiceVendorSelectOpen(false);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !selectedServiceVendorId || selectedServiceVendorId === "none" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-stone-500 italic">-- Tanpa Vendor Service --</span>
                              </CommandItem>
                              {serviceVendors.map((v) => {
                                const isSelected = selectedServiceVendorId === v.id;
                                const searchVal = `${v.companyName} ${v.picName || ""}`;
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={searchVal}
                                    onSelect={() => {
                                      setSelectedServiceVendorId(v.id);
                                      setServiceVendorSelectOpen(false);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center justify-between w-full gap-2 min-w-0">
                                      <span className="truncate">{v.companyName}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0">
                                        Service
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 2.5 POTENTIAL SUPPLIER SOURCING & CONTACT INFO */}
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-xs font-bold uppercase text-stone-700 flex items-center justify-between">
                    <span>🌐 Platform Sourcing & Kontak Supplier</span>
                    <span className="text-[10px] text-stone-400 font-normal">Memudahkan kontak supplier saat ingin order</span>
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Platform Sourcing</Label>

                      <Dialog
                        open={isPlatformModalOpen}
                        onOpenChange={setIsPlatformModalOpen}
                      >
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Tambah Platform Sourcing Baru</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label>Nama Platform</Label>
                              <Input
                                placeholder="Contoh: Shopee, DHgate, WeChat Agent"
                                value={newPlatformName}
                                onChange={(e) => setNewPlatformName(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                              <Button
                                onClick={handleAddPlatformFast}
                                disabled={isSubmittingPlatform}
                              >
                                {isSubmittingPlatform && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Tambah Platform
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Popover open={platformSelectOpen} onOpenChange={setPlatformSelectOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 h-10">
                            <span className="truncate text-left flex-1 min-w-0 pr-2">
                              {supplierPlatform || "Pilih Platform"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                          <Command>
                            <CommandInput placeholder="Cari platform..." />
                            <CommandList>
                              <CommandEmpty>Platform tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {uniquePlatformList.map((plat) => {
                                  const isSelected = supplierPlatform === plat;
                                  return (
                                    <CommandItem
                                      key={plat}
                                      value={plat}
                                      onSelect={() => {
                                        setSupplierPlatform(plat);
                                        setPlatformSelectOpen(false);
                                      }}>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 shrink-0",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span>{plat}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                              <div className="h-px bg-stone-100 my-1" />
                              <CommandGroup>
                                <CommandItem
                                  value="add_new_platform Buat Platform Baru"
                                  onSelect={() => {
                                    setPlatformSelectOpen(false);
                                    setIsPlatformModalOpen(true);
                                  }}
                                  className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer text-xs">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Buat Platform Baru...
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Nama / PIC Kontak Supplier</Label>
                      <Input
                        placeholder="Contoh: Sales Manager - Chen"
                        value={supplierContactName}
                        onChange={(e) => setSupplierContactName(e.target.value)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Link Produk / Kontak / WeChat ID</Label>
                      <Input
                        placeholder="Contoh: https://1688.com/... / WeChat ID / No HP"
                        value={supplierContactLink}
                        onChange={(e) => setSupplierContactLink(e.target.value)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SUPPLIER PRICING DETAILS */}
                <div className={`grid grid-cols-1 ${calculationMode === "VARIABLE" ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4 border-t pt-4`}>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-stone-500" /> Mata Uang
                    </Label>

                    <Dialog
                      open={isCurrencyModalOpen}
                      onOpenChange={setIsCurrencyModalOpen}
                    >
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Tambah Currency Baru</DialogTitle>
                        </DialogHeader>
                        <FastCurrencyForm onSubmit={handleAddCurrencyFast} />
                      </DialogContent>
                    </Dialog>

                    <Popover open={currencySelectOpen} onOpenChange={setCurrencySelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 h-10">
                          <span className="truncate text-left flex-1 min-w-0 pr-2">
                            {(() => {
                              const found = masterCurrencies.find((c) => c.code === currency);
                              return found ? `${found.code} (${found.symbol || "$"}) - ${found.name || found.code}` : currency || "Pilih Currency";
                            })()}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                        <Command>
                          <CommandInput placeholder="Cari currency / mata uang..." />
                          <CommandList>
                            <CommandEmpty>Mata uang tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {masterCurrencies.map((cur) => {
                                const isSelected = currency === cur.code;
                                const label = `${cur.code} (${cur.symbol || "$"}) - ${cur.name || cur.code}`;
                                return (
                                  <CommandItem
                                    key={cur.code}
                                    value={label}
                                    onSelect={() => {
                                      setCurrency(cur.code);
                                      if (cur.rate) {
                                        setExchangeRate(Number(cur.rate));
                                      } else {
                                        setExchangeRate(ratesData[cur.code] || (cur.code === "RMB" ? 2250 : cur.code === "USD" ? 16200 : 1));
                                      }
                                      setCurrencySelectOpen(false);
                                    }}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span>{label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                            <div className="h-px bg-stone-100 my-1" />
                            <CommandGroup>
                              <CommandItem
                                value="add_new_currency Buat Currency Baru"
                                onSelect={() => {
                                  setCurrencySelectOpen(false);
                                  setIsCurrencyModalOpen(true);
                                }}
                                className="text-blue-600 font-semibold focus:text-blue-800 focus:bg-blue-50 cursor-pointer text-xs">
                                <Plus className="w-4 h-4 mr-2" />
                                Buat Currency Baru...
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {calculationMode !== "VARIABLE" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">Harga Beli Supplier</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">{currency}</span>
                        <Input
                          type="number"
                          value={foreignPrice === 0 ? "" : foreignPrice}
                          onChange={(e) => setForeignPrice(parseFloat(e.target.value) || 0)}
                          className="pl-12 bg-stone-50 border-stone-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600 flex items-center justify-between">
                      <span>Kurs ke IDR</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => fetchExchangeRates(currency)}
                        disabled={fetchingRates || currency === "IDR"}
                      >
                        <RefreshCw className={`h-3 w-3 ${fetchingRates ? "animate-spin" : ""}`} />
                      </Button>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                      <Input
                        type="number"
                        value={exchangeRate === 0 ? "" : exchangeRate}
                        disabled={currency === "IDR"}
                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                        className="pl-9 bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. PACKAGING DETAILS */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider">Dimensi & Berat Kemasan Carton</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Qty / Carton</Label>
                      <Input
                        type="number"
                        value={qtyPerCtn === 0 ? "" : qtyPerCtn}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQtyPerCtn(val);
                          setQtyPcs((moqCtn || 1) * val);
                        }}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Panjang (cm)</Label>
                      <Input
                        type="number"
                        value={length === 0 ? "" : length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Lebar (cm)</Label>
                      <Input
                        type="number"
                        value={width === 0 ? "" : width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Tinggi (cm)</Label>
                      <Input
                        type="number"
                        value={height === 0 ? "" : height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label className="text-xs text-stone-500">Berat (kg)</Label>
                      <Input
                        type="number"
                        value={weight === 0 ? "" : weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* 4.5 VARIABLE QUANTITY TIER INPUT TABLE (VARIABLE MODE ONLY) */}
                {calculationMode === "VARIABLE" && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-bold uppercase text-stone-700 flex items-center gap-1.5">
                          📊 Tier Pricing Kuantitas (Variable Mode)
                        </Label>
                        <p className="text-[11px] text-stone-500">Tentukan harga beli per Pcs berdasarkan tier jumlah pesanan (Total Pcs).</p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddTier}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Tier
                      </Button>
                    </div>

                    <div className="rounded-md border border-stone-200 overflow-hidden bg-stone-50/50">
                      <Table>
                        <TableHeader className="bg-stone-100">
                          <TableRow>
                            <TableHead className="text-xs font-bold text-stone-700">Total Pcs</TableHead>
                            <TableHead className="text-xs font-bold text-stone-700">Total Ctn</TableHead>
                            <TableHead className="text-xs font-bold text-stone-700">Harga / Pcs ({currency})</TableHead>
                            <TableHead className="text-xs font-bold text-stone-700">Origin Cost ({currency})</TableHead>
                            <TableHead className="text-xs font-bold text-right text-stone-700">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const sortedTiers = [...variableTiers].sort((a, b) => Number(a.totalPcs) - Number(b.totalPcs));
                            return variableTiers.map((tier) => {
                              const idx = sortedTiers.findIndex((t) => t.id === tier.id);
                              const rangeLabel = sortedTiers.length > 1 && idx > -1 && idx < sortedTiers.length - 1 && sortedTiers[idx + 1].totalPcs > tier.totalPcs
                                ? `${tier.totalPcs} - ${sortedTiers[idx + 1].totalPcs - 1} pcs`
                                : `≥ ${tier.totalPcs} pcs`;

                              const computedCtn = (tier.totalPcs / (qtyPerCtn || 1)).toFixed(2);
                              return (
                                <TableRow key={tier.id}>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={tier.totalPcs === 0 ? "" : tier.totalPcs}
                                      onChange={(e) => handleUpdateTier(tier.id, "totalPcs", parseFloat(e.target.value) || 0)}
                                      className="bg-white h-8 text-xs font-semibold w-28"
                                    />
                                    <span className="block text-[10px] text-stone-400 font-semibold mt-1 pl-1">
                                      Range: {rangeLabel}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-xs font-bold text-stone-600">
                                    {computedCtn} Ctn
                                  </TableCell>
                                  <TableCell>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 font-bold">{currency}</span>
                                      <Input
                                        type="number"
                                        value={tier.pricePcs === 0 ? "" : tier.pricePcs}
                                        onChange={(e) => handleUpdateTier(tier.id, "pricePcs", parseFloat(e.target.value) || 0)}
                                        className="bg-white h-8 text-xs font-semibold pl-12 w-40"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 font-bold">{currency}</span>
                                      <Input
                                        type="number"
                                        value={tier.gzCost === 0 ? "" : tier.gzCost}
                                        onChange={(e) => handleUpdateTier(tier.id, "gzCost", parseFloat(e.target.value) || 0)}
                                        className="bg-white h-8 text-xs font-semibold pl-12 w-32"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveTier(tier.id)}
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* RESMI ONLY: IMPORT TAXES & HS CODE */}
                {importType === "RESMI" && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider">Import Taxes & HS Code (Pajak & HS Code Resmi)</h4>
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold flex items-center justify-between">
                            <span>Kode HS Code</span>
                            <a
                              href="https://insw.go.id/intr"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                            >
                              Cek di INSW 🌐
                            </a>
                          </Label>
                          <Input
                            placeholder="Contoh: 9503.00.90"
                            value={hsCode}
                            onChange={(e) => setHsCode(e.target.value)}
                            className="bg-white border-stone-300 font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">Biaya Form E (Supplier tektokan)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">{currency}</span>
                            <Input
                              type="number"
                              value={formECost === 0 ? "" : formECost}
                              onChange={(e) => setFormECost(parseFloat(e.target.value) || 0)}
                              className="pl-12 bg-white border-stone-300 font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">Bea Masuk (%)</Label>
                          <Input
                            type="number"
                            value={beaMasukPercent === 0 ? "" : beaMasukPercent}
                            onChange={(e) => setBeaMasukPercent(parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-300 font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">PPN (%)</Label>
                          <Input
                            type="number"
                            value={ppnPercent === 0 ? "" : ppnPercent}
                            onChange={(e) => setPpnPercent(parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-300 font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">PPh (%)</Label>
                          <Input
                            type="number"
                            value={pphPercent === 0 ? "" : pphPercent}
                            onChange={(e) => setPphPercent(parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-300 font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">Asuransi (%)</Label>
                          <Input
                            type="number"
                            value={insurancePercent === 0 ? "" : insurancePercent}
                            onChange={(e) => setInsurancePercent(parseFloat(e.target.value) || 0)}
                            className="bg-white border-stone-300 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">Handling & Undername Cost (IDR)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                            <Input
                              type="number"
                              value={handlingCost === 0 ? "" : handlingCost}
                              onChange={(e) => setHandlingCost(parseFloat(e.target.value) || 0)}
                              className="pl-9 bg-white border-stone-300 font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-500 font-semibold">Biaya Lain-lain (IDR)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                            <Input
                              type="number"
                              value={otherCost === 0 ? "" : otherCost}
                              onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)}
                              className="pl-9 bg-white border-stone-300 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. LOGISTICS & SHIPPING FREIGHT RATES */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider">Shipping & Freight Rates (Tarif Pengiriman)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">
                        {importType === "RESMI" ? "Forwarder SEA Freight (Rp / Shipment)" : "SEA Freight Rate (Rp / CBM)"}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={seaFreightRate === 0 ? "" : seaFreightRate}
                          onChange={(e) => setSeaFreightRate(parseFloat(e.target.value) || 0)}
                          className="pl-9 bg-stone-50 border-stone-300 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">
                        {importType === "RESMI" ? "Forwarder AIR Freight (Rp / KG)" : "AIR Freight Rate (Rp / KG)"}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={airFreightRate === 0 ? "" : airFreightRate}
                          onChange={(e) => setAirFreightRate(parseFloat(e.target.value) || 0)}
                          className="pl-9 bg-stone-50 border-stone-300 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">MOQ Sourcing (Carton)</Label>
                      <Input
                        type="number"
                        value={moqCtn === 0 ? "" : moqCtn}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMoqCtn(val);
                          setQtyPcs(val * (qtyPerCtn || 1));
                        }}
                        className="bg-stone-50 border-stone-300 font-semibold"
                      />
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${calculationMode === "VARIABLE" ? "" : "md:grid-cols-2"} gap-4 pt-1`}>
                    {calculationMode !== "VARIABLE" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-stone-500 font-semibold uppercase">
                          {importType === "RESMI" ? "Local Trucking Negara Asal (Valas)" : "Origin Delivery Cost"}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">{currency}</span>
                          <Input
                            type="number"
                            value={gzDeliveryCost === 0 ? "" : gzDeliveryCost}
                            onChange={(e) => setGzDeliveryCost(parseFloat(e.target.value) || 0)}
                            className="pl-12 bg-stone-50 border-stone-300 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500 font-semibold uppercase">
                        {importType === "RESMI" ? "Local Trucking Negara Tujuan (IDR)" : "Local Delivery (Warehouse IDR)"}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={localFreight === 0 ? "" : localFreight}
                          onChange={(e) => setLocalFreight(parseFloat(e.target.value) || 0)}
                          className="pl-9 bg-stone-50 border-stone-300 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. TARGET QUOTATION PRICE CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Target Qty Order (Pcs)</Label>
                    <Input
                      type="number"
                      value={qtyPcs === 0 ? "" : qtyPcs}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setQtyPcs(val);
                        setMoqCtn(Math.max(1, Math.ceil(val / (qtyPerCtn || 1))));
                      }}
                      className="bg-stone-50 border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Target Margin / Pcs (IDR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                      <Input
                        type="number"
                        value={margin === 0 ? "" : margin}
                        onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                        className="pl-9 bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Sponsor / Agent Fee (%)</Label>
                    <Input
                      type="number"
                      value={sponsorPercent === 0 ? "" : sponsorPercent}
                      onChange={(e) => setSponsorPercent(parseFloat(e.target.value) || 0)}
                      className="bg-stone-50 border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Pembulatan Harga</Label>
                    <Popover open={roundUpSelectOpen} onOpenChange={setRoundUpSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="bg-stone-50 border-stone-300 w-full justify-between font-normal text-stone-850 h-10">
                          <span className="truncate text-left flex-1 min-w-0 pr-2">
                            {roundUpTo === 1000
                              ? "Ribuan (Rp 1.000)"
                              : roundUpTo === 100
                              ? "Ratusan (Rp 100)"
                              : "Tanpa Pembulatan"}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-40px)] p-0 bg-white border border-stone-250 shadow-md">
                        <Command>
                          <CommandInput placeholder="Cari pembulatan..." />
                          <CommandList>
                            <CommandEmpty>Opsi tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {[
                                { value: "1", label: "Tanpa Pembulatan" },
                                { value: "100", label: "Ratusan (Rp 100)" },
                                { value: "1000", label: "Ribuan (Rp 1.000)" },
                              ].map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  value={opt.label}
                                  onSelect={() => {
                                    setRoundUpTo(Number(opt.value));
                                    setRoundUpSelectOpen(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      String(roundUpTo) === opt.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{opt.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* NOTES */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-xs font-bold uppercase text-stone-600">Catatan / Keterangan Sourcing</Label>
                  <Textarea
                    placeholder="Contoh: Quote harga valid s/d akhir bulan, exclude custom printing..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-stone-50 border-stone-300 min-h-[80px]"
                  />
                </div>

                {/* SAVE BUTTON */}
                <div className="pt-2">
                  <Button
                    onClick={handleSaveRecord}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-accent text-white font-bold uppercase text-xs tracking-wider h-11"
                  >
                    {saving ? "Menyimpan..." : editingRecord ? "Simpan Perubahan Catatan" : "Simpan Catatan Harga Supplier"}
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* RESULTS PANEL (RIGHT COLUMN) */}
            <div className="xl:col-span-5 space-y-6">
              
              {!isCalculationStarted ? (
                <Card className="bg-stone-50 border border-dashed border-stone-300 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[400px]">
                  <div className="p-3 bg-stone-100 rounded-full border border-stone-200 shadow-2xs">
                    <FileSpreadsheet className="h-8 w-8 text-stone-400" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-stone-700">Belum Ada Kalkulasi</h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Masukkan harga beli supplier, kuantitas order, serta dimensi kemasan di kolom kiri untuk melihat simulasi HPP (COGS) dan harga jual.
                    </p>
                  </div>
                </Card>
              ) : calculationMode === "VARIABLE" ? (
                <Card className="bg-white border border-stone-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-stone-50 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold uppercase text-stone-800 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                        Matriks Hasil Variable COGS & Harga Jual
                      </CardTitle>
                      <Badge className="bg-indigo-600 text-white font-bold text-[10px] uppercase">
                        Variable Mode
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Rincian COGS dan Harga Jual (SEA & AIR) per tier kuantitas berdasarkan spreadsheet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-stone-100/70">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold text-stone-700 uppercase">Pcs / Ctn</TableHead>
                          <TableHead className="text-[10px] font-bold text-stone-700 uppercase">Harga/Pcs ({currency})</TableHead>
                          <TableHead className="text-[10px] font-bold text-stone-700 uppercase">COGS (SEA)</TableHead>
                          <TableHead className="text-[10px] font-bold text-stone-700 uppercase">COGS (AIR)</TableHead>
                          <TableHead className="text-[10px] font-bold text-indigo-900 uppercase">Jual (SEA)</TableHead>
                          <TableHead className="text-[10px] font-bold text-amber-900 uppercase">Jual (AIR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const sortedTiers = [...variableTiers].sort((a, b) => Number(a.totalPcs) - Number(b.totalPcs));
                          return sortedTiers.map((tier, idx) => {
                            const tierCalc = calculateCogsAndSellingPrice({
                              importType,
                              beaMasukPercent,
                              ppnPercent,
                              pphPercent,
                              formECost,
                              insurancePercent,
                              handlingCost,
                              otherCost,
                              foreignPrice: tier.pricePcs,
                              gzDeliveryCost: tier.gzCost,
                              exchangeRate,
                              qtyPcs: tier.totalPcs,
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
                              roundUpTo,
                            });

                            const safeQtyPerCtn = qtyPerCtn || 1;
                            const qtyLabel = sortedTiers.length > 1 && idx < sortedTiers.length - 1 && sortedTiers[idx + 1].totalPcs > tier.totalPcs
                              ? `${tier.totalPcs} - ${sortedTiers[idx + 1].totalPcs - 1} pcs`
                              : `≥ ${tier.totalPcs} pcs`;

                            const ctnLabel = sortedTiers.length > 1 && idx < sortedTiers.length - 1 && sortedTiers[idx + 1].totalPcs > tier.totalPcs
                              ? `(${(tier.totalPcs / safeQtyPerCtn).toFixed(2)} - ${((sortedTiers[idx + 1].totalPcs - 1) / safeQtyPerCtn).toFixed(2)} ctn)`
                              : `(≥ ${(tier.totalPcs / safeQtyPerCtn).toFixed(2)} ctn)`;

                            return (
                              <TableRow key={tier.id} className="hover:bg-stone-50 text-xs">
                                <TableCell className="font-bold text-stone-800">
                                  {qtyLabel}
                                  <span className="block text-[10px] text-stone-500 font-normal">{ctnLabel}</span>
                                </TableCell>
                              <TableCell className="font-semibold text-stone-700">
                                {currency} {tier.pricePcs.toLocaleString("id-ID")}
                                {tier.gzCost > 0 && <span className="block text-[9px] text-stone-400">+ Origin {tier.gzCost}</span>}
                              </TableCell>
                              <TableCell className="font-semibold text-blue-900">
                                Rp {Math.round(tierCalc.cogsSea).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-semibold text-amber-900">
                                Rp {Math.round(tierCalc.cogsAir).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-black text-indigo-700 bg-indigo-50/50">
                                Rp {tierCalc.sellPriceSea.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-black text-amber-700 bg-amber-50/50">
                                Rp {tierCalc.sellPriceAir.toLocaleString("id-ID")}
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* FIXED MODE TIERING MATRIX TABLE */}
                  <Card className="bg-white border border-stone-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-stone-50 border-b pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase text-stone-800 flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          Fixed Mode Tiering Matrix (Simulasi MOQ Step)
                        </CardTitle>
                        <Badge className="bg-stone-800 text-white font-bold text-[10px] uppercase">
                          MOQ {Math.max(1, Math.ceil(qtyPcs / (qtyPerCtn || 1)))} Ctn ({Math.max(1, Math.ceil(qtyPcs / (qtyPerCtn || 1))) * qtyPerCtn} Pcs)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-stone-100/70">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold text-stone-700 uppercase">Pcs / Ctn</TableHead>
                            <TableHead className="text-[10px] font-bold text-stone-700 uppercase">Cost SEA/Pcs</TableHead>
                            <TableHead className="text-[10px] font-bold text-stone-700 uppercase">Cost AIR/Pcs</TableHead>
                            <TableHead className="text-[10px] font-bold text-blue-900 uppercase">COGS (SEA)</TableHead>
                            <TableHead className="text-[10px] font-bold text-amber-900 uppercase">COGS (AIR)</TableHead>
                            <TableHead className="text-[10px] font-bold text-indigo-900 uppercase">Jual (SEA)</TableHead>
                            <TableHead className="text-[10px] font-bold text-amber-900 uppercase">Jual (AIR)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[0, 1, 2, 3, 4].map((step) => {
                            const baseMoqCtn = Math.max(1, moqCtn || 1);
                            const stepCtn = baseMoqCtn + step;
                            const stepPcs = stepCtn * (qtyPerCtn || 1);
                            
                            const stepCalc = calculateCogsAndSellingPrice({
                              importType,
                              beaMasukPercent,
                              ppnPercent,
                              pphPercent,
                              formECost,
                              insurancePercent,
                              handlingCost,
                              otherCost,
                              foreignPrice,
                              gzDeliveryCost,
                              exchangeRate,
                              qtyPcs: stepPcs,
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
                              roundUpTo,
                            });

                            const nextStepPcs = (baseMoqCtn + step + 1) * (qtyPerCtn || 1);
                            const qtyLabel = step < 4
                              ? `${stepPcs} - ${nextStepPcs - 1} pcs`
                              : `≥ ${stepPcs} pcs`;
                            const ctnLabel = step < 4
                              ? `(${stepCtn} ctn)`
                              : `(≥ ${stepCtn} ctn)`;

                            return (
                              <TableRow key={step} className="hover:bg-stone-50 text-xs">
                                <TableCell className="font-bold text-stone-800">
                                  {qtyLabel}
                                  <span className="block text-[10px] text-stone-500 font-normal">{ctnLabel}</span>
                                </TableCell>
                                <TableCell className="text-stone-600 font-medium">
                                  Rp {Math.round(stepCalc.seaFreightCostPcs).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-stone-600 font-medium">
                                  Rp {Math.round(stepCalc.airFreightCostPcs).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-semibold text-blue-900">
                                  Rp {Math.round(stepCalc.cogsSea).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-semibold text-amber-900">
                                  Rp {Math.round(stepCalc.cogsAir).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-black text-indigo-700 bg-indigo-50/50">
                                  Rp {stepCalc.sellPriceSea.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-black text-amber-700 bg-amber-50/50">
                                  Rp {stepCalc.sellPriceAir.toLocaleString("id-ID")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* SEA FREIGHT CALC CARD */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <FileSpreadsheet className="h-24 w-24 text-blue-900" />
                </div>
                <CardHeader className="pb-3 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-600 text-white font-bold text-[10px] tracking-wide uppercase">Laut / SEA FREIGHT</Badge>
                    <span className="text-xs text-blue-800 font-semibold">CBM Allocation</span>
                  </div>
                  <CardTitle className="text-2xl font-black text-blue-950 pt-2">
                    Rp {sellPriceSea.toLocaleString("id-ID")}
                    <span className="text-xs font-semibold text-stone-500 block pt-1">Suggested Selling Price / Pcs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm text-blue-900">
                  <div className="flex justify-between">
                    <span>Allocated Volume (Min 0.1 CBM)</span>
                    <span className="font-semibold">{totalSeaCbmAlloc.toFixed(3)} CBM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Box (Carton)</span>
                    <span className="font-semibold">{totalCtn} Ctn</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-100 pt-2">
                    <span>Base Product Cost (RMB/USD conversion)</span>
                    <span>Rp {baseCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Origin Delivery allocation</span>
                    <span>Rp {gzDeliveryCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sea Freight allocation</span>
                    <span>Rp {seaFreightCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indonesian Local Freight allocation</span>
                    <span>Rp {localFreight.toLocaleString("id-ID")}</span>
                  </div>
                  {importType === "RESMI" && (
                    <div className="border-t border-blue-100/50 pt-2 space-y-1 text-xs text-blue-800/80">
                      <div className="flex justify-between">
                        <span>Form E allocation</span>
                        <span>Rp {formECostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance allocation</span>
                        <span>Rp {insuranceCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>CIF Price per Pcs</span>
                        <span>Rp {cifSeaPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bea Masuk ({beaMasukPercent}%)</span>
                        <span>Rp {bmSeaPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PPN ({ppnPercent}%)</span>
                        <span>Rp {ppnSeaPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PPh ({pphPercent}%)</span>
                        <span>Rp {pphSeaPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Handling & Clearance allocation</span>
                        <span>Rp {handlingCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Lain-lain allocation</span>
                        <span>Rp {otherCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2 font-bold text-blue-950">
                    <span>TOTAL COGS / PCS</span>
                    <span>Rp {Math.round(cogsSea).toLocaleString("id-ID")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* AIR FREIGHT CALC CARD */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Coins className="h-24 w-24 text-amber-900" />
                </div>
                <CardHeader className="pb-3 border-b border-amber-100">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-600 text-white font-bold text-[10px] tracking-wide uppercase">Udara / AIR FREIGHT</Badge>
                    <span className="text-xs text-amber-800 font-semibold">Weight Allocation</span>
                  </div>
                  <CardTitle className="text-2xl font-black text-amber-950 pt-2">
                    Rp {sellPriceAir.toLocaleString("id-ID")}
                    <span className="text-xs font-semibold text-stone-500 block pt-1">Suggested Selling Price / Pcs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm text-amber-900">
                  <div className="flex justify-between">
                    <span>Allocated Weight (Volumetric/Actual)</span>
                    <span className="font-semibold">{totalAirWeightAlloc.toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Box (Carton)</span>
                    <span className="font-semibold">{totalCtn} Ctn</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-100 pt-2">
                    <span>Base Product Cost (RMB/USD conversion)</span>
                    <span>Rp {baseCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Origin Delivery allocation</span>
                    <span>Rp {gzDeliveryCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Air Freight allocation</span>
                    <span>Rp {airFreightCostPcs.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indonesian Local Freight allocation</span>
                    <span>Rp {localFreight.toLocaleString("id-ID")}</span>
                  </div>
                  {importType === "RESMI" && (
                    <div className="border-t border-amber-100/50 pt-2 space-y-1 text-xs text-amber-800/80">
                      <div className="flex justify-between">
                        <span>Form E allocation</span>
                        <span>Rp {formECostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance allocation</span>
                        <span>Rp {insuranceCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>CIF Price per Pcs</span>
                        <span>Rp {cifAirPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bea Masuk ({beaMasukPercent}%)</span>
                        <span>Rp {bmAirPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PPN ({ppnPercent}%)</span>
                        <span>Rp {ppnAirPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PPh ({pphPercent}%)</span>
                        <span>Rp {pphAirPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Handling & Clearance allocation</span>
                        <span>Rp {handlingCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Lain-lain allocation</span>
                        <span>Rp {otherCostPcsVal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-amber-200 pt-2 font-bold text-amber-950">
                    <span>TOTAL COGS / PCS</span>
                    <span>Rp {Math.round(cogsAir).toLocaleString("id-ID")}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

              {/* RATE REFERENCE GUIDELINES */}
              <Card className="bg-stone-50 border border-stone-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-stone-500" />
                    Keterangan & Catatan Perhitungan
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-stone-500 space-y-2">
                  <p>• Perhitungan <strong>Volume Sea Freight</strong> menggunakan rumus CBM standar (Panjang × Lebar × Tinggi / 1.000.000) dikalikan jumlah box dengan batasan minimal 0.1 CBM per pengiriman.</p>
                  <p>• Perhitungan <strong>Berat Air Freight</strong> membandingkan berat asli dengan berat volumetrik (P×L×T/5.000) dan mengambil nilai tertinggi.</p>
                  <p>• <strong>Suggested Price</strong> dihitung dengan mengalikan COGS dengan fee sponsor {sponsorPercent}% lalu ditambah target profit margin Rp {margin.toLocaleString("id-ID")} per pcs, kemudian {roundUpTo > 1 ? `dibulatkan ke kelipatan Rp ${roundUpTo.toLocaleString("id-ID")} terdekat` : "tanpa pembulatan"}.</p>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}

      {/* Floating comparison bar */}
      {selectedRecordIds.length >= 2 && !showComparison && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white py-3 px-5 rounded-full shadow-2xl flex items-center gap-4 z-50 border border-stone-800 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs font-bold tracking-wide uppercase">
            {selectedRecordIds.length} Catatan Sourcing Dipilih
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowComparison(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-wider py-1.5 px-4 h-8 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bandingkan
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedRecordIds([])}
              className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-wider h-8 rounded-full cursor-pointer hover:bg-stone-800"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
