"use client";

import React, { useState } from "react";
import { WaPipelineStage } from "@/types/waPortal.type";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Flag, Loader2 } from "lucide-react";

interface WaContactStageSelectorProps {
  stages: WaPipelineStage[];
  currentStage?: { id: string; name: string; color: string } | null;
  onSelectStage: (stageId: string | null) => Promise<void>;
  disabled?: boolean;
}

export const WaContactStageSelector: React.FC<WaContactStageSelectorProps> = ({
  stages,
  currentStage,
  onSelectStage,
  disabled = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const activeStage = currentStage
    ? stages.find((s) => s.id === currentStage.id) || currentStage
    : null;

  const handleSelect = async (stageId: string | null) => {
    if (activeStage?.id === stageId || isUpdating) return;
    setIsUpdating(true);
    try {
      await onSelectStage(stageId);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isUpdating}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border/60 hover:border-border transition-all bg-card/60 backdrop-blur-sm cursor-pointer disabled:opacity-50"
      >
        {isUpdating ? (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        ) : activeStage ? (
          <span
            className="w-2 h-2 rounded-full ring-2 ring-white/10 shrink-0"
            style={{ backgroundColor: activeStage.color }}
          />
        ) : (
          <Flag className="w-3 h-3 text-muted-foreground" />
        )}
        <span className="truncate max-w-[120px]">
          {activeStage ? activeStage.name : "Atur Stage"}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 p-1">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
          Status Pipeline Lead
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {stages.map((stage) => {
          const isSelected = activeStage?.id === stage.id;
          return (
            <DropdownMenuItem
              key={stage.id}
              onClick={() => handleSelect(stage.id)}
              className="flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <span className={`truncate ${isSelected ? "font-semibold" : ""}`}>
                  {stage.name}
                </span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}

        {activeStage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className="text-xs text-muted-foreground hover:text-destructive py-1.5 px-2 cursor-pointer"
            >
              Tanpa Stage (Reset)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
