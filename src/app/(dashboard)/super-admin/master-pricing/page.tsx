"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/utils/formatCurrency";
import { FileText, Layers, RefreshCw, Search } from "lucide-react";
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
  category?: {
    name?: string;
  };
  activeVendorPriceRecordId?: string | null;
  activePriceFreightMode?: string | null;
  activeVendorPriceRecord?: VendorPriceRecord | null;
  vendorPrices?: VendorPriceRecord[];
  priceTiers?: PriceTier[];
  foreignPrice?: number | string | null;
  currencyCode?: string | null;
  exchangeRate?: number | string | null;
  additionalFee?: number | string | null;
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
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const fetchCategories = async () => {
    try {
      const res = await fetchApi("/product-categories/list");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

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
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

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
            Pusat kelola dan sinkronisasi harga katalog produk berdasarkan kalkulator COGS supplier.
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name_id || c.name || "Kategori"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
                  <TableHead className="w-[15%] text-right">Harga Dasar</TableHead>
                  <TableHead className="w-[15%] text-center">Wholesale Tiers</TableHead>
                  <TableHead className="w-[15%]">Referensi Sumber</TableHead>
                  <TableHead className="w-[10%] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-stone-500 font-medium">
                      {error ? `Gagal memuat: ${error}` : "Tidak ada data produk ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const activeQuote = p.activeVendorPriceRecord;
                    const freightMode = p.activePriceFreightMode;

                    return (
                      <TableRow key={p.id} className="hover:bg-stone-50/50">
                        <TableCell>
                          <div className="font-semibold text-stone-900 text-sm">{p.name}</div>
                          <div className="text-xs text-stone-500 font-mono mt-0.5">{p.sku}</div>
                        </TableCell>
                        <TableCell className="text-stone-600 text-sm">
                          {p.category?.name || "-"}
                        </TableCell>
                        <TableCell className="text-right text-stone-900 font-bold text-sm">
                          Rp {Number(p.basePrice).toLocaleString("id-ID")}
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
                                {activeQuote.vendor?.companyName || "Supplier Sourcing"}
                              </Badge>
                              <span className="text-[10px] text-stone-500 font-medium">
                                Mode: {freightMode === "SEA" ? "🚢 Sea" : freightMode === "AIR" ? "✈️ Air" : "✏️ Custom"}
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
