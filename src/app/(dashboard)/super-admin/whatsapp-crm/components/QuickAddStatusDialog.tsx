"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { Kanban, Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { CrmStatusConfigItem, PRESET_STATUS_COLORS } from "../types/crmStatus.type";

interface QuickAddStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetLeadId?: string | null;
  targetLeadName?: string | null;
  onStatusCreated: (newStatus: CrmStatusConfigItem, targetLeadId?: string | null) => void;
}

export function QuickAddStatusDialog({
  open,
  onOpenChange,
  targetLeadId,
  targetLeadName,
  onStatusCreated,
}: QuickAddStatusDialogProps) {
  const { fetchApi } = useApi();

  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate key helper
  const generateKey = (text: string) => {
    return text
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const previewKey = generateKey(label);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Nama status tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi("/crm/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          key: previewKey || undefined,
          color,
          isWon,
          isLost,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat status baru");
      }

      const createdStatus: CrmStatusConfigItem = json.data;
      toast.success(
        targetLeadId
          ? `Status "${createdStatus.label}" berhasil dibuat dan diterapkan!`
          : `Status "${createdStatus.label}" berhasil dibuat!`
      );

      // Reset form
      setLabel("");
      setColor("#2563eb");
      setIsWon(false);
      setIsLost(false);
      onOpenChange(false);

      // Notify caller
      onStatusCreated(createdStatus, targetLeadId);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membuat status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Kanban className="w-4 h-4 text-emerald-600" />
            <span>Tambah Status Prospek Langsung</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            {targetLeadId ? (
              <span>
                Buat tahapan status baru dan langsung terapkan ke prospek{" "}
                <strong className="text-stone-800">{targetLeadName || "ini"}</strong>.
              </span>
            ) : (
              <span>Buat tahapan status prospek baru secara instan tanpa perlu berpindah halaman.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nama Status */}
          <div className="space-y-1.5">
            <Label htmlFor="quick-status-label" className="text-xs font-semibold text-stone-700">
              Nama Status <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="quick-status-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Negosiasi Harga, Tunggu Sampel..."
              required
              autoFocus
              className="text-xs"
            />
            {previewKey && (
              <p className="text-[10px] text-stone-400 font-mono">
                Key internal: <span className="text-stone-600 font-semibold">{previewKey}</span>
              </p>
            )}
          </div>

          {/* Warna Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-stone-700">Warna Indikator</Label>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-[11px] text-stone-500">{color}</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {PRESET_STATUS_COLORS.map((p) => {
                const isSelected = color.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setColor(p.hex)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-stone-900 bg-stone-100 ring-1 ring-stone-900 font-bold"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="truncate">{p.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded border border-stone-300 p-0.5 cursor-pointer"
                title="Pilih warna custom"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#2563eb"
                className="text-xs font-mono h-7 flex-1"
              />
            </div>
          </div>

          {/* Won / Lost Checkboxes */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quick-status-won"
                checked={isWon}
                onCheckedChange={(checked) => {
                  setIsWon(!!checked);
                  if (checked) setIsLost(false);
                }}
              />
              <Label
                htmlFor="quick-status-won"
                className="text-xs font-medium text-stone-700 cursor-pointer"
              >
                Tandai sebagai Deal / Penjualan Berhasil (Won)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="quick-status-lost"
                checked={isLost}
                onCheckedChange={(checked) => {
                  setIsLost(!!checked);
                  if (checked) setIsWon(false);
                }}
              />
              <Label
                htmlFor="quick-status-lost"
                className="text-xs font-medium text-stone-700 cursor-pointer"
              >
                Tandai sebagai Batal / Lost
              </Label>
            </div>
          </div>

          {/* Pratinjau Badge */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Pratinjau Badge:</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border shadow-2xs"
              style={{
                backgroundColor: `${color}15`,
                color: color,
                borderColor: `${color}40`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span>{label || "Nama Status"}</span>
            </span>
          </div>

          <DialogFooter className="pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{targetLeadId ? "Simpan & Terapkan" : "Simpan Status"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
