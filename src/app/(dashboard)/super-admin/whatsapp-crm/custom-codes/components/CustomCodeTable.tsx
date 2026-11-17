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
import { Copy, ExternalLink, Link2, Trash2, UserCheck } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export interface CustomCodeItem {
  id: string;
  code: string;
  label: string;
  type: "LEAD_SOURCE" | "CS_AGENT_CODE";
  leadUrlRef?: string | null;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    leads: number;
  };
}

interface CustomCodeTableProps {
  items: CustomCodeItem[];
  isLoading: boolean;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function CustomCodeTable({
  items,
  isLoading,
  onToggleActive,
  onDelete,
}: CustomCodeTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tautan berhasil disalin!");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-400 bg-white rounded-xl border border-stone-200">
        <p className="text-xs">Memuat daftar master kode...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-400 bg-white rounded-xl border border-stone-200 gap-1">
        <p className="text-xs font-medium text-stone-600">Belum ada kode kustom terdaftar.</p>
        <p className="text-[11px]">Silakan klik tombol "Tambah Master Kode" di atas untuk memulai.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-stone-50">
          <TableRow>
            <TableHead className="w-[180px] text-xs font-semibold text-stone-700">Kode Unik</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700">Label Deskripsi</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700">Tipe & Konteks</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-center">Leads Terjaring</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-center">Status</TableHead>
            <TableHead className="text-xs font-semibold text-stone-700 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSource = item.type === "LEAD_SOURCE";

            return (
              <TableRow key={item.id} className="hover:bg-stone-50/70 transition-colors">
                {/* Kode */}
                <TableCell className="font-mono text-xs font-bold text-stone-900">
                  <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                    {item.code}
                  </span>
                </TableCell>

                {/* Label */}
                <TableCell className="text-xs text-stone-800">
                  <p className="font-medium">{item.label}</p>
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

                {/* Leads Terjaring */}
                <TableCell className="text-xs text-center font-semibold text-stone-800">
                  {isSource ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      {item._count?.leads ?? 0}
                    </span>
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
