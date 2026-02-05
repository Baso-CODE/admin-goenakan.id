"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";
import { AddQuotationFormValues } from "../quotationFormAdd";

interface NoteCategoryAccordionProps {
  category: any;
  control: any;
}

export function NoteCategoryAccordion({
  category,
  control,
}: NoteCategoryAccordionProps) {
  const { getValues, setValue } = useFormContext<AddQuotationFormValues>();

  const handleToggleNote = (categoryId: string, content: string) => {
    const currentNotes = getValues("notes") || [];
    const categoryIndex = currentNotes.findIndex(
      (n) => n.categoryId === categoryId,
    );
    let newNotes = [...currentNotes];

    if (categoryIndex === -1) {
      // Kategori belum ada, tambahkan baru
      newNotes.push({ categoryId, contents: [content] });
    } else {
      const contents = [...newNotes[categoryIndex].contents];
      if (contents.includes(content)) {
        // Hapus konten
        const filtered = contents.filter((c) => c !== content);
        if (filtered.length === 0) {
          // Hapus kategori jika kosong
          newNotes.splice(categoryIndex, 1);
        } else {
          newNotes[categoryIndex] = {
            ...newNotes[categoryIndex],
            contents: filtered,
          };
        }
      } else {
        // Tambah konten
        newNotes[categoryIndex] = {
          ...newNotes[categoryIndex],
          contents: [...contents, content],
        };
      }
    }

    setValue("notes", newNotes, { shouldDirty: true });
  };

  const currentNotes = getValues("notes") || [];
  const categoryNotes = currentNotes.find((n) => n.categoryId === category.id);
  const selectedCount = categoryNotes?.contents?.length || 0;

  return (
    <Accordion type="single" collapsible className="w-full mb-2">
      <AccordionItem value={category.id} className="border-none">
        <AccordionTrigger className="py-2 px-2 hover:no-underline text-xs border rounded-md hover:bg-slate-50">
          <div className="flex items-center gap-2">
            {category.name}
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {selectedCount}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1 space-y-1">
          {category.templates.map((tpl: any, idx: number) => {
            const isSelected =
              categoryNotes?.contents?.includes(tpl.content) || false;

            return (
              <div
                key={`${category.id}-${idx}`}
                className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleNote(category.id, tpl.content);
                }}>
                <Checkbox
                  checked={isSelected}
                  className="mt-0.5 pointer-events-none"
                />
                <div className="grid gap-0.5 leading-none pointer-events-none">
                  <label className="text-sm font-medium">{tpl.title}</label>
                  <p className="text-xs text-muted-foreground">{tpl.content}</p>
                </div>
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
