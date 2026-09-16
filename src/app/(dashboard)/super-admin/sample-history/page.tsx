"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SampleHistorySummary from "./components/sampleHistorySummary";
import TableProductSample from "./components/tableProductSample";
import TableSampleHistory from "./components/tableSampleHistory";

export default function HistorySamplePage() {
  const [activeTab, setActiveTab] = useState("produk");

  return (
    <main className=" space-y-6  min-h-auto w-full">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Manajemen Sampel
        </h1>
        <p className="text-sm text-gray-500">
          Pantau daftar produk sampel dan riwayat pergerakannya ke tangan klien.
        </p>
      </div>

      {/* Kontainer Utama Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigasi Tab */}
        <TabsList className="grid w-full md:w-100 grid-cols-2 mb-6">
          <TabsTrigger value="produk">Daftar Produk</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Transaksi</TabsTrigger>
        </TabsList>

        {/* TAB 1: Daftar Produk Sampel */}
        {/* forceMount & hidden menjaga tabel tidak re-render/fetch ulang saat pindah tab */}
        <TabsContent
          value="produk"
          forceMount={true}
          hidden={activeTab !== "produk"}>
          <TableProductSample />
        </TabsContent>

        {/* TAB 2: Riwayat Keseluruhan & Ringkasan */}
        <TabsContent
          value="riwayat"
          forceMount={true}
          hidden={activeTab !== "riwayat"}
          className="space-y-6">
          {/* Komponen Ringkasan (Kotak-kotak angka) */}
          <SampleHistorySummary />

          {/* Komponen Tabel Riwayat Transaksi */}
          <TableSampleHistory />
        </TabsContent>
      </Tabs>
    </main>
  );
}
