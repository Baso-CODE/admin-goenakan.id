"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FinanceTransactionForm, {
  FinanceTransactionFormValues,
} from "../components/financeTransactionForm";

export default function AddFinanceTransactionPage() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  // State untuk form & data
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 1. FETCH KATEGORI & CURRENCY UNTUK DROPDOWN
  // ==========================================
  useEffect(() => {
    const fetchMasterData = async () => {
      // 🛑 Guard: Tunggu hingga status 'authenticated' agar fetchApi memiliki token
      if (status !== "authenticated") return;

      try {
        const [resCat, resCur] = await Promise.all([
          fetchApi("/finance/categories?isActive=true"),
          fetchApi("/currencies"),
        ]);

        if (!resCat.ok) {
          throw new Error("Gagal mengambil data kategori");
        }

        const catData = await resCat.json();

        // Ambil data currency (mencegah error jika API gagal)
        const curData = resCur.ok ? await resCur.json() : { data: [] };

        setCategories(catData.data || []);

        setCurrencies(curData.data || curData || []);
      } catch (error) {
        console.error("❌ Failed to load master data:", error);
        toast.error("Gagal memuat data master untuk form");
      } finally {
        setLoadingInit(false);
      }
    };

    fetchMasterData();
  }, [status, fetchApi]);

  // ==========================================
  // 2. HANDLE SUBMIT TRANSAKSI BARU
  // ==========================================
  const handleAddTransaction = async (data: FinanceTransactionFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/finance/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal mencatat transaksi");
      }

      toast.success("Transaksi keuangan berhasil dicatat!");
      router.push("/super-admin/finance");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Transaction error:", err);
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Catat Transaksi Baru
          </h2>
          <p className="text-sm text-muted-foreground">
            Masukkan detail pengeluaran atau pemasukan kas operasional.
          </p>
        </div>
      </div>

      {loadingInit ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            Memuat data formulir...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-6 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
          <h3 className="font-bold mb-1">Kategori Belum Tersedia!</h3>
          <p className="text-sm mb-4">
            Anda belum memiliki kategori keuangan yang aktif. Silakan buat
            kategori terlebih dahulu sebelum mencatat transaksi.
          </p>
          <Button
            onClick={() => router.push("/super-admin/finance/categories/add")}
            className="bg-orange-600 hover:bg-orange-700">
            Buat Kategori Sekarang
          </Button>
        </div>
      ) : (
        <FinanceTransactionForm
          categories={categories}
          currencies={currencies}
          setCurrencies={setCurrencies}
          onSubmit={handleAddTransaction}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
