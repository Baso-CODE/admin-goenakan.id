"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Lock } from "lucide-react";
import React, { memo } from "react";

// --- 1. MEMOIZED ITEM (Komponen Kecil) ---
// Ini mencegah seluruh Accordion me-render ulang saat satu item diklik.
// Sangat penting untuk performa dan mencegah loop di Radix UI.
const NoteItem = memo(
  ({
    title,
    content,
    checked,
    onToggle,
  }: {
    title: string;
    content: string;
    checked: boolean;
    onToggle: (e: React.MouseEvent) => void;
  }) => {
    return (
      <div
        className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
        onClick={onToggle}>
        <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
        <div className="grid gap-0.5 leading-none pointer-events-none">
          <label className="text-sm font-medium">{title}</label>
          <p className="text-xs text-muted-foreground">{content}</p>
        </div>
      </div>
    );
  },
  // Custom comparison agar React tahu kapan harus render ulang
  (prev, next) =>
    prev.checked === next.checked &&
    prev.title === next.title &&
    prev.content === next.content,
);

NoteItem.displayName = "NoteItem";

// --- 2. MAIN COMPONENT ---
interface NotesSectionProps {
  noteCategories: any[];
  selectedNotes: any[];
  setSelectedNotes: React.Dispatch<React.SetStateAction<any[]>>;
}

export function QuotationNotesSection({
  noteCategories,
  selectedNotes,
  setSelectedNotes,
}: NotesSectionProps) {
  // Logic Toggle yang Aman
  const handleToggle = (
    e: React.MouseEvent,
    categoryId: string,
    content: string,
  ) => {
    // === STOP BUBBLING (KUNCI PERBAIKAN) ===
    // Ini mencegah event klik "naik" ke Accordion parent
    // yang menyebabkan konflik render.
    e.preventDefault();
    e.stopPropagation();

    setSelectedNotes((prev) => {
      // Deep clone array agar state React mendeteksi perubahan
      // JSON parse/stringify adalah cara termudah deep clone array of objects sederhana
      const currentNotes = JSON.parse(JSON.stringify(prev));

      const categoryIndex = currentNotes.findIndex(
        (n: any) => n.categoryId === categoryId,
      );

      if (categoryIndex === -1) {
        // Kategori belum ada, buat baru
        currentNotes.push({ categoryId, contents: [content] });
      } else {
        // Kategori sudah ada
        const category = currentNotes[categoryIndex];
        const contentIndex = category.contents.indexOf(content);

        if (contentIndex === -1) {
          // Tambah konten
          category.contents.push(content);
        } else {
          // Hapus konten
          category.contents.splice(contentIndex, 1);
        }

        // Jika konten kosong setelah dihapus, buang kategorinya
        if (category.contents.length === 0) {
          currentNotes.splice(categoryIndex, 1);
        }
      }
      return currentNotes;
    });
  };

  // Helper cek checked (Menggunakan find agar aman)
  const isChecked = (catId: string, content: string) => {
    const cat = selectedNotes.find((n) => n.categoryId === catId);
    return cat ? cat.contents.includes(content) : false;
  };

  // Helper badge count
  const getCount = (catId: string) => {
    return (
      selectedNotes.find((n) => n.categoryId === catId)?.contents.length || 0
    );
  };

  const renderGroup = (isPublic: boolean, title: string, icon: any) => {
    const filtered = noteCategories.filter((c) => c.isPublic === isPublic);

    return (
      <Card className={!isPublic ? "bg-slate-50/50" : ""}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60 pr-2">
            <Accordion type="multiple" className="w-full">
              {filtered.map((cat) => (
                <AccordionItem
                  key={cat.id}
                  value={cat.id}
                  className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:no-underline text-xs">
                    <div className="flex items-center gap-2">
                      {cat.name}
                      {getCount(cat.id) > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5">
                          {getCount(cat.id)}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                    {cat.templates.map((tpl: any, i: number) => (
                      <NoteItem
                        key={`${cat.id}-${i}`}
                        title={tpl.title}
                        content={tpl.content}
                        checked={isChecked(cat.id, tpl.content)}
                        onToggle={(e) => handleToggle(e, cat.id, tpl.content)}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup(
        true,
        "Notes to Client",
        <FileText className="text-blue-500 w-4 h-4" />,
      )}
      {renderGroup(
        false,
        "Internal Memos",
        <Lock className="text-amber-500 w-4 h-4" />,
      )}
    </div>
  );
}
