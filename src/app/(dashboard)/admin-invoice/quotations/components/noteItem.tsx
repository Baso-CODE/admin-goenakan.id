"use client";

import { Checkbox } from "@/components/ui/checkbox";
import React from "react";

export const NoteItem = React.memo(
  ({
    title,
    content,
    isSelected,
    onToggle,
  }: {
    title: string;
    content: string;
    isSelected: boolean;
    onToggle: () => void;
  }) => {
    return (
      <div
        className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
        onClick={(e) => {
          // PENTING: Mencegah Accordion bereaksi
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }}>
        <Checkbox
          checked={isSelected}
          // PENTING: pointer-events-none agar klik ditangani oleh div pembungkus
          className="mt-0.5 pointer-events-none"
        />
        <div className="grid gap-0.5 leading-none pointer-events-none">
          <label className="text-sm font-medium">{title}</label>
          <p className="text-xs text-muted-foreground">{content}</p>
        </div>
      </div>
    );
  },
);

NoteItem.displayName = "NoteItem";
