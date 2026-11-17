"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft, Plus, RefreshCw, Search, Settings2, Sparkles } from "lucide-react";
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
    <div className="space-y-6 pb-12">
      {/* ── Top Bar: Title & Primary Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Master Kode Prospek & Akses CS
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Dynamic Master
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kelola kode pelacakan prospek client (Opsi A) untuk tracking hulu-ke-hilir dan kode identitas CS (Opsi B) untuk otentikasi penanganan lead.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

      {/* ── Filter Controls & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 bg-stone-100 p-1 border border-stone-200">
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

      {/* ── Data Table ── */}
      <CustomCodeTable
        items={items}
        isLoading={isLoading}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      {/* ── Dialog Form ── */}
      <CreateCustomCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCodes}
      />
    </div>
  );
}
