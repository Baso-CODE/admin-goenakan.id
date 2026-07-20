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
  const [vendorTypeFilter, setVendorTypeFilter] = useState<"ALL" | "PRODUCT" | "SERVICE">("ALL");

  const filteredVendors = vendors.filter((v) => {
    if (vendorTypeFilter === "ALL") return true;
    if (!v.types || v.types.length === 0) return true;
    return v.types.includes(vendorTypeFilter);
  });
  
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
    if (!selectedVendorId) {
      toast.error("Mohon pilih supplier/vendor terlebih dahulu");
      return;
    }
    if (selectedProductId === "sandbox" && !tempProductName.trim()) {
      toast.error("Mohon masukkan nama produk sourcing");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productId: selectedProductId === "sandbox" ? undefined : selectedProductId,
        tempProductName: selectedProductId === "sandbox" ? tempProductName.trim() : undefined,
        vendorId: selectedVendorId,
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
        margin,
        sponsorPercent: sponsorPercent / 100,
        notes: notes.trim() || undefined,
      };

      const isEdit = !!editingRecord;
      const url = isEdit ? `/supplier-cogs/${editingRecord.id}` : "/supplier-cogs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? "Catatan harga supplier berhasil diperbarui!" : "Catatan harga supplier berhasil disimpan!");
        loadHistory();
        setView("list");
        resetForm();
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
    setSelectedVendorId(rec.vendorId);
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
    const notesContent = rec.notes || "";
    const searchString = `${productName} ${vendorName} ${notesContent}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
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
                        {searchQuery ? "Tidak ditemukan catatan harga yang cocok." : "Belum ada catatan harga supplier yang disimpan."}
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

                      return (
                        <TableRow key={rec.id} className="hover:bg-stone-50 transition-colors">
                          <TableCell className="font-medium text-stone-850">
                            {displayProdName}
                            {!rec.productId && (
                              <Badge className="ml-2 bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-100 text-[9px] px-1.5 py-0.5">Sourcing Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-stone-600">{rec.vendor?.companyName || "-"}</TableCell>
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
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-md font-bold uppercase text-stone-700 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-stone-600" />
                  Konfigurasi Cost Sourcing
                </CardTitle>
                <CardDescription>Tentukan parameter harga beli supplier, berat, dimensi dan markup harga.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* 1. SELECT PRODUCT OR SANDBOX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">Master Product Catalog</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
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

                {/* 2. SELECT SUPPLIER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-stone-600">Supplier / Vendor</Label>
                    <div className="flex gap-1 bg-stone-100 p-0.5 rounded text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setVendorTypeFilter("ALL")}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          vendorTypeFilter === "ALL" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        Semua ({vendors.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorTypeFilter("PRODUCT")}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          vendorTypeFilter === "PRODUCT" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        Product
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorTypeFilter("SERVICE")}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          vendorTypeFilter === "SERVICE" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        Service
                      </button>
                    </div>
                  </div>

                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="bg-stone-50 border-stone-300">
                      <SelectValue placeholder="Pilih Supplier / Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVendors.map((v) => {
                        const typeLabel = v.types && v.types.length > 0 
                          ? v.types.map((t: string) => t === "PRODUCT" ? "Product" : "Service").join(" & ")
                          : "";
                        return (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{v.companyName}</span>
                              {typeLabel && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 uppercase ml-2">
                                  {typeLabel}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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

                {/* 5. LOGISTICS FEES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-stone-600">GZ Delivery Cost (Guangzhou)</Label>
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
                    <Label className="text-xs font-bold uppercase text-stone-600">Local Delivery IDR (Warehouse)</Label>
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
