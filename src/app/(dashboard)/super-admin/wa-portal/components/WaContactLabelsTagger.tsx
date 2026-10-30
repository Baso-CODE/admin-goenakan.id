"use client";

import React, { useState } from "react";
import { WaLabel } from "@/types/waPortal.type";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Plus, Search, Tag, X } from "lucide-react";

interface WaContactLabelsTaggerProps {
  availableLabels: WaLabel[];
  currentLabels: WaLabel[];
  onUpdateLabels: (labelIds: string[]) => Promise<void>;
  onCreateLabel?: (name: string, color: string) => Promise<void>;
  disabled?: boolean;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red / HotLead
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export const WaContactLabelsTagger: React.FC<WaContactLabelsTaggerProps> = ({
  availableLabels,
  currentLabels,
  onUpdateLabels,
  onCreateLabel,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentLabelIds = new Set(currentLabels.map((l) => l.id));

  const handleToggle = async (labelId: string) => {
    if (isUpdating || disabled) return;
    const nextIds = currentLabelIds.has(labelId)
      ? currentLabels.filter((l) => l.id !== labelId).map((l) => l.id)
      : [...currentLabels.map((l) => l.id), labelId];

    setIsUpdating(true);
    try {
      await onUpdateLabels(nextIds);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating || disabled) return;
    const nextIds = currentLabels.filter((l) => l.id !== labelId).map((l) => l.id);
    setIsUpdating(true);
    try {
      await onUpdateLabels(nextIds);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreate = async () => {
    if (!newLabelName.trim() || !onCreateLabel || isCreating) return;
    setIsCreating(true);
    try {
      const formattedName = newLabelName.startsWith("#")
        ? newLabelName.trim()
        : `#${newLabelName.trim()}`;
      await onCreateLabel(formattedName, newLabelColor);
      setNewLabelName("");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredLabels = availableLabels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {/* Current label pills */}
      {currentLabels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all group"
          style={{
            backgroundColor: `${label.color}18`,
            color: label.color,
            border: `1px solid ${label.color}40`,
          }}
        >
          <span>{label.name}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => handleRemove(label.id, e)}
              className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}

      {/* Add / Manage Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || isUpdating}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-dashed border-border/80 hover:border-primary/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            <span>Label</span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-64 p-2.5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Kelola Tag Label
              </span>
              <span className="text-[10px] text-muted-foreground">
                {currentLabels.length} terpilih
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-muted-foreground" />
              <Input
                placeholder="Cari label..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs pl-7 pr-2"
              />
            </div>

            {/* Available labels list */}
            <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
              {filteredLabels.length === 0 ? (
                <div className="text-center py-3 text-[11px] text-muted-foreground">
                  Label tidak ditemukan
                </div>
              ) : (
                filteredLabels.map((lbl) => {
                  const isChecked = currentLabelIds.has(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggle(lbl.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer text-left transition-colors ${
                        isChecked
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span className="truncate">{lbl.name}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1.5" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick create new label */}
            {onCreateLabel && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground">
                  Buat Label Baru
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="#ContohLabel"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newLabelName.trim() || isCreating}
                    className="h-7 text-xs px-2.5"
                  >
                    {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tambah"}
                  </Button>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewLabelColor(c)}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        newLabelColor === c
                          ? "scale-125 ring-2 ring-primary ring-offset-1"
                          : "hover:scale-110 opacity-80"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
