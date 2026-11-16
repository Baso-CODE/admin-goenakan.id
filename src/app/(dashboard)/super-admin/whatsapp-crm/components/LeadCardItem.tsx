"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  Edit3,
  ExternalLink,
  Link2,
  MessageSquare,
  Sparkles,
  Unlink,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";

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
  assignmentMethod: "MANUAL" | "CLAIM" | "STICKY_CUSTOMER" | "ROUND_ROBIN";
  sourceCodeId?: string | null;
  sourceCode?: {
    id: string;
    code: string;
    label: string;
  } | null;
  status: "NEW" | "IN_PROGRESS" | "CLOSED";
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
  onEditName: (lead: CrmLeadItem) => void;
  onLinkCustomer: (lead: CrmLeadItem) => void;
  onUnlinkCustomer: (leadId: string) => void;
}

export function LeadCardItem({
  lead,
  onEditName,
  onLinkCustomer,
  onUnlinkCustomer,
}: LeadCardItemProps) {
  const { name, source, formattedPhone } = lead.resolvedContact;
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  const isAssigned = !!lead.assignedToUserId;
  const isLinked = !!lead.customerProfileId;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Contact Profile & Info */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Avatar className="w-11 h-11 border border-stone-200 shrink-0 bg-emerald-50 text-emerald-800 font-bold text-sm">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>

        <div className="space-y-1 min-w-0 flex-1">
          {/* Main Resolved Name & Source Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 text-sm truncate">{name}</span>

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

            {/* Status Penugasan */}
            {isAssigned ? (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                <UserCheck className="w-2.5 h-2.5" />
                <span>Ditangani: <strong>{lead.assignedToUser?.name || "CS"}</strong></span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-medium">
                Belum Diklaim (Antrean)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
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

        <Link href="/super-admin/wa-portal/live-chat">
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Buka Chat</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
