"use client";

import { Badge } from "@/components/ui/badge";
import { Control, useWatch } from "react-hook-form";
import { NoteItem } from "../noteItem";
import { AddQuotationFormValues } from "../quotationFormAdd";

// 1. SMART BADGE: Hanya dia yang tahu jumlah count
export const SmartNoteBadge = ({
  control,
  categoryId,
}: {
  control: Control<AddQuotationFormValues>;
  categoryId: string;
}) => {
  const notes = useWatch({ control, name: "notes" }) || [];
  const count =
    notes.find((n) => n.categoryId === categoryId)?.contents.length || 0;

  if (count === 0) return null;

  return (
    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
      {count}
    </Badge>
  );
};

// 2. SMART ITEM: Hanya dia yang tahu apakah dia dicentang atau tidak
export const SmartNoteItem = ({
  control,
  categoryId,
  tpl,
  idx,
  onToggle,
}: {
  control: Control<AddQuotationFormValues>;
  categoryId: string;
  tpl: { title: string; content: string };
  idx: number;
  onToggle: (catId: string, content: string) => void;
}) => {
  // Watch data notes disini. Parent tidak perlu tahu.
  const notes = useWatch({ control, name: "notes" }) || [];

  const isSelected =
    notes
      .find((n: any) => n.categoryId === categoryId)
      ?.contents.includes(tpl.content) || false;

  return (
    <NoteItem
      title={tpl.title}
      content={tpl.content}
      isSelected={isSelected}
      onToggle={() => onToggle(categoryId, tpl.content)}
    />
  );
};
