import SampleHistorySummary from "./components/sampleHistorySummary";
import TableSampleHistory from "./components/tableSampleHistory";

export default function HistorySamplePage() {
  return (
    <main className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-auto w-full">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Sample History
        </h1>
        <p className="text-sm text-gray-500">
          Pantau ringkasan dan riwayat pergerakan produk sampel ke tangan klien.
        </p>
      </div>

      {/* 1. Komponen Ringkasan (Kotak-kotak angka) */}
      <SampleHistorySummary />

      {/* 2. Komponen Tabel Utama */}
      <TableSampleHistory />
    </main>
  );
}
