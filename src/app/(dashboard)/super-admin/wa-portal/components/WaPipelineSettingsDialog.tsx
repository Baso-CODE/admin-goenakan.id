"use client";

import React, { useEffect, useState } from "react";
import { WaLabel, WaPipelineStage } from "@/types/waPortal.type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Flag,
  Loader2,
  Plus,
  Settings2,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface WaPipelineSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onStagesChanged: () => void;
  onLabelsChanged: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export const WaPipelineSettingsDialog: React.FC<WaPipelineSettingsDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  onStagesChanged,
  onLabelsChanged,
}) => {
  const [stages, setStages] = useState<WaPipelineStage[]>([]);
  const [labels, setLabels] = useState<WaLabel[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // New stage form state
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState(PRESET_COLORS[0]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [isSubmittingStage, setIsSubmittingStage] = useState(false);

  // New label form state
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);

  const fetchStages = async () => {
    try {
      setIsLoadingStages(true);
      const url = sessionId
        ? `/api/wa/pipeline/stages?sessionId=${encodeURIComponent(sessionId)}`
        : `/api/wa/pipeline/stages`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil daftar stage");
      const data = await res.json();
      if (data?.success && Array.isArray(data.stages)) {
        setStages(data.stages);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat stages");
    } finally {
      setIsLoadingStages(false);
    }
  };

  const fetchLabels = async () => {
    try {
      setIsLoadingLabels(true);
      const url = sessionId
        ? `/api/wa/labels?sessionId=${encodeURIComponent(sessionId)}`
        : `/api/wa/labels`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil daftar label");
      const data = await res.json();
      if (data?.success && Array.isArray(data.labels)) {
        setLabels(data.labels);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat labels");
    } finally {
      setIsLoadingLabels(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStages();
      fetchLabels();
    }
  }, [open, sessionId]);

  const handleCreateStage = async () => {
    if (!newStageName.trim() || isSubmittingStage) return;
    setIsSubmittingStage(true);
    try {
      const res = await fetch("/api/wa/pipeline/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: newStageName.trim(),
          color: newStageColor,
          isWon,
          isLost,
        }),
      });

      if (!res.ok) throw new Error("Gagal membuat stage");
      toast.success("Stage berhasil ditambahkan");
      setNewStageName("");
      setIsWon(false);
      setIsLost(false);
      fetchStages();
      onStagesChanged();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat stage");
    } finally {
      setIsSubmittingStage(false);
    }
  };

  const handleDeleteStage = async (id: string, name: string) => {
    if (!confirm(`Hapus stage "${name}"? Kontak pada stage ini akan dikembalikan ke status Tanpa Stage.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wa/pipeline/stages/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus stage");
      toast.success(`Stage "${name}" berhasil dihapus`);
      fetchStages();
      onStagesChanged();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus stage");
    }
  };

  const handleMoveStage = async (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const newStages = [...stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    setStages(newStages);

    try {
      const stageIds = newStages.map((s) => s.id);
      const res = await fetch("/api/wa/pipeline/stages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageIds }),
      });
      if (!res.ok) throw new Error("Gagal menyusun urutan");
      onStagesChanged();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyusun ulang tahapan");
      fetchStages();
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || isSubmittingLabel) return;
    setIsSubmittingLabel(true);
    try {
      const formattedName = newLabelName.startsWith("#")
        ? newLabelName.trim()
        : `#${newLabelName.trim()}`;

      const res = await fetch("/api/wa/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: formattedName,
          color: newLabelColor,
        }),
      });

      if (!res.ok) throw new Error("Gagal membuat label");
      toast.success("Label berhasil ditambahkan");
      setNewLabelName("");
      fetchLabels();
      onLabelsChanged();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat label");
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleDeleteLabel = async (id: string, name: string) => {
    if (!confirm(`Hapus label "${name}"? Label ini akan dilepas dari seluruh kontak.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wa/labels/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus label");
      toast.success(`Label "${name}" berhasil dihapus`);
      fetchLabels();
      onLabelsChanged();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus label");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Settings2 className="w-4 h-4 text-primary" />
            Pengaturan Pipeline & Label CRM
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sesuaikan alur tahapan prospek penjualan (Kanban) dan kategori tag merchandise untuk sesi ini.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stages" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
            <TabsTrigger value="stages" className="text-xs gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              Tahapan Pipeline ({stages.length})
            </TabsTrigger>
            <TabsTrigger value="labels" className="text-xs gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tag & Kategori ({labels.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STAGES */}
          <TabsContent value="stages" className="flex-1 flex flex-col min-h-0 space-y-4 m-0">
            {/* Stage List */}
            <div className="flex-1 min-h-[160px] max-h-64 overflow-y-auto space-y-2 pr-1 border rounded-lg p-2 bg-stone-50/50">
              {isLoadingStages && stages.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-stone-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat tahapan...</span>
                </div>
              ) : stages.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">
                  Belum ada tahapan stage.
                </div>
              ) : (
                stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-md border border-stone-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-semibold text-stone-900 truncate">
                        {stage.name}
                      </span>
                      {stage.isWon && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-medium">
                          Deal / Won
                        </span>
                      )}
                      {stage.isLost && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded font-medium">
                          Batal / Lost
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveStage(index, "UP")}
                        disabled={index === 0}
                        className="w-6 h-6 text-stone-500 hover:text-stone-900"
                        title="Geser ke atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveStage(index, "DOWN")}
                        disabled={index === stages.length - 1}
                        className="w-6 h-6 text-stone-500 hover:text-stone-900"
                        title="Geser ke bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteStage(stage.id, stage.name)}
                        className="w-6 h-6 text-stone-400 hover:text-rose-600"
                        title="Hapus stage"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Stage Form */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2.5 shrink-0">
              <span className="text-xs font-semibold text-stone-900">Tambah Tahapan Baru</span>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nama tahapan (contoh: Sampel Terkirim)"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="h-8 text-xs flex-1 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateStage();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateStage}
                  disabled={!newStageName.trim() || isSubmittingStage}
                  className="h-8 text-xs px-3 gap-1"
                >
                  {isSubmittingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Tambah</span>
                </Button>
              </div>

              {/* Color picker and flags */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 mr-1">Warna:</span>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStageColor(c)}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        newStageColor === c ? "scale-125 ring-2 ring-primary ring-offset-1" : "hover:scale-110 opacity-70"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWon}
                      onChange={(e) => {
                        setIsWon(e.target.checked);
                        if (e.target.checked) setIsLost(false);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Target Deal (Won)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLost}
                      onChange={(e) => {
                        setIsLost(e.target.checked);
                        if (e.target.checked) setIsWon(false);
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Batal (Lost)</span>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: LABELS */}
          <TabsContent value="labels" className="flex-1 flex flex-col min-h-0 space-y-4 m-0">
            {/* Label List */}
            <div className="flex-1 min-h-[160px] max-h-64 overflow-y-auto space-y-1.5 pr-1 border rounded-lg p-2 bg-stone-50/50">
              {isLoadingLabels && labels.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-stone-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat labels...</span>
                </div>
              ) : labels.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">
                  Belum ada label chat.
                </div>
              ) : (
                labels.map((lbl) => (
                  <div
                    key={lbl.id}
                    className="flex items-center justify-between p-2 bg-white rounded-md border border-stone-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span className="font-semibold text-stone-900">{lbl.name}</span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLabel(lbl.id, lbl.name)}
                      className="w-6 h-6 text-stone-400 hover:text-rose-600"
                      title="Hapus label"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Create Label Form */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2.5 shrink-0">
              <span className="text-xs font-semibold text-stone-900">Tambah Label Baru</span>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nama label (contoh: #JerseyCustom)"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="h-8 text-xs flex-1 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateLabel();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim() || isSubmittingLabel}
                  className="h-8 text-xs px-3 gap-1"
                >
                  {isSubmittingLabel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Tambah</span>
                </Button>
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-500 mr-1">Warna:</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLabelColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      newLabelColor === c ? "scale-125 ring-2 ring-primary ring-offset-1" : "hover:scale-110 opacity-70"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
