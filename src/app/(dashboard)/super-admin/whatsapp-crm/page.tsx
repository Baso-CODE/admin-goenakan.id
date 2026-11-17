"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import {
  DownloadCloud,
  Filter,
  Inbox,
  Kanban,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sliders,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CrmChatDrawer } from "./components/CrmChatDrawer";
import { EditLeadNameDialog } from "./components/EditLeadNameDialog";
import { CrmLeadItem, LeadCardItem } from "./components/LeadCardItem";
import { LinkCustomerDialog } from "./components/LinkCustomerDialog";
import { CrmStatusConfigItem, DEFAULT_STATUS_FALLBACKS } from "./types/crmStatus.type";

export default function WhatsAppCrmInboxPage() {
  const { fetchApi } = useApi();

  const [activeTab, setActiveTab] = useState<"all" | "me" | "unassigned">("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<CrmLeadItem[]>([]);
  const [statuses, setStatuses] = useState<CrmStatusConfigItem[]>([]);
  const [csUsers, setCsUsers] = useState<Array<{ id: string; name?: string | null; email?: string | null }>>([]);
  const [receiverSessionId, setReceiverSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal & Drawer states
  const [editingLead, setEditingLead] = useState<CrmLeadItem | null>(null);
  const [linkingLead, setLinkingLead] = useState<CrmLeadItem | null>(null);
  const [activeChatLead, setActiveChatLead] = useState<CrmLeadItem | null>(null);

  // Load dynamic lead statuses
  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetchApi("/crm/statuses");
      if (res.ok) {
        const json = await res.json();
        setStatuses(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // ignore
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Load active receiver session ID once
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sRes = await fetchApi("/crm/settings");
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.data?.leadReceiverSessionId) {
            setReceiverSessionId(sJson.data.leadReceiverSessionId);
            return;
          }
        }
        // Fallback: fetch from /api/wa/sessions
        const sessRes = await fetch("/api/wa/sessions");
        if (sessRes.ok) {
          const sessJson = await sessRes.json();
          const items = Array.isArray(sessJson) ? sessJson : sessJson?.data || [];
          const working = items.find((s: any) => s.status === "WORKING") || items[0];
          if (working?.id) {
            setReceiverSessionId(working.id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadSession();
  }, [fetchApi]);

  // Load CS Users list once
  const fetchCsUsers = useCallback(async () => {
    try {
      const res = await fetchApi("/crm/leads/cs-users");
      if (res.ok) {
        const json = await res.json();
        setCsUsers(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // ignore
    }
  }, [fetchApi]);

  // Fetch leads list (without activeChatLead in dependencies!)
  const fetchLeads = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const params = new URLSearchParams();
        if (activeTab !== "all") {
          params.append("assignedTo", activeTab);
        }
        if (statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }
        if (search.trim()) {
          params.append("search", search.trim());
        }

        const res = await fetchApi(`/crm/leads?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data leads");
        }
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        setLeads(items);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat data leads");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [activeTab, statusFilter, search, fetchApi]
  );

  useEffect(() => {
    fetchCsUsers();
  }, [fetchCsUsers]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // In-place local state updater: updates a specific lead without full page refresh
  const handleUpdateLeadLocal = useCallback(
    (updated: Partial<CrmLeadItem> & { id: string }) => {
      setLeads((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
      setActiveChatLead((prev) =>
        prev && prev.id === updated.id ? { ...prev, ...updated } : prev
      );
    },
    []
  );

  const handleUnlinkCustomer = async (leadId: string) => {
    if (!confirm("Lepaskan tautan pelanggan dari lead ini?")) return;

    try {
      const res = await fetchApi(`/crm/leads/${leadId}/unlink-customer`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal melepas tautan");
      toast.success("Tautan customer berhasil dilepas");
      handleUpdateLeadLocal({ id: leadId, customerProfileId: null, customerProfile: null });
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleClaimLead = async (leadId: string) => {
    try {
      const res = await fetchApi(`/crm/leads/${leadId}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengklaim lead");
      const json = await res.json();
      toast.success("Lead berhasil diklaim ke akun Anda!");
      if (json.data) {
        handleUpdateLeadLocal(json.data);
      } else {
        fetchLeads(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengklaim lead");
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    // Optimistic update for 0ms visual feedback
    handleUpdateLeadLocal({ id: leadId, status: status as any });
    try {
      const res = await fetchApi(`/crm/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      toast.success("Status lead berhasil diubah!");
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status");
      fetchLeads(true);
    }
  };

  const handleAssignLead = async (leadId: string, assignedToUserId: string | null) => {
    const targetUser = csUsers.find((u) => u.id === assignedToUserId);
    // Optimistic local update
    handleUpdateLeadLocal({
      id: leadId,
      assignedToUserId,
      assignedToUser: targetUser || null,
      assignmentMethod: assignedToUserId ? "MANUAL" : "CLAIM",
    });

    try {
      const res = await fetchApi(`/crm/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToUserId }),
      });
      if (!res.ok) throw new Error("Gagal mengubah penugasan lead");
      toast.success(
        assignedToUserId
          ? `Lead berhasil ditugaskan ke ${targetUser?.name || "CS"}!`
          : "Penugasan lead dilepas (kembali ke antrean)!"
      );
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah penugasan");
      fetchLeads(true);
    }
  };

  const handleSyncWa = async () => {
    try {
      setIsSyncing(true);
      // Mode 1: Backend direct sync via configured WA receiver session
      const res = await fetchApi("/crm/leads/sync-from-wa", {
        method: "POST",
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || "Sinkronisasi leads berhasil!");
        fetchLeads(true);
        return;
      }

      // Mode 2: Client proxy fallback (if direct backend outbound is not configured yet)
      const chatsUrl = receiverSessionId
        ? `/api/wa/chats?sessionId=${encodeURIComponent(receiverSessionId)}&limit=100`
        : `/api/wa/chats?limit=100`;

      const chatsRes = await fetch(chatsUrl);
      if (!chatsRes.ok) {
        throw new Error("Gagal mengambil percakapan dari WhatsApp");
      }
      const chatsJson = await chatsRes.json();
      const chats = Array.isArray(chatsJson) ? chatsJson : chatsJson.data || [];

      const batchRes = await fetchApi("/crm/leads/batch-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chats }),
      });

      if (batchRes.ok) {
        const batchJson = await batchRes.json();
        toast.success(batchJson.message || "Leads berhasil disinkronkan!");
        fetchLeads(true);
      } else {
        throw new Error("Gagal memproses data leads ke database");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi data dari WhatsApp");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Bar: Title & Primary Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                WhatsApp CRM — Inbox & Leads
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kelola prospek masuk, identifikasi nama kontak cerdas (Combine Contact Name), dan sinkronkan data customer ERP.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href="/super-admin/whatsapp-crm/pipeline">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <Kanban className="w-3.5 h-3.5 text-stone-500" />
              <span>Sales Pipeline</span>
            </Button>
          </Link>

          <Link href="/super-admin/whatsapp-crm/custom-codes">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Master Kode</span>
            </Button>
          </Link>

          <Link href="/super-admin/whatsapp-crm/settings">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pengaturan CRM</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncWa}
            disabled={isSyncing}
            className="h-8 px-2.5 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            title="Tarik chat terbaru dari sesi WhatsApp aktif"
          >
            <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? "animate-bounce" : ""}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Tarik Pesan WA"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads()}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* ── Filter Controls & Search ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Tabs: Filter Penugasan */}
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-9 bg-stone-100 p-1 border border-stone-200">
              <TabsTrigger value="all" className="text-xs px-3">
                Semua Leads
              </TabsTrigger>
              <TabsTrigger value="me" className="text-xs px-3">
                Chat Saya
              </TabsTrigger>
              <TabsTrigger value="unassigned" className="text-xs px-3 text-rose-700 font-medium">
                Antrean Belum Diklaim
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Status Prospek & Kelola Shortcut */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                <SelectTrigger className="h-9 text-xs bg-white border-stone-200">
                  <SelectValue placeholder="Filter Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    Semua Status Prospek
                  </SelectItem>
                  {statuses.length > 0
                    ? statuses.map((st) => (
                        <SelectItem key={st.id} value={st.key} className="text-xs font-medium py-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: st.color }}
                            />
                            <span>{st.label}</span>
                          </div>
                        </SelectItem>
                      ))
                    : Object.entries(DEFAULT_STATUS_FALLBACKS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs font-medium py-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: v.color }}
                            />
                            <span>{v.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <Link href="/super-admin/whatsapp-crm/settings?tab=statuses">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs text-stone-600 hover:text-stone-900 border-stone-200 hover:bg-stone-50 gap-1.5 shrink-0"
                title="Kelola & Atur Tahapan Status Prospek"
              >
                <Kanban className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Kelola Status</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor WA, atau perusahaan..."
            className="h-9 pl-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* ── Leads List Feed ── */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-stone-400 bg-white rounded-xl border border-stone-200">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs">Memuat antrean WhatsApp CRM...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-stone-400 bg-white rounded-xl border border-stone-200 gap-1.5">
            <Users className="w-8 h-8 text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">Tidak ada lead di filter ini</p>
            <p className="text-[11px] text-stone-400">
              {activeTab === "unassigned"
                ? "Semua pesan prospek sudah dipegang oleh CS yang bertugas."
                : "Belum ada kontak prospek yang masuk atau cocok dengan filter dan kata kunci pencarian."}
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCardItem
              key={lead.id}
              lead={lead}
              statuses={statuses}
              csUsers={csUsers}
              onEditName={(l) => setEditingLead(l)}
              onLinkCustomer={(l) => setLinkingLead(l)}
              onUnlinkCustomer={handleUnlinkCustomer}
              onOpenChat={(l) => setActiveChatLead(l)}
              onClaimLead={handleClaimLead}
              onAssignLead={handleAssignLead}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </div>

      {/* In-App Chat Drawer */}
      <CrmChatDrawer
        lead={activeChatLead}
        open={!!activeChatLead}
        sessionId={receiverSessionId}
        onClose={() => setActiveChatLead(null)}
        onLeadUpdated={handleUpdateLeadLocal}
        csUsers={csUsers}
        statuses={statuses}
      />

      {/* Dialog: Edit Name */}
      <EditLeadNameDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        leadId={editingLead?.id || null}
        currentName={editingLead?.displayName || ""}
        onSuccess={() => fetchLeads(true)}
      />

      {/* Dialog: Link to Customer ERP */}
      <LinkCustomerDialog
        open={!!linkingLead}
        onOpenChange={(open) => !open && setLinkingLead(null)}
        leadId={linkingLead?.id || null}
        leadPhone={linkingLead?.phoneNumber || ""}
        onSuccess={() => fetchLeads(true)}
      />
    </div>
  );
}
