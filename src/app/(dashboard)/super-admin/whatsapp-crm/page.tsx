"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import {
  Inbox,
  Kanban,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EditLeadNameDialog } from "./components/EditLeadNameDialog";
import { CrmLeadItem, LeadCardItem } from "./components/LeadCardItem";
import { LinkCustomerDialog } from "./components/LinkCustomerDialog";

export default function WhatsAppCrmInboxPage() {
  const { fetchApi } = useApi();

  const [activeTab, setActiveTab] = useState<"all" | "me" | "unassigned">("all");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<CrmLeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal dialog states
  const [editingLead, setEditingLead] = useState<CrmLeadItem | null>(null);
  const [linkingLead, setLinkingLead] = useState<CrmLeadItem | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.append("assignedTo", activeTab);
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await fetchApi(`/crm/leads?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data leads");
      }
      const json = await res.json();
      setLeads(Array.isArray(json.items) ? json.items : []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data leads");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, fetchApi]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleUnlinkCustomer = async (leadId: string) => {
    if (!confirm("Lepaskan tautan pelanggan dari lead ini?")) return;

    try {
      const res = await fetchApi(`/crm/leads/${leadId}/unlink-customer`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal melepas tautan");
      toast.success("Tautan customer berhasil dilepas");
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/super-admin/whatsapp-crm/pipeline">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Sales Pipeline Kanban</span>
            </Button>
          </Link>

          <Link href="/super-admin/whatsapp-crm/custom-codes">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Kode & Setup</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads()}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Link href="/super-admin/wa-portal/live-chat">
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat Asli (Raw WA)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-900 text-white rounded-2xl p-6 shadow-sm border border-stone-800">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Inbox className="w-4 h-4" />
          <span>WhatsApp CRM Workspace</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Kotak Masuk Prospek & Manajemen Leads</h1>
        <p className="text-xs text-stone-300 max-w-2xl mt-1 leading-relaxed">
          Pusat pengelolaan pesan masuk prospek pelanggan terintegrasi. Identifikasi nama kontak cerdas (Combine Contact Name) serta sinkronkan riwayat pesanan dengan menautkan lead ke master pelanggan ERP Goenakan.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 bg-stone-100 p-1">
            <TabsTrigger value="all" className="text-xs px-3">
              Semua Leads
            </TabsTrigger>
            <TabsTrigger value="me" className="text-xs px-3">
              Chat Saya (Assigned to Me)
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="text-xs px-3 text-rose-700">
              Antrean Belum Diklaim
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor WA, atau perusahaan..."
            className="h-9 pl-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* Leads List Feed */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-stone-400 bg-white rounded-xl border border-stone-200">
            <p className="text-xs">Memuat antrean WhatsApp CRM...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-stone-400 bg-white rounded-xl border border-stone-200 gap-1.5">
            <Users className="w-8 h-8 text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">Tidak ada lead di filter ini</p>
            <p className="text-[11px] text-stone-400">
              {activeTab === "unassigned"
                ? "Bagus! Semua pesan prospek sudah dipegang oleh CS yang bertugas."
                : "Belum ada kontak prospek yang masuk atau cocok dengan pencarian."}
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCardItem
              key={lead.id}
              lead={lead}
              onEditName={(l) => setEditingLead(l)}
              onLinkCustomer={(l) => setLinkingLead(l)}
              onUnlinkCustomer={handleUnlinkCustomer}
            />
          ))
        )}
      </div>

      {/* Dialog: Edit Name */}
      <EditLeadNameDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        leadId={editingLead?.id || null}
        currentName={editingLead?.displayName || ""}
        onSuccess={fetchLeads}
      />

      {/* Dialog: Link to Customer ERP */}
      <LinkCustomerDialog
        open={!!linkingLead}
        onOpenChange={(open) => !open && setLinkingLead(null)}
        leadId={linkingLead?.id || null}
        leadPhone={linkingLead?.phoneNumber || ""}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
