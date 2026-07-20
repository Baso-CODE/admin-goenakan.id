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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

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
  const itemsPerPage = 10;

  // Rates State
  const [fetchingRates, setFetchingRates] = useState(false);
  const [ratesData, setRatesData] = useState<any>({ RMB: 2250, USD: 16200 });

  // Inputs / Form States
  const [selectedProductId, setSelectedProductId] = useState<string>("sandbox");
  const [tempProductName, setTempProductName] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedServiceVendorId, setSelectedServiceVendorId] = useState<string>("");
  const [cogsStatus, setCogsStatus] = useState<"EXISTING" | "POTENTIAL">("POTENTIAL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | "EXISTING" | "POTENTIAL">("ALL");

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
  const [notes, setNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, vendRes] = await Promise.all([
          fetchApi("/products/order"),
          fetchApi("/vendors/order/add"),
        ]);

        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods.data || prods || []);
        }

        if (vendRes.ok) {
          const vends = await vendRes.json();
          setVendors(vends.data || vends || []);
        }

        loadHistory();
        fetchExchangeRates("RMB");
        fetchExchangeRates("USD");
      } catch (err) {
        toast.error("Gagal memuat master data.");
      }
    };
    loadData();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetchApi("/supplier-cogs");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExchangeRates = async (base: string) => {
    setFetchingRates(true);
    try {
      const res = await fetchApi(`/supplier-cogs/rates?base=${base}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rates) {
          setRatesData((prev: any) => ({
            ...prev,
            [base]: data.rates.IDR || prev[base],
          }));
          if (currency === base) {
            setExchangeRate(data.rates.IDR);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingRates(false);
    }
  };

  // Sync dimensions when product selection changes
  useEffect(() => {
    if (selectedProductId !== "sandbox") {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod) {
        setQtyPerCtn(prod.qtyPerCtn || 1);
        setLength(prod.length || 0);
        setWidth(prod.width || 0);
        setHeight(prod.height || 0);
        setWeight(prod.weight || 0);
        setTempProductName("");
      }
    }
  }, [selectedProductId, products]);

  // Sync exchange rate input when currency changes
  useEffect(() => {
    setExchangeRate(ratesData[currency] || (currency === "RMB" ? 2250 : 16200));
  }, [currency, ratesData]);

  // --- MATHEMATICAL COGS FORMULAS ---
  
  // 1. Total Carton allocation
  const totalCtn = Math.max(1, Math.ceil(qtyPcs / qtyPerCtn));

  // 2. Volumetric conversions
  const cbmPerCtn = (length * width * height) / 1000000;
  const totalCbm = cbmPerCtn * totalCtn;
  const totalSeaCbmAlloc = Math.max(0.1, totalCbm); // Min 0.1 CBM

  // Air weight (exact Excel logic: comparison of Sea CBM vs weight + 2kg packaging overhead per carton)
  const totalAirWeightAlloc = Math.max(totalSeaCbmAlloc, (weight + 2) * totalCtn);

  // 3. Freight costs per piece
  const seaFreightCostPcs = (totalSeaCbmAlloc * seaFreightRate) / qtyPcs;
  const airFreightCostPcs = (totalAirWeightAlloc * airFreightRate) / qtyPcs;
  
  // 4. Guangzhou delivery cost per piece (Excel logic: flat per-piece foreign rate conversion)
  const gzDeliveryCostPcs = gzDeliveryCost * exchangeRate;

  // 5. Base cost per piece
  const baseCostPcs = foreignPrice * exchangeRate;

  // 6. Total COGS
  const cogsSea = baseCostPcs + gzDeliveryCostPcs + seaFreightCostPcs + localFreight;
  const cogsAir = baseCostPcs + gzDeliveryCostPcs + airFreightCostPcs + localFreight;

  // 7. Suggested Selling Prices (Sponsor fee % + Margin + Rounding)
  const sponsorMultiplier = 1 + (sponsorPercent / 100);
  
  const rawSellSea = (cogsSea * sponsorMultiplier) + margin;
  const rawSellAir = (cogsAir * sponsorMultiplier) + margin;

  // Round up to nearest 1,000 IDR
  const sellPriceSea = Math.ceil(rawSellSea / 1000) * 1000;
  const sellPriceAir = Math.ceil(rawSellAir / 1000) * 1000;

  // --- SAVE OR UPDATE CALCULATION ---
  const handleSaveRecord = async () => {
    if (selectedProductId === "sandbox" && !tempProductName.trim()) {
      toast.error("Mohon masukkan nama produk sourcing");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productId: selectedProductId === "sandbox" ? undefined : selectedProductId,
        tempProductName: selectedProductId === "sandbox" ? tempProductName.trim() : undefined,
        status: cogsStatus,
        calculationMode,
        tiers: calculationMode === "VARIABLE" ? variableTiers : undefined,
        vendorId: selectedVendorId && selectedVendorId !== "none" ? selectedVendorId : undefined,
        serviceVendorId: selectedServiceVendorId && selectedServiceVendorId !== "none" ? selectedServiceVendorId : undefined,
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
        margin,
        sponsorPercent: sponsorPercent / 100,
        notes: notes.trim() || undefined,
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
    setEditingRecord(null);
    setSelectedProductId("sandbox");
    setTempProductName("");
    setSelectedVendorId("");
    setSelectedServiceVendorId("");
    setCogsStatus("POTENTIAL");
    setCalculationMode("FIXED");
    setVariableTiers([
      { id: "1", totalPcs: 12, pricePcs: 85, gzCost: 0 },
      { id: "2", totalPcs: 18, pricePcs: 83, gzCost: 0 },
    ]);
    setForeignPrice(8);
    setCurrency("RMB");
    setExchangeRate(ratesData.RMB || 2250);
    setQtyPerCtn(100);
    setLength(41);
    setWidth(30);
    setHeight(11);
    setWeight(10);
    setGzDeliveryCost(1);
    setLocalFreight(7000);
    setSeaFreightRate(10000000);
    setAirFreightRate(260000);
    setMoqCtn(10);
    setQtyPcs(100);
    setMargin(10000);
    setSponsorPercent(2);
    setNotes("");
  };

  const handleAddNew = () => {
    resetForm();
    setView("form");
  };

  // --- LOAD HISTORICAL RECORD TO EDIT/DETAIL FORM ---
  const handleLoadDetails = (rec: any) => {
    setEditingRecord(rec);
    setSelectedProductId(rec.productId || "sandbox");
    setTempProductName(rec.tempProductName || "");
    setSelectedVendorId(rec.vendorId || "");
    setSelectedServiceVendorId(rec.serviceVendorId || "");
    setCogsStatus(rec.status || (rec.productId ? "EXISTING" : "POTENTIAL"));
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
    setMargin(Number(rec.margin) || 0);
    setSponsorPercent(Number(rec.sponsorPercent) * 100);
    setNotes(rec.notes || "");
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

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
      {view === "list" ? (
        
        /* === 1. LIST VIEW === */
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
                    Semua
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
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Produk</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Supplier</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Harga Asli</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Kurs (IDR)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Total Harga (IDR)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Kemasan Ctn</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-stone-600">Tanggal Quote</TableHead>
                    <TableHead className="font-bold text-xs text-right uppercase text-stone-600">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-stone-400 py-8 text-sm">
                        {searchQuery || historyStatusFilter !== "ALL" ? "Tidak ditemukan catatan harga yang cocok." : "Belum ada catatan harga supplier yang disimpan."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((rec) => {
                      const baseVal = Number(rec.foreignPrice) * Number(rec.exchangeRate);
                      const displayProdName = rec.product ? rec.product.name : rec.tempProductName;
                      const formattedDate = new Date(rec.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                      const isExisting = rec.status === "EXISTING" || (!rec.status && rec.productId);

                      return (
                        <TableRow key={rec.id} className="hover:bg-stone-50 transition-colors">
                          <TableCell className="font-medium text-stone-850">
                            <div>
                              <span>{displayProdName}</span>
                              <div className="flex items-center gap-1 mt-1">
                                {isExisting ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                    Existing
                                  </Badge>
                                ) : (
                                  <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                    Potential
                                  </Badge>
                                )}
                                {!rec.productId && (
                                  <Badge className="bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-100 text-[9px] px-1.5 py-0.2">Draft</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-stone-600">
                            <div>
                              <p className="font-medium text-stone-800">{rec.vendor?.companyName || "-"}</p>
                              {rec.serviceVendor && (
                                <p className="text-[10px] text-stone-500 font-normal flex items-center gap-1 mt-0.5">
                                  <span>🚚 Logistik:</span> {rec.serviceVendor.companyName}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-stone-700">
                            {rec.currencyCode} {Number(rec.foreignPrice).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-stone-500">Rp {Number(rec.exchangeRate).toLocaleString("id-ID")}</TableCell>
                          <TableCell className="font-bold text-stone-800">Rp {baseVal.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-stone-500 text-xs">
                            {rec.qtyPerCtn} pcs/Ctn ({rec.length}x{rec.width}x{rec.height}cm, {rec.weight}kg)
                          </TableCell>
                          <TableCell className="text-stone-500 text-xs">{formattedDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadDetails(rec)}
                                className="text-stone-700 border-stone-200 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1"
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-4">
                <span className="text-xs text-stone-500">
                  Menampilkan Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total <strong>{filteredRecords.length}</strong> data)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 border-stone-200 text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 border-stone-200 text-xs flex items-center gap-1"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

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
                  
                  {/* MODE SWITCHER */}
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-md border border-stone-200 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setCalculationMode("FIXED")}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === "FIXED"
                          ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      📏 Fixed Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculationMode("VARIABLE")}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === "VARIABLE"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      📊 Variable Mode
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* 1. SELECT PRODUCT OR SANDBOX */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">Master Product Catalog</Label>
                      <Select value={selectedProductId} onValueChange={(val) => {
                        setSelectedProductId(val);
                        if (val !== "sandbox") {
                          setCogsStatus("EXISTING");
                        }
                      }}>
                        <SelectTrigger className="bg-stone-50 border-stone-300">
                          <SelectValue placeholder="Pilih Produk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">⭐ [Sourcing Sandbox / Item Baru]</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProductId === "sandbox" && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-stone-600">Nama Produk Sourcing</Label>
                        <Input
                          placeholder="Contoh: Tumbler Ceramic Type-D"
                          value={tempProductName}
                          onChange={(e) => setTempProductName(e.target.value)}
                          className="bg-stone-50 border-stone-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* STATUS / TAG SELECTION */}
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <Label className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-stone-500" /> Status / Tag Produk COGS
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCogsStatus("EXISTING")}
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
                        onClick={() => setCogsStatus("POTENTIAL")}
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
                </div>

                {/* 2. SELECT SUPPLIER & SERVICE VENDOR (SIDE BY SIDE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Vendor */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">
                      Supplier / Vendor Product
                    </Label>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger className="bg-stone-50 border-stone-300">
                        <SelectValue placeholder="Pilih Supplier Product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tanpa Vendor Product --</SelectItem>
                        {productVendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{v.companyName}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase ml-2">
                                Product
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Vendor */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">
                      Vendor Ekspedisi / Service (Opsional)
                    </Label>
                    <Select value={selectedServiceVendorId} onValueChange={setSelectedServiceVendorId}>
                      <SelectTrigger className="bg-stone-50 border-stone-300">
                        <SelectValue placeholder="Pilih Vendor Service (Opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tanpa Vendor Service --</SelectItem>
                        {serviceVendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{v.companyName}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase ml-2">
                                Service
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. SUPPLIER PRICING DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Mata Uang</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-stone-50 border-stone-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RMB">RMB (Yuan)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Harga Beli Supplier</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">{currency}</span>
                      <Input
                        type="number"
                        value={foreignPrice}
                        onChange={(e) => setForeignPrice(Number(e.target.value))}
                        className="pl-12 bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>

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
                        value={exchangeRate}
                        disabled={currency === "IDR"}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
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
                        value={qtyPerCtn}
                        onChange={(e) => setQtyPerCtn(Number(e.target.value))}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Panjang (cm)</Label>
                      <Input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Lebar (cm)</Label>
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500">Tinggi (cm)</Label>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="bg-stone-50 border-stone-300"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label className="text-xs text-stone-500">Berat (kg)</Label>
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
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
                            <TableHead className="text-xs font-bold text-stone-700">GZ Cost ({currency})</TableHead>
                            <TableHead className="text-xs font-bold text-right text-stone-700">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variableTiers.map((tier) => {
                            const computedCtn = (tier.totalPcs / (qtyPerCtn || 1)).toFixed(2);
                            return (
                              <TableRow key={tier.id}>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={tier.totalPcs}
                                    onChange={(e) => handleUpdateTier(tier.id, "totalPcs", Number(e.target.value))}
                                    className="bg-white h-8 text-xs font-semibold w-24"
                                  />
                                </TableCell>
                                <TableCell className="text-xs font-bold text-stone-600">
                                  {computedCtn} Ctn
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 font-bold">{currency}</span>
                                    <Input
                                      type="number"
                                      value={tier.pricePcs}
                                      onChange={(e) => handleUpdateTier(tier.id, "pricePcs", Number(e.target.value))}
                                      className="bg-white h-8 text-xs font-semibold pl-10 w-28"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 font-bold">{currency}</span>
                                    <Input
                                      type="number"
                                      value={tier.gzCost}
                                      onChange={(e) => handleUpdateTier(tier.id, "gzCost", Number(e.target.value))}
                                      className="bg-white h-8 text-xs font-semibold pl-10 w-24"
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
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* 5. LOGISTICS & SHIPPING FREIGHT RATES */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider">Shipping & Freight Rates (Tarif Pengiriman)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">SEA Freight Rate (Rp / CBM)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={seaFreightRate}
                          onChange={(e) => setSeaFreightRate(Number(e.target.value))}
                          className="pl-9 bg-stone-50 border-stone-300 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">AIR Freight Rate (Rp / KG)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={airFreightRate}
                          onChange={(e) => setAirFreightRate(Number(e.target.value))}
                          className="pl-9 bg-stone-50 border-stone-300 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-stone-600">MOQ Sourcing (Carton)</Label>
                      <Input
                        type="number"
                        value={moqCtn}
                        onChange={(e) => setMoqCtn(Number(e.target.value))}
                        className="bg-stone-50 border-stone-300 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500 font-semibold uppercase">GZ Delivery Cost (Guangzhou)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">{currency}</span>
                        <Input
                          type="number"
                          value={gzDeliveryCost}
                          onChange={(e) => setGzDeliveryCost(Number(e.target.value))}
                          className="pl-12 bg-stone-50 border-stone-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-stone-500 font-semibold uppercase">Local Delivery (Warehouse IDR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                        <Input
                          type="number"
                          value={localFreight}
                          onChange={(e) => setLocalFreight(Number(e.target.value))}
                          className="pl-9 bg-stone-50 border-stone-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. TARGET QUOTATION PRICE CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Target Qty Order (Pcs)</Label>
                    <Input
                      type="number"
                      value={qtyPcs}
                      onChange={(e) => setQtyPcs(Number(e.target.value))}
                      className="bg-stone-50 border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Target Margin / Pcs (IDR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">Rp</span>
                      <Input
                        type="number"
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="pl-9 bg-stone-50 border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Sponsor / Agent Fee (%)</Label>
                    <Input
                      type="number"
                      value={sponsorPercent}
                      onChange={(e) => setSponsorPercent(Number(e.target.value))}
                      className="bg-stone-50 border-stone-300"
                    />
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
              
              {calculationMode === "VARIABLE" ? (
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
                        {variableTiers.map((tier) => {
                          const computedCtn = (tier.totalPcs / (qtyPerCtn || 1)).toFixed(2);
                          const baseCost = (tier.pricePcs + tier.gzCost) * exchangeRate;
                          
                          // CBM Calculation
                          const cbmPerCtn = (length * width * height) / 1000000;
                          const costSeaPcs = qtyPerCtn > 0 ? (cbmPerCtn * 10000000) / qtyPerCtn : 0;
                          
                          // Air Weight Calculation
                          const volWeight = (length * width * height) / 6000;
                          const airWeightPerCtn = Math.max(volWeight, weight);
                          const costAirPcs = qtyPerCtn > 0 ? (260000 * airWeightPerCtn) / qtyPerCtn : 0;

                          const localFreightPcs = tier.totalPcs > 0 ? localFreight / tier.totalPcs : 0;

                          const cogsSeaTier = baseCost + costSeaPcs + localFreightPcs;
                          const cogsAirTier = baseCost + costAirPcs + localFreightPcs;

                          const sponsorMult = 1 + (sponsorPercent / 100);
                          const sellSeaTier = Math.ceil(((cogsSeaTier * sponsorMult) + margin) / 1000) * 1000;
                          const sellAirTier = Math.ceil(((cogsAirTier * sponsorMult) + margin) / 1000) * 1000;

                          return (
                            <TableRow key={tier.id} className="hover:bg-stone-50 text-xs">
                              <TableCell className="font-bold text-stone-800">
                                {tier.totalPcs} pcs
                                <span className="block text-[10px] text-stone-500 font-normal">({computedCtn} ctn)</span>
                              </TableCell>
                              <TableCell className="font-semibold text-stone-700">
                                {currency} {tier.pricePcs.toLocaleString("id-ID")}
                                {tier.gzCost > 0 && <span className="block text-[9px] text-stone-400">+ GZ {tier.gzCost}</span>}
                              </TableCell>
                              <TableCell className="font-semibold text-blue-900">
                                Rp {Math.round(cogsSeaTier).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-semibold text-amber-900">
                                Rp {Math.round(cogsAirTier).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-black text-indigo-700 bg-indigo-50/50">
                                Rp {sellSeaTier.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="font-black text-amber-700 bg-amber-50/50">
                                Rp {sellAirTier.toLocaleString("id-ID")}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                            const baseMoqCtn = Math.max(1, Math.ceil(qtyPcs / (qtyPerCtn || 1)));
                            const stepCtn = baseMoqCtn + step;
                            const stepPcs = stepCtn * (qtyPerCtn || 1);
                            
                            // Cost SEA/Pcs: (cbmPerCtn * 10,000,000) / qtyPerCtn
                            const cbmPerCtn = (length * width * height) / 1000000;
                            const costSeaPcs = qtyPerCtn > 0 ? (cbmPerCtn * 10000000) / qtyPerCtn : 0;
                            
                            // Cost AIR/Pcs: (volWeight vs Weight) * 260,000 / qtyPerCtn
                            const volWeight = (length * width * height) / 6000;
                            const airWeightPerCtn = Math.max(volWeight, weight);
                            const costAirPcs = qtyPerCtn > 0 ? (260000 * airWeightPerCtn) / qtyPerCtn : 0;

                            const cogsSeaTier = baseCostPcs + costSeaPcs + localFreight;
                            const cogsAirTier = baseCostPcs + costAirPcs + localFreight;

                            const sponsorMult = 1 + (sponsorPercent / 100);
                            const sellSeaTier = Math.ceil(((cogsSeaTier * sponsorMult) + margin) / 1000) * 1000;
                            const sellAirTier = Math.ceil(((cogsAirTier * sponsorMult) + margin) / 1000) * 1000;

                            return (
                              <TableRow key={step} className="hover:bg-stone-50 text-xs">
                                <TableCell className="font-bold text-stone-800">
                                  {stepPcs} pcs
                                  <span className="block text-[10px] text-stone-500 font-normal">({stepCtn} ctn)</span>
                                </TableCell>
                                <TableCell className="text-stone-600 font-medium">
                                  Rp {Math.round(costSeaPcs).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-stone-600 font-medium">
                                  Rp {Math.round(costAirPcs).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-semibold text-blue-900">
                                  Rp {Math.round(cogsSeaTier).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-semibold text-amber-900">
                                  Rp {Math.round(cogsAirTier).toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-black text-indigo-700 bg-indigo-50/50">
                                  Rp {sellSeaTier.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="font-black text-amber-700 bg-amber-50/50">
                                  Rp {sellAirTier.toLocaleString("id-ID")}
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
                    <span>Guangzhou Delivery allocation</span>
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
                    <span>Guangzhou Delivery allocation</span>
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
                  <p>• <strong>Suggested Price</strong> dihitung dengan mengalikan COGS dengan fee sponsor {sponsorPercent}% lalu ditambah target profit margin Rp {margin.toLocaleString("id-ID")} per pcs, kemudian dibulatkan ke kelipatan Rp 1.000 terdekat.</p>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
