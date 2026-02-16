"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FinanceTransactionForm, {
  FinanceTransactionFormValues,
} from "../components/financeTransactionForm";

export default function AddFinanceTransactionPage() {
  const router = useRouter();

  // State untuk form & data
  const [categories, setCategories] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 1. FETCH KATEGORI UNTUK DROPDOWN
  // ==========================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Ambil hanya kategori yang berstatus AKTIF saja
        const res = await fetch(`${apiUrl}/finance/categories?isActive=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data kategori");

        const result = await res.json();
        // Pastikan format dari API sesuai (result.data adalah array kategori)
        setCategories(result.data || []);
      } catch (error) {
        toast.error("Gagal memuat list kategori untuk form");
      } finally {
        setLoadingInit(false);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================
  // 2. HANDLE SUBMIT TRANSAKSI BARU
  // ==========================================
  const handleAddTransaction = async (data: FinanceTransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Tembak API POST
      const res = await fetch(`${apiUrl}/finance/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Gagal mencatat transaksi");
      }

      toast.success("Transaksi keuangan berhasil dicatat!");
      router.push("/super-admin/finance"); // Kembali ke halaman utama Buku Kas
      router.refresh();
    } catch (err: any) {
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

      {/* Tampilkan Loading Spinner jika kategori belum selesai diambil */}
      {loadingInit ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            Memuat data kategori...
          </p>
        </div>
      ) : categories.length === 0 ? (
        // Peringatan jika belum ada kategori sama sekali
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
          onSubmit={handleAddTransaction}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
