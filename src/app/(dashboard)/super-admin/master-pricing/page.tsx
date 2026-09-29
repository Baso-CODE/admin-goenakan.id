"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  Save,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ManagePriceModal } from "./components/ManagePriceModal";

export type PriceTier = {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number | string;
};

export type VendorPriceRecord = {
  id: string;
  foreignPrice: number | string;
  exchangeRate: number | string;
  currencyCode: string;
  importType: string;
  calculationMode: string;
  moqCtn: number;
  qtyPerCtn: number;
  margin: number | string;
  sponsorPercent: number | string;
  seaFreightRate: number | string;
  airFreightRate: number | string;
  gzDeliveryCost: number | string;
  localFreight: number | string;
  status: string;
  beaMasukPercent: number | string;
  ppnPercent: number | string;
  pphPercent: number | string;
  formECost: number | string;
  insurancePercent: number | string;
  handlingCost: number | string;
  otherCost: number | string;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  weight?: number | string | null;
  notes?: string | null;
  vendor?: {
    companyName: string;
  } | null;
  tiers?: any;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice: number | string;
  isCustom: boolean;
  category?: Category | null;
  activeVendorPriceRecordId?: string | null;
  activePriceFreightMode?: string | null;
  activeVendorPriceRecord?: VendorPriceRecord | null;
  vendorPrices?: VendorPriceRecord[];
  priceTiers?: PriceTier[];
  foreignPrice?: number | string | null;
  currencyCode?: string | null;
  exchangeRate?: number | string | null;
  additionalFee?: number | string | null;
  foreignPriceAdjuster?: number | string | null;
  images?: {
    id: string;
    url: string;
    isFeatured: boolean;
  }[];
};

type Category = {
  id: string;
  name?: string;
  name_id?: string;
  name_en?: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function MasterPricingPage() {
  const { fetchApi, status } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<
    { code: string; name: string; symbol?: string }[]
  >([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global pricing modifier states
  const [modifierOpen, setModifierOpen] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState("");
  const [newExchangeRate, setNewExchangeRate] = useState<number | string>("");
  const [offsetValue, setOffsetValue] = useState<number | string>(0);
  const [offsetCurrency, setOffsetCurrency] = useState("IDR");
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // Preview Dialog states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Global Foreign Price Adjuster states
  const [globalForeignPriceAdjuster, setGlobalForeignPriceAdjuster] =
    useState<number>(0);
  const [isSavingAdjuster, setIsSavingAdjuster] = useState(false);
  const [adjusterOpen, setAdjusterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 800);

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetchApi("/app-settings");
      if (res.ok) {
        const data = await res.json();
        setGlobalForeignPriceAdjuster(data?.globalForeignPriceAdjuster || 0);
      }
    } catch (err) {
      console.error("Failed to load global app settings", err);
    }
  };

  const handleSaveGlobalAdjuster = async () => {
    setIsSavingAdjuster(true);
    try {
      const res = await fetchApi("/app-settings", {
        method: "PATCH",
        body: JSON.stringify({
          globalForeignPriceAdjuster: Number(globalForeignPriceAdjuster) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save global adjuster");
      }

      toast.success("Global foreign price adjuster berhasil diperbarui!");
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui global adjuster");
    } finally {
      setIsSavingAdjuster(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetchApi("/product-categories/list");
      if (!res.ok) {
        setCategories([]);
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setCategories(items);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategories([]);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetchApi("/currencies");
      const data = await res.json();
      setCurrencies(data);
    } catch (err) {
      console.error("Failed to load currencies", err);
    }
  };

  const handleFetchRate = async (code: string) => {
    if (!code || code === "IDR") {
      setNewExchangeRate(1);
      return;
    }
    setIsFetchingRate(true);
    try {
      const apiBase = code === "RMB" ? "CNY" : code;
      const res = await fetch(`https://open.er-api.com/v6/latest/${apiBase}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const rateVal = data.rates.IDR;
          setNewExchangeRate(rateVal);
          toast.success(
            `Kurs ${code} berhasil diperbarui: Rp ${rateVal.toLocaleString("id-ID")}`,
          );
        } else {
          toast.error(`Gagal mengambil kurs terbaru untuk ${code}.`);
        }
      } else {
        toast.error(`Gagal memuat kurs ${code}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan memuat kurs.");
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleOpenPreview = async () => {
    if (
      !newExchangeRate ||
      isNaN(Number(newExchangeRate)) ||
      Number(newExchangeRate) <= 0
    ) {
      toast.error("Silakan masukkan nilai kurs yang valid.");
      return;
    }
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    setConfirmCheckbox(false);
    setSelectedProductIds([]);
    try {
      const res = await fetchApi("/products/master-price/batch-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCurrency,
          newExchangeRate: Number(newExchangeRate),
          offsetValue: Number(offsetValue) || 0,
          offsetCurrency,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data);
        setSelectedProductIds(
          data.previewItems?.map((item: any) => item.productId) || [],
        );
      } else {
        toast.error(data.message || "Gagal memuat preview penyesuaian harga.");
        setIsPreviewOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi.");
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyBatchUpdate = async () => {
    if (!confirmCheckbox) {
      toast.error("Silakan centang persetujuan terlebih dahulu.");
      return;
    }
    if (selectedProductIds.length === 0) {
      toast.error("Silakan pilih minimal satu produk untuk diupdate.");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetchApi("/products/master-price/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCurrency,
          newExchangeRate: Number(newExchangeRate),
          offsetValue: Number(offsetValue) || 0,
          offsetCurrency,
          productIds: selectedProductIds,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(
          result.message || "Penyesuaian harga global berhasil disimpan!",
        );
        setIsPreviewOpen(false);
        fetchProducts();
      } else {
        toast.error(result.message || "Gagal menyimpan penyesuaian harga.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (modifierOpen && targetCurrency) {
      handleFetchRate(targetCurrency);
    }
  }, [modifierOpen, targetCurrency]);

  const fetchProducts = async () => {
    if (status === "loading") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (categoryFilter !== "ALL") params.append("categoryId", categoryFilter);
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      const res = await fetchApi(`/products?${params}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch product data.");
      }

      setProducts(result.data || []);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Gagal memuat katalog produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCurrencies();
    fetchGlobalSettings();
  }, [fetchApi]);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, debouncedSearch, status]);

  const handleOpenManageModal = (prod: Product) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" />
            Master Pricing
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Pusat kelola dan sinkronisasi harga katalog produk berdasarkan
            kalkulator COGS supplier.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          disabled={loading}
          className="self-start md:self-auto gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filter & Search */}
      <Card className="bg-white border-stone-200 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              className="pl-9 bg-stone-50/50 border-stone-200"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
              defaultValue="ALL">
              <SelectTrigger className="bg-stone-50/50 border-stone-200">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {Array.isArray(categories) &&
                  categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_id || c.name || "Kategori"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Global Pricing Modifier Card */}
      <Card className="bg-white border-stone-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setModifierOpen(!modifierOpen)}
          className="w-full flex items-center justify-between p-4 font-semibold text-stone-800 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-600" />
            <span>Global Pricing Modifier</span>
            <Badge className="bg-stone-100 text-stone-600 font-bold border-stone-200 hover:bg-stone-100 text-[10px]">
              Batch Update
            </Badge>
          </div>
          {modifierOpen ? (
            <ChevronUp className="h-5 w-5 text-stone-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-500" />
          )}
        </button>

        {modifierOpen && (
          <div className="p-4 border-t bg-stone-50/50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <div className="space-y-1">
                <Label
                  htmlFor="targetCurrency"
                  className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Target Currency
                </Label>
                <Select
                  value={targetCurrency}
                  onValueChange={(val) => {
                    setTargetCurrency(val);
                    if (val === "IDR") setNewExchangeRate(1);
                  }}>
                  <SelectTrigger className="bg-white border-stone-200 mt-1 font-semibold">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                    {currencies
                      .filter((c) => c.code !== "IDR")
                      .map((cur) => (
                        <SelectItem key={cur.code} value={cur.code}>
                          {cur.code} ({cur.symbol || "$"}) -{" "}
                          {cur.name || cur.code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="newExchangeRate"
                    className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                    New Exchange Rate (Kurs)
                  </Label>
                  {targetCurrency !== "IDR" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 hover:bg-stone-100"
                      onClick={() => handleFetchRate(targetCurrency)}
                      disabled={isFetchingRate}>
                      <RefreshCw
                        className={`h-3 w-3 text-stone-500 ${isFetchingRate ? "animate-spin text-indigo-600" : ""}`}
                      />
                    </Button>
                  )}
                </div>
                <Input
                  id="newExchangeRate"
                  type="number"
                  disabled={targetCurrency === "IDR"}
                  placeholder="Masukkan Kurs..."
                  className="bg-white border-stone-200 mt-1 font-semibold"
                  value={newExchangeRate}
                  onChange={(e) => setNewExchangeRate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="offsetValue"
                  className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Offset Value (Adjustment)
                </Label>
                <Input
                  id="offsetValue"
                  type="number"
                  placeholder="Contoh: 1000 atau -500"
                  className="bg-white border-stone-200 mt-1 font-semibold"
                  value={offsetValue}
                  onChange={(e) => setOffsetValue(e.target.value)}
                />
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  * Catatan: Nilai offset ini akan langsung memengaruhi harga
                  dasar akhir (final base price).
                </p>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="offsetCurrency"
                  className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Offset Currency
                </Label>
                <Select
                  value={offsetCurrency}
                  onValueChange={setOffsetCurrency}>
                  <SelectTrigger className="bg-white border-stone-200 mt-1 font-semibold">
                    <SelectValue placeholder="Pilih Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                    {currencies
                      .filter((c) => c.code !== "IDR")
                      .map((cur) => (
                        <SelectItem key={cur.code} value={cur.code}>
                          {cur.code} ({cur.symbol || "$"}) -{" "}
                          {cur.name || cur.code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleOpenPreview}
                className="bg-indigo-600 text-white font-semibold hover:bg-indigo-700 h-10 px-5 gap-2 shadow-xs">
                <TrendingUp className="h-5 w-5" />
                Preview Adjustments
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Global Foreign Price Adjuster Card */}
      <Card className="bg-white border-stone-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setAdjusterOpen(!adjusterOpen)}
          className="w-full flex items-center justify-between p-4 font-semibold text-stone-800 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span>Global Foreign Price Adjuster</span>
            <Badge className="bg-stone-100 text-stone-600 font-bold border-stone-200 hover:bg-stone-100 text-[10px]">
              Currency Adjuster
            </Badge>
          </div>
          {adjusterOpen ? (
            <ChevronUp className="h-5 w-5 text-stone-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-500" />
          )}
        </button>

        {adjusterOpen && (
          <div className="p-4 border-t bg-stone-50/50 space-y-4">
            <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
              Atur persentase penyesuaian harga global untuk pengguna luar
              negeri. Nilai ini akan berlaku untuk semua produk yang diakses
              dari luar negeri (berdasarkan deteksi kurs/currency non-IDR),
              kecuali jika produk tersebut memiliki adjuster khusus sendiri di
              menu Kelola Master Pricing masing-masing produk.
            </p>
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="globalForeignPriceAdjuster"
                  className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Adjuster Persentase (%)
                </Label>
                <Input
                  id="globalForeignPriceAdjuster"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={globalForeignPriceAdjuster}
                  onChange={(e) =>
                    setGlobalForeignPriceAdjuster(
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="bg-white border-stone-200 font-semibold"
                />
              </div>
              <Button
                onClick={handleSaveGlobalAdjuster}
                disabled={isSavingAdjuster}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-xs gap-1.5 h-10">
                {isSavingAdjuster ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Adjuster
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Global Adjustments Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 bg-white border border-stone-200 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Review Global Price Adjustments
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 mt-1">
              Pratinjau perubahan nilai exchange rate dan offset harga dasar
              untuk seluruh katalog produk.
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex-1 py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="text-sm text-stone-600 font-medium">
                Menghitung ulang harga dasar seluruh produk...
              </span>
            </div>
          ) : previewData ? (
            <div className="flex-grow overflow-hidden flex flex-col space-y-4 my-2">
              {/* Summary Banner */}
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-wrap md:flex-nowrap gap-4 justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-indigo-900">
                    Parameter Batch Update
                  </div>
                  <div className="text-indigo-700 flex items-center gap-2 font-mono">
                    Target: {targetCurrency} Exchange Rate{" "}
                    <ArrowRight className="h-3 w-3" /> Rp{" "}
                    {Number(newExchangeRate).toLocaleString("id-ID")}
                  </div>
                </div>
                {Number(offsetValue) !== 0 && (
                  <div className="space-y-1 text-right md:text-left">
                    <div className="font-semibold text-indigo-900">
                      Tambahan Offset
                    </div>
                    <div className="text-indigo-700 font-mono">
                      {Number(offsetValue) > 0 ? "+" : ""}
                      {Number(offsetValue).toLocaleString("id-ID")}{" "}
                      {offsetCurrency} (≈ Rp{" "}
                      {Number(previewData.summary?.rupiahOffset).toLocaleString(
                        "id-ID",
                      )}
                      )
                    </div>
                  </div>
                )}
                <div className="p-2 bg-white rounded-md border border-indigo-200 font-bold text-indigo-900 text-center min-w-[120px]">
                  {selectedProductIds.length} /{" "}
                  {previewData.previewItems?.length || 0} Terpilih
                </div>
              </div>

              {/* Table List */}
              <div className="flex-grow overflow-y-auto border border-stone-200 rounded-md">
                <Table>
                  <TableHeader className="bg-stone-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[8%] text-center bg-stone-50">
                        <input
                          type="checkbox"
                          className="h-4.5 w-4.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={
                            previewData.previewItems?.length > 0 &&
                            selectedProductIds.length ===
                              previewData.previewItems.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(
                                previewData.previewItems.map(
                                  (item: any) => item.productId,
                                ),
                              );
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-[37%] bg-stone-50">
                        Produk
                      </TableHead>
                      <TableHead className="w-[15%] bg-stone-50">
                        Kategori
                      </TableHead>
                      <TableHead className="w-[15%] text-right bg-stone-50">
                        Harga Lama
                      </TableHead>
                      <TableHead className="w-[15%] text-right bg-stone-50">
                        Harga Baru
                      </TableHead>
                      <TableHead className="w-[10%] text-right bg-stone-50">
                        Selisih
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.previewItems?.map((item: any) => (
                      <TableRow
                        key={item.productId}
                        className="hover:bg-stone-50/50">
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="h-4.5 w-4.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedProductIds.includes(
                              item.productId,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds((prev) => [
                                  ...prev,
                                  item.productId,
                                ]);
                              } else {
                                setSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== item.productId),
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-stone-900 text-xs">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {item.sku}
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-600 text-xs">
                          {item.categoryName}
                        </TableCell>
                        <TableCell className="text-right text-stone-600 text-xs font-mono">
                          Rp {item.currentPrice.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-stone-900 font-bold text-xs font-mono">
                          Rp {item.newPrice.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold text-xs font-mono ${item.difference > 0 ? "text-emerald-600" : item.difference < 0 ? "text-rose-600" : "text-stone-500"}`}>
                          {item.difference > 0 ? "+" : ""}
                          {item.difference.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-2.5 p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <input
                  type="checkbox"
                  id="confirm-batch"
                  className="h-4.5 w-4.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                />
                <label
                  htmlFor="confirm-batch"
                  className="text-xs text-stone-600 leading-normal cursor-pointer select-none">
                  <span className="font-bold text-stone-800 block mb-0.5">
                    Konfirmasi Batch Update
                  </span>
                  Saya menyetujui untuk mengubah harga dasar seluruh katalog
                  produk di atas. Tindakan ini bersifat permanen dan akan
                  langsung memperbarui harga jual di website.
                </label>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-stone-500 text-sm">
              Gagal memuat pratinjau data.
            </div>
          )}

          <DialogFooter className="border-t pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              disabled={isUpdating}
              className="border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold h-10">
              Batal
            </Button>
            <Button
              disabled={!confirmCheckbox || isUpdating || !previewData}
              onClick={handleApplyBatchUpdate}
              className="bg-indigo-600 text-white font-semibold hover:bg-indigo-700 h-10 px-5 gap-2 shadow-xs disabled:opacity-50">
              {isUpdating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Terapkan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <Card className="bg-white border-stone-200 shadow-xs overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold text-stone-800 dark:text-stone-200">
            Daftar Harga Katalog Produk
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-50/75">
                <TableRow>
                  <TableHead className="w-[30%]">Produk</TableHead>
                  <TableHead className="w-[15%]">Kategori</TableHead>
                  <TableHead className="w-[15%] text-right">
                    Harga Dasar
                  </TableHead>
                  <TableHead className="w-[15%] text-center">
                    Wholesale Tiers
                  </TableHead>
                  <TableHead className="w-[15%]">Referensi Sumber</TableHead>
                  <TableHead className="w-[10%] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-stone-500 font-medium">
                      {error
                        ? `Gagal memuat: ${error}`
                        : "Tidak ada data produk ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const activeQuote = p.activeVendorPriceRecord;
                    const freightMode = p.activePriceFreightMode;
                    const thumbnail =
                      p.images?.find((img) => img.isFeatured) || p.images?.[0];

                    return (
                      <TableRow key={p.id} className="hover:bg-stone-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumbnail ? (
                              <img
                                src={thumbnail.url}
                                alt={p.name}
                                className="h-10 w-10 rounded-md object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-stone-100 dark:bg-stone-850 flex items-center justify-center border">
                                <Package className="h-5 w-5 text-stone-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-stone-900 text-sm">
                                {p.name}
                              </div>
                              <div className="text-xs text-stone-500 font-mono mt-0.5">
                                {p.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-600 text-sm">
                          {p.category?.name_id || p.category?.name || "N/A"}
                          {p.category?.name_en && (
                            <span className="block text-xs text-stone-400 italic font-normal mt-0.5">
                              {p.category.name_en}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-stone-900 font-bold text-sm">
                          Rp {Number(p.basePrice).toLocaleString("id-ID")}
                          {p.currencyCode && p.currencyCode !== "IDR" ? (
                            <span className="block text-[10px] text-stone-500 font-normal mt-0.5">
                              {p.currencyCode}{" "}
                              {Number(p.foreignPrice).toLocaleString("id-ID")}{" "}
                              (Kurs: Rp{" "}
                              {Number(p.exchangeRate).toLocaleString("id-ID")})
                            </span>
                          ) : (
                            <span className="block text-[10px] text-stone-400 font-normal mt-0.5">
                              IDR (Local Price)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.priceTiers && p.priceTiers.length > 0 ? (
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold text-xs">
                              {p.priceTiers.length} Tiers
                            </Badge>
                          ) : (
                            <span className="text-stone-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {activeQuote ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold text-[10px] w-fit">
                                {activeQuote.vendor?.companyName ||
                                  "Supplier Sourcing"}
                              </Badge>
                              <span className="text-[10px] text-stone-500 font-medium">
                                Mode:{" "}
                                {freightMode === "SEA"
                                  ? "🚢 Sea"
                                  : freightMode === "AIR"
                                    ? "✈️ Air"
                                    : "✏️ Custom"}
                              </span>
                            </div>
                          ) : (
                            <Badge className="bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-100 font-bold text-[10px] w-fit">
                              Manual / Custom
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenManageModal(p)}
                            className="border-stone-200 text-stone-700 font-semibold hover:bg-stone-50">
                            Kelola Harga
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === Pagination === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modal Dialog kelola */}
      {selectedProduct && (
        <ManagePriceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
