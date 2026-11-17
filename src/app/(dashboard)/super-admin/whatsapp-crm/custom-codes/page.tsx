"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import {
  Download,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateCustomCodeDialog } from "./components/CreateCustomCodeDialog";
import { CustomCodeTable } from "./components/CustomCodeTable";
import { EditCustomCodeDialog } from "./components/EditCustomCodeDialog";
import { CustomCodeItem } from "./types/customCode.type";

export default function CustomCodesMasterPage() {
  const { fetchApi } = useApi();

  const [activeTab, setActiveTab] = useState<"ALL" | "LEAD_SOURCE" | "CS_AGENT_CODE">("ALL");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CustomCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomCodeItem | null>(null);

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

  // KPI Calculations
  const totalCodes = items.length;
  const activeCodes = items.filter((i) => i.isActive).length;
  const totalLeads = items.reduce((acc, i) => acc + (i._count?.leads || 0), 0);
  const topCampaign = items
    .filter((i) => i.type === "LEAD_SOURCE" && (i._count?.leads || 0) > 0)
    .sort((a, b) => (b._count?.leads || 0) - (a._count?.leads || 0))[0];
  const activeCsCodes = items.filter((i) => i.type === "CS_AGENT_CODE" && i.isActive).length;

  // Ekspor Laporan Kampanye ke CSV
  const handleExportCsv = () => {
    if (items.length === 0) {
      toast.error("Tidak ada data master kode untuk diekspor");
      return;
    }

    const headers = [
      "Kode Unik",
      "Label Deskripsi",
      "Tipe",
      "Saluran Media",
      "Leads Terjaring",
      "CS Penanggung Jawab",
      "Tautan WhatsApp",
      "Status",
      "Tanggal Dibuat",
    ];

    const rows = items.map((item) => {
      const isSource = item.type === "LEAD_SOURCE";
      const leadCount = item._count?.leads ?? 0;
      const typeLabel = isSource ? "Tracking Prospek Client" : "Kode Akses CS";
      const channel = item.channel || "-";
      const csName = item.assignedUser?.name
        ? `${item.assignedUser.name} (${item.assignedUser.email})`
        : "-";
      const waUrl = item.leadUrlRef || "-";
      const status = item.isActive ? "Aktif" : "Nonaktif";
      const date = new Date(item.createdAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      return [
        item.code,
        item.label,
        typeLabel,
        channel,
        leadCount.toString(),
        csName,
        waUrl,
        status,
        date,
      ];
    });

    const escapeCsv = (val: string) => {
      const clean = (val || "").toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvContent =
      "\uFEFF" +
      [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `master-kode-crm-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Laporan master kode berhasil diekspor ke CSV");
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
                Master Kode Pelacakan & Akses CS
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kelola kode pelacakan prospek client untuk tracking kampanye hulu-ke-hilir dan kode identitas penugasan CS.
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
              <Inbox className="w-3.5 h-3.5 text-stone-500" />
              <span>Kembali ke Inbox & Leads</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchCodes()}
            disabled={isLoading}
            className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Master Kode</span>
          </Button>
        </div>
      </div>

      {/* ── KPI & Performance Metric Cards (Point 2) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Codes */}
        <div className="p-3.5 bg-white rounded-lg border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Master Kode</span>
            <div className="p-1.5 rounded-md bg-stone-100 text-stone-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-stone-900">{totalCodes}</div>
          <p className="text-[11px] text-stone-400 font-medium">
            <span className="text-emerald-600 font-semibold">{activeCodes} aktif</span> dari keseluruhan
          </p>
        </div>

        {/* Card 2: Total Leads Attributed */}
        <div className="p-3.5 bg-white rounded-lg border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Leads Terjaring</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700">{totalLeads}</div>
          <p className="text-[11px] text-stone-400 font-medium">
            Prospek client via referral kode
          </p>
        </div>

        {/* Card 3: Top Performer */}
        <div className="p-3.5 bg-white rounded-lg border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Kampanye Teratas</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold font-mono text-stone-900 truncate">
            {topCampaign ? topCampaign.code : "Belum Ada"}
          </div>
          <p className="text-[11px] text-stone-400 font-medium truncate">
            {topCampaign
              ? `${topCampaign._count?.leads || 0} leads (${topCampaign.label})`
              : "Belum ada leads masuk"}
          </p>
        </div>

        {/* Card 4: Active CS Codes */}
        <div className="p-3.5 bg-white rounded-lg border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Kode CS Terhubung</span>
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-700">{activeCsCodes}</div>
          <p className="text-[11px] text-stone-400 font-medium">
            Akun identitas agen CS aktif
          </p>
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
              Tracking Client
            </TabsTrigger>
            <TabsTrigger value="CS_AGENT_CODE" className="text-xs px-3">
              Kode Akses CS
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, label, atau saluran..."
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
        onEdit={(item) => setEditingItem(item)}
      />

      {/* ── Create Dialog Form ── */}
      <CreateCustomCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCodes}
      />

      {/* ── Edit Dialog Form (Point 4) ── */}
      <EditCustomCodeDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={fetchCodes}
      />
    </div>
  );
}
