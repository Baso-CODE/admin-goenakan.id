"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Edit3,
  ExternalLink,
  FileText,
  HandMetal,
  Link2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Tag,
  Unlink,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { CrmStatusConfigItem, DEFAULT_STATUS_FALLBACKS } from "../types/crmStatus.type";
import { QuickAddStatusDialog } from "./QuickAddStatusDialog";

export interface CrmLeadItem {
  id: string;
  phoneNumber: string;
  displayName?: string | null;
  waPushName?: string | null;
  customerProfileId?: string | null;
  customerProfile?: {
    id: string;
    accountType: "INDIVIDUAL" | "CORPORATE" | string;
    companyName?: string | null;
    picName?: string | null;
    phone?: string | null;
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  assignedToUserId?: string | null;
  assignedToUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  assignedAt?: string | null;
  assignmentMethod?: "MANUAL" | "CLAIM" | "STICKY_CUSTOMER" | "ROUND_ROBIN" | string | null;
  sourceCodeId?: string | null;
  sourceCode?: {
    id: string;
    code: string;
    label: string;
  } | null;
  status: string;
  statusConfig?: {
    id?: string;
    key: string;
    label: string;
    color: string;
    isWon?: boolean;
    isLost?: boolean;
  } | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  labels?: string[];
  notesCount?: number;
  createdAt: string;
  updatedAt: string;
  resolvedContact: {
    name: string;
    source: "DISPLAY_NAME" | "CUSTOMER_PROFILE" | "WA_PUSH_NAME" | "PHONE_NUMBER";
    formattedPhone: string;
  };
}

interface LeadCardItemProps {
  lead: CrmLeadItem;
  statuses?: CrmStatusConfigItem[];
  csUsers?: Array<{ id: string; name?: string | null; email?: string | null }>;
  onEditName: (lead: CrmLeadItem) => void;
  onLinkCustomer: (lead: CrmLeadItem) => void;
  onUnlinkCustomer: (leadId: string) => void;
  onOpenChat: (lead: CrmLeadItem) => void;
  onClaimLead?: (leadId: string) => void;
  onAssignLead?: (leadId: string, assignedToUserId: string | null) => void;
  onUpdateStatus?: (leadId: string, status: string) => void;
  onStatusCreated?: (newStatus: CrmStatusConfigItem, targetLeadId?: string | null) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string; dotColor: string }
> = {
  NEW: {
    label: "Baru",
    colorClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    dotColor: "bg-rose-500",
  },
  IN_PROGRESS: {
    label: "Follow Up",
    colorClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    dotColor: "bg-amber-500",
  },
  QUOTATION_SENT: {
    label: "Penawaran",
    colorClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    dotColor: "bg-blue-500",
  },
  WON: {
    label: "Closing / Deal",
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    dotColor: "bg-emerald-500",
  },
  LOST: {
    label: "Batal",
    colorClass: "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200",
    dotColor: "bg-stone-400",
  },
  CLOSED: {
    label: "Selesai",
    colorClass: "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200",
    dotColor: "bg-stone-400",
  },
};

export function LeadCardItem({
  lead,
  statuses,
  csUsers,
  onEditName,
  onLinkCustomer,
  onUnlinkCustomer,
  onOpenChat,
  onClaimLead,
  onAssignLead,
  onUpdateStatus,
  onStatusCreated,
}: LeadCardItemProps) {
  const [quickAddStatusOpen, setQuickAddStatusOpen] = useState(false);
  const [csSearchQuery, setCsSearchQuery] = useState("");
  const { name, source, formattedPhone } = lead.resolvedContact;
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  const isAssigned = !!lead.assignedToUserId;
  const isLinked = !!lead.customerProfileId;

  const filteredCsUsers = csUsers?.filter(
    (u) =>
      !csSearchQuery.trim() ||
      (u.name || "").toLowerCase().includes(csSearchQuery.trim().toLowerCase()) ||
      (u.email || "").toLowerCase().includes(csSearchQuery.trim().toLowerCase())
  ) || [];

  const statusMeta =
    lead.statusConfig ||
    statuses?.find((s) => s.key === lead.status) ||
    DEFAULT_STATUS_FALLBACKS[lead.status] || {
      label: lead.status,
      color: "#4b5563",
    };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      {/* ── Contact Profile & Info (Left Side: Profile, Name, Source, Number, REF, Labels, Last Message) ── */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Avatar className="w-11 h-11 border border-stone-200 shrink-0 bg-emerald-50 text-emerald-800 font-bold text-sm">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>

        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Main Resolved Name & Source Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 text-sm truncate">{name}</span>

            {lead.unreadCount && lead.unreadCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                {lead.unreadCount} baru
              </span>
            ) : null}

            {source === "DISPLAY_NAME" && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Nama Kustom CS
              </Badge>
            )}

            {source === "CUSTOMER_PROFILE" && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                <span>Customer ERP Terhubung</span>
              </Badge>
            )}

            {source === "WA_PUSH_NAME" && (
              <Badge variant="outline" className="text-[10px] bg-stone-100 text-stone-600 border-stone-200 font-mono">
                ~{lead.waPushName}
              </Badge>
            )}
          </div>

          {/* Phone Number & Tracking Campaign */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500">
            <span className="font-mono text-stone-600">{formattedPhone}</span>

            {lead.sourceCode && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                <span>REF: {lead.sourceCode.code}</span>
              </span>
            )}

            {/* Note count indicator */}
            {lead.notesCount && lead.notesCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
                <FileText className="w-2.5 h-2.5 text-stone-400" />
                <span>{lead.notesCount} catatan</span>
              </span>
            ) : null}
          </div>

          {/* Labels & Tags Pills */}
          {lead.labels && lead.labels.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {lead.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.2 rounded"
                >
                  <Tag className="w-2 h-2 text-emerald-600" />
                  <span>{lbl}</span>
                </span>
              ))}
            </div>
          )}

          {/* Last Message Snippet */}
          {lead.lastMessage && (
            <div className="pt-0.5 flex items-center gap-2 text-xs text-stone-600">
              <span className="text-stone-400 shrink-0 text-[11px]">💬</span>
              <p className="line-clamp-1 italic text-stone-500 text-[11px]">
                &quot;{lead.lastMessage}&quot;
              </p>
              {lead.lastMessageAt && (
                <span className="text-[10px] text-stone-400 shrink-0 ml-auto sm:ml-0 font-mono">
                  {new Date(lead.lastMessageAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Status, CS Assignment, & Action Buttons (Right Side) ── */}
      <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
        {/* Row 1: Status & CS Assignment / Klaim Leads */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {/* Quick Status Dropdown */}
          {onUpdateStatus ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs hover:opacity-90"
                  style={{
                    backgroundColor: `${statusMeta.color}15`,
                    color: statusMeta.color,
                    borderColor: `${statusMeta.color}40`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: statusMeta.color }}
                  />
                  <span>{statusMeta.label}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-[180px]">
                {statuses && statuses.length > 0 ? (
                  statuses.map((st) => (
                    <DropdownMenuItem
                      key={st.id}
                      onClick={() => onUpdateStatus(lead.id, st.key)}
                      className="flex items-center gap-2 cursor-pointer font-medium py-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: st.color }}
                      />
                      <span>{st.label}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  Object.entries(DEFAULT_STATUS_FALLBACKS).map(([k, v]) => (
                    <DropdownMenuItem
                      key={k}
                      onClick={() => onUpdateStatus(lead.id, k)}
                      className="flex items-center gap-2 cursor-pointer font-medium py-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                      <span>{v.label}</span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setQuickAddStatusOpen(true)}
                  className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Tambah Status Baru</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold shadow-2xs"
              style={{
                backgroundColor: `${statusMeta.color}15`,
                color: statusMeta.color,
                borderColor: `${statusMeta.color}40`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusMeta.color }}
              />
              <span>{statusMeta.label}</span>
            </span>
          )}

          {/* Status Penugasan (Interactive Dropdown Reassign & Klaim Leads) */}
          {isAssigned ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/90 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="Klik untuk mengubah penugasan CS"
                >
                  <UserCheck className="w-2.5 h-2.5 text-blue-600" />
                  <span>Ditangani: <strong>{lead.assignedToUser?.name || "CS"}</strong></span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 text-xs p-1">
                {/* Search input for CS */}
                <div className="p-1 pb-1.5 border-b border-stone-100">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={csSearchQuery}
                      onChange={(e) => setCsSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Cari nama CS..."
                      className="w-full pl-6 pr-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-stone-400 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                {onClaimLead && (
                  <DropdownMenuItem
                    onClick={() => onClaimLead(lead.id)}
                    className="flex items-center gap-2 text-xs text-emerald-700 font-medium cursor-pointer py-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Klaim Leads</span>
                  </DropdownMenuItem>
                )}

                <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Pilih CS Pengganti:
                </div>

                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {filteredCsUsers.length > 0 ? (
                    filteredCsUsers.map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => onAssignLead?.(lead.id, user.id)}
                        className={`flex items-center justify-between text-xs cursor-pointer py-1.5 ${
                          lead.assignedToUserId === user.id ? "bg-stone-100 font-bold text-stone-900" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{user.name || user.email}</span>
                        </div>
                        {lead.assignedToUserId === user.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-[11px] text-stone-400 italic text-center">
                      CS tidak ditemukan
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAssignLead?.(lead.id, null)}
                  className="flex items-center gap-2 text-xs text-rose-600 font-medium cursor-pointer py-1.5"
                >
                  <UserX className="w-3.5 h-3.5 shrink-0" />
                  <span>Lepas Leads</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              {/* 1-Click Klaim Leads */}
              {onClaimLead ? (
                <button
                  type="button"
                  onClick={() => onClaimLead(lead.id)}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  title="1-Klik klaim prospek ini ke akun Anda"
                >
                  <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                  <span>Klaim Leads</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-medium">
                  Belum Diklaim
                </span>
              )}

              {/* Direct Assign to other CS */}
              {onAssignLead && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                      title="Tugaskan ke CS spesifik"
                    >
                      <UserPlus className="w-2.5 h-2.5 text-rose-600" />
                      <span>Tugaskan CS</span>
                      <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 text-xs p-1">
                    {/* Search input for CS */}
                    <div className="p-1 pb-1.5 border-b border-stone-100">
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          value={csSearchQuery}
                          onChange={(e) => setCsSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Cari nama CS..."
                          className="w-full pl-6 pr-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-stone-400 placeholder:text-stone-400"
                        />
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Tugaskan Prospek ke CS
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                      {filteredCsUsers.length > 0 ? (
                        filteredCsUsers.map((user) => (
                          <DropdownMenuItem
                            key={user.id}
                            onClick={() => onAssignLead(lead.id, user.id)}
                            className="flex items-center gap-2 text-xs cursor-pointer py-1.5"
                          >
                            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{user.name || user.email}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-[11px] text-stone-400 italic text-center">
                          CS tidak ditemukan
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditName(lead)}
            className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Nama</span>
          </Button>

          {isLinked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUnlinkCustomer(lead.id)}
              title="Putuskan tautan profil customer"
              className="h-8 px-2.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 gap-1"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Lepas Tautan</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onLinkCustomer(lead)}
              className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Hubungkan ERP</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChat(lead)}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Buka Chat</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Status Dialog directly from card */}
      <QuickAddStatusDialog
        open={quickAddStatusOpen}
        onOpenChange={setQuickAddStatusOpen}
        targetLeadId={lead.id}
        targetLeadName={name}
        onStatusCreated={(newStatus, targetLeadId) => {
          onStatusCreated?.(newStatus, targetLeadId);
          if (targetLeadId) {
            onUpdateStatus?.(targetLeadId, newStatus.key);
          }
        }}
      />
    </div>
  );
}
