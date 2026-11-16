"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateCustomCodeDialog } from "./components/CreateCustomCodeDialog";
import { CustomCodeItem, CustomCodeTable } from "./components/CustomCodeTable";

export default function CustomCodesMasterPage() {
  const { fetchApi } = useApi();

  const [activeTab, setActiveTab] = useState<"ALL" | "LEAD_SOURCE" | "CS_AGENT_CODE">("ALL");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CustomCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        params.append("type", activeTab);
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await fetchApi(`/crm/custom-codes?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data master kode");
      }
      const json = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat master kode");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, fetchApi]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetchApi(`/crm/custom-codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      toast.success("Status kode berhasil diperbarui");
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan kode ini?")) return;
    try {
      const res = await fetchApi(`/crm/custom-codes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus kode");
      toast.success("Kode kustom berhasil dinonaktifkan");
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/super-admin/whatsapp-crm">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Inbox & Leads</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCodes()}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Master Kode</span>
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-900 text-white rounded-2xl p-6 shadow-sm border border-stone-800">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Dynamic Custom Code Master Menu</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Master Kode Prospek & Akses CS</h1>
        <p className="text-xs text-stone-300 max-w-2xl mt-1 leading-relaxed">
          Kelola kode pelacakan prospek client (Opsi A) yang disematkan di tombol WhatsApp website/iklan untuk tracking hulu-ke-hilir, serta kode identitas CS (Opsi B) untuk otentikasi penanganan lead.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 bg-stone-100 p-1">
            <TabsTrigger value="ALL" className="text-xs px-3">
              Semua Kode
            </TabsTrigger>
            <TabsTrigger value="LEAD_SOURCE" className="text-xs px-3">
              🎯 Tracking Client (Opsi A)
            </TabsTrigger>
            <TabsTrigger value="CS_AGENT_CODE" className="text-xs px-3">
              🛡️ Kode Akses CS (Opsi B)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau label..."
            className="h-9 pl-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <CustomCodeTable
        items={items}
        isLoading={isLoading}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      {/* Dialog Form */}
      <CreateCustomCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCodes}
      />
    </div>
  );
}
