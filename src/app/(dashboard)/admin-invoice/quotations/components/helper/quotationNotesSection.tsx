"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, FileText, Lock, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import QuotationNoteContent from "../../notes/components/quotationContent/quotationNoteContent";
import {
  buildQuotationNote,
  QuotationNoteCategory,
  QuotationNoteValue,
} from "../../notes/components/quotationNoteUtils";

let _notesStore: QuotationNoteValue[] = [];

export function getNotesStore(): QuotationNoteValue[] {
  return _notesStore;
}

export function resetNotesStore(initial: QuotationNoteValue[] = []): void {
  _notesStore = [...initial];
}

const EMPTY_NOTES: QuotationNoteValue[] = [];

interface Props {
  noteCategories: QuotationNoteCategory[];
  initialNotes?: QuotationNoteValue[];
}

export function QuotationNotesSection({
  noteCategories,
  initialNotes = EMPTY_NOTES,
}: Props) {
  const [selectedNotes, setSelectedNotes] =
    useState<QuotationNoteValue[]>(initialNotes);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedNotes(initialNotes);
    resetNotesStore(initialNotes);
  }, [initialNotes]);

  function saveNotes(next: QuotationNoteValue[]) {
    _notesStore = next;
    setSelectedNotes(next);
  }

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  function isChecked(categoryId: string, templateId: string) {
    return selectedNotes.some(
      (note) =>
        note.categoryId === categoryId && note.templateId === templateId,
    );
  }

  function handleToggle(
    categoryId: string,
    templateId: string,
    title: string,
    content: string,
  ) {
    const existing = isChecked(categoryId, templateId);

    if (existing) {
      saveNotes(
        selectedNotes.filter(
          (note) =>
            !(note.categoryId === categoryId && note.templateId === templateId),
        ),
      );
      return;
    }

    saveNotes([
      ...selectedNotes,
      {
        categoryId,
        templateId,
        content: buildQuotationNote(title, content),
      },
    ]);
  }

  function refreshTemplate(
    categoryId: string,
    templateId: string,
    title: string,
    content: string,
  ) {
    saveNotes(
      selectedNotes.map((note) =>
        note.categoryId === categoryId && note.templateId === templateId
          ? { ...note, content: buildQuotationNote(title, content) }
          : note,
      ),
    );
  }

  function removeLegacyNote(index: number) {
    saveNotes(selectedNotes.filter((_, i) => i !== index));
  }

  function getCount(categoryId: string) {
    return selectedNotes.filter((note) => note.categoryId === categoryId)
      .length;
  }

  function renderGroup(isPublic: boolean, title: string, icon: ReactNode) {
    const filtered = noteCategories.filter(
      (category) => category.isPublic === isPublic,
    );
    if (filtered.length === 0) return null;

    return (
      <Card className={!isPublic ? "bg-slate-50/50" : ""}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-2">
            <div className="space-y-2">
              {filtered.map((cat) => {
                const isOpen = !!openCats[cat.id];
                const count = getCount(cat.id);

                const legacyNotes = selectedNotes
                  .map((note, index) => ({ note, index }))
                  .filter(
                    ({ note }) =>
                      note.categoryId === cat.id &&
                      (!note.templateId ||
                        !cat.templates.some(
                          (template) => template.id === note.templateId,
                        )),
                  );

                return (
                  <div
                    key={cat.id}
                    className="border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40"
                      onClick={() => toggleCat(cat.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {count > 0 && (
                          <Badge variant="secondary">{count}</Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t bg-white p-2 space-y-2">
                        {cat.templates.map((tpl) => {
                          const checked = isChecked(cat.id, tpl.id);

                          return (
                            <div
                              key={tpl.id}
                              className="rounded-md border p-3 space-y-2">
                              <label className="flex gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    handleToggle(
                                      cat.id,
                                      tpl.id,
                                      tpl.title,
                                      tpl.content,
                                    )
                                  }
                                  className="mt-1 h-4 w-4 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold mb-1">
                                    {tpl.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    <QuotationNoteContent
                                      content={tpl.content}
                                    />
                                  </div>
                                </div>
                              </label>

                              {checked && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    refreshTemplate(
                                      cat.id,
                                      tpl.id,
                                      tpl.title,
                                      tpl.content,
                                    )
                                  }
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline ml-7">
                                  <RefreshCw className="h-3 w-3" />
                                  Perbarui dari Template
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {legacyNotes.map(({ note, index }) => (
                          <div
                            key={`legacy-${index}`}
                            className="rounded-md border border-amber-200 bg-amber-50 p-3">
                            <div className="flex justify-between gap-2 mb-2">
                              <span className="text-xs font-medium text-amber-800">
                                Notes lama / template tidak ditemukan
                              </span>
                              <button
                                type="button"
                                onClick={() => removeLegacyNote(index)}
                                className="text-red-600"
                                aria-label="Hapus note lama">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs">
                              <QuotationNoteContent content={note.content} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {renderGroup(
        true,
        "Notes to Client (Public)",
        <FileText className="h-4 w-4 text-blue-600" />,
      )}
      {renderGroup(
        false,
        "Internal Notes (Private)",
        <Lock className="h-4 w-4 text-amber-600" />,
      )}
    </div>
  );
}
