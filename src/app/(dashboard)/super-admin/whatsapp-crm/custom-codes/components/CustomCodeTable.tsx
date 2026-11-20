"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { CustomCodeItem } from "../types/customCode.type";

export type { CustomCodeItem };

interface CustomCodeTableProps {
  items: CustomCodeItem[];
  isLoading: boolean;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (item: CustomCodeItem) => void;
}

export function CustomCodeTable({
  items,
  isLoading,
  onToggleActive,
  onDelete,
  onEdit,
}: CustomCodeTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tautan berhasil disalin!");
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-400 bg-white rounded-lg border border-stone-200">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <p className="text-xs">Memuat daftar master kode...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center space-y-3 bg-white rounded-lg border border-stone-200">
        <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-stone-700">Belum Ada Master Kode</p>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Tambahkan kode pelacakan kampanye atau kode identitas CS pertama Anda untuk memulai tracking prospek.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-stone-50/80">
          <TableRow>
            <TableHead className="w-[180px] text-xs font-semibold text-stone-700">Kode Unik</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700">Label & Saluran Media</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700">Tipe & Konteks</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-center">Leads Terjaring</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-center">Status</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSource = item.type === "LEAD_SOURCE";
            const leadCount = item._count?.leads ?? 0;

            return (
              <TableRow key={item.id} className="hover:bg-stone-50/70 transition-colors">
                {/* Kode */}
                <TableCell className="font-mono text-xs font-bold text-stone-900">
                  <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                    {item.code}
                  </span>
                </TableCell>

                {/* Label & Saluran Media */}
                <TableCell className="text-xs text-stone-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-stone-900">{item.label}</span>
                    {item.channel && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200/80 px-1.5 py-0.2 rounded">
                        <Tag className="w-2.5 h-2.5 text-stone-500" />
                        <span>{item.channel}</span>
                      </span>
                    )}
                  </div>
                  {item.leadUrlRef && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-400">
                      <span className="truncate max-w-[280px] font-mono text-[10px]">
                        {item.leadUrlRef}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.leadUrlRef!)}
                        className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 text-[10px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin Link</span>
                      </button>
                    </div>
                  )}
                </TableCell>

                {/* Tipe & Konteks */}
                <TableCell className="text-xs">
                  {isSource ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[10px] font-medium">
                      <Link2 className="w-3 h-3" />
                      <span>Tracking Prospek Client</span>
                    </Badge>
                  ) : (
                    <div className="space-y-0.5">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-[10px] font-medium">
                        <UserCheck className="w-3 h-3" />
                        <span>Kode Identitas CS</span>
                      </Badge>
                      {item.assignedUser && (
                        <p className="text-[11px] text-stone-500">
                          CS: <span className="font-semibold text-stone-700">{item.assignedUser.name}</span>
                        </p>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Leads Terjaring (Klik untuk langsung filter di Inbox) */}
                <TableCell className="text-xs text-center font-semibold text-stone-800">
                  {isSource ? (
                    leadCount > 0 ? (
                      <Link
                        href={`/super-admin/whatsapp-crm?sourceCode=${encodeURIComponent(item.code)}`}
                        className="inline-flex items-center justify-center gap-1 min-w-[28px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs group"
                        title="Buka daftar leads untuk kode ini di Inbox CRM"
                      >
                        <span>{leadCount}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-stone-50 text-stone-400 text-xs font-normal border border-stone-200">
                        0
                      </span>
                    )
                  ) : (
                    <span className="text-stone-300">-</span>
                  )}
                </TableCell>

                {/* Status Aktif */}
                <TableCell className="text-xs text-center">
                  <button
                    type="button"
                    onClick={() => onToggleActive(item.id, item.isActive)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200"
                    }`}
                  >
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </TableCell>

                {/* Aksi */}
                <TableCell className="text-xs text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Shortcut View Leads di Inbox */}
                    {isSource && leadCount > 0 && (
                      <Link
                        href={`/super-admin/whatsapp-crm?sourceCode=${encodeURIComponent(item.code)}`}
                        title="Lihat leads terkait di Inbox CRM"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-stone-500 hover:text-emerald-600"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}

                    {/* Edit Master Kode */}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        title="Edit Master Kode"
                        className="h-7 w-7 p-0 text-stone-500 hover:text-blue-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Salin Tautan WhatsApp */}
                    {item.leadUrlRef && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.leadUrlRef!)}
                        title="Salin tautan click-to-chat WhatsApp"
                        className="h-7 w-7 p-0 text-stone-500 hover:text-emerald-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Nonaktifkan / Hapus */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      title="Nonaktifkan / Hapus Kode"
                      className="h-7 w-7 p-0 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
