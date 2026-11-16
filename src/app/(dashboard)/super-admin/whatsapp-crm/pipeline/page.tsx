"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Kanban, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function PipelinePlaceholderPage() {
  return (
    <div className="space-y-4 pb-12">
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

      <div className="flex flex-col items-center justify-center p-16 text-center bg-white border border-stone-200 rounded-2xl shadow-sm max-w-xl mx-auto space-y-4 mt-8">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dalam Antrean Pengembangan Tahap 3</span>
        </div>
      </div>
    </div>
  );
}
