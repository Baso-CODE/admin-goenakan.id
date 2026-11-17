"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Kanban } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function PipelinePlaceholderPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Bar: Title & Primary Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Sales Pipeline Kanban
              </h1>
              <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                Tahap 3
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Papan Kanban visual untuk memantau pergerakan tahapan prospek dari penawaran harga hingga pesanan terbit di ERP.
            </p>
          </div>
        </div>

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
      </div>

      {/* ── Center Stage Placeholder Card ── */}
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white border border-stone-200 rounded-2xl shadow-sm max-w-xl mx-auto space-y-4 mt-6">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
          <Kanban className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-stone-900">
            Sales Pipeline Kanban (Tahap 3)
          </h2>
          <p className="text-xs text-stone-500 max-w-md leading-relaxed">
            Papan Kanban otomatis yang menghubungkan pergerakan prospek WhatsApp langsung ke status pesanan di ERP Goenakan (Penawaran, DP, SPK Sablon/Bordir, QC, hingga Pengiriman) akan aktif di Tahap 3.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dalam Antrean Pengembangan Tahap 3</span>
        </div>
      </div>
    </div>
  );
}
