"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, FileText, Lock } from "lucide-react";
import React, { useState } from "react";

// ============================================================
// MODULE-LEVEL STORE — di luar React, tidak trigger render apapun
// ============================================================
let _notesStore: any[] = [];
export function getNotesStore(): any[] {
  return _notesStore;
}
export function resetNotesStore(): void {
  _notesStore = [];
}

// ============================================================
// COMPONENT
// ============================================================
export function QuotationNotesSection({
  noteCategories,
}: {
  noteCategories: any[];
}) {
  const [selectedNotes, setSelectedNotes] = useState<any[]>([]);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  function handleToggle(categoryId: string, content: string) {
    const next = selectedNotes.map((n) => ({
      ...n,
      contents: [...n.contents],
    }));
    const idx = next.findIndex((n) => n.categoryId === categoryId);

    let result: any[];
    if (idx === -1) {
      result = [...next, { categoryId, contents: [content] }];
    } else {
      const cat = next[idx];
      const ci = cat.contents.indexOf(content);
      if (ci === -1) cat.contents.push(content);
      else cat.contents.splice(ci, 1);
      result =
        cat.contents.length === 0 ? next.filter((_, i) => i !== idx) : next;
    }

    _notesStore = result;
    setSelectedNotes(result);
  }

  function isChecked(catId: string, content: string) {
    const cat = selectedNotes.find((n) => n.categoryId === catId);
    return cat ? cat.contents.includes(content) : false;
  }

  function getCount(catId: string) {
    return (
      selectedNotes.find((n) => n.categoryId === catId)?.contents.length || 0
    );
  }

  function renderGroup(
    isPublic: boolean,
    title: string,
    icon: React.ReactNode,
  ) {
    const filtered = noteCategories.filter((c) => c.isPublic === isPublic);
    if (filtered.length === 0) return null;

    return (
      <Card className={!isPublic ? "bg-slate-50/50" : ""}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60 pr-2">
            <div className="space-y-1">
              {filtered.map((cat) => {
                const isOpen = !!openCats[cat.id];
                const count = getCount(cat.id);

                return (
                  <div
                    key={cat.id}
                    className="border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
                      onClick={() => toggleCat(cat.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5">
                            {count}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t bg-white px-2 py-2 space-y-1">
                        {cat.templates.map((tpl: any, i: number) => {
                          const checked = isChecked(cat.id, tpl.content);
                          return (
                            <div
                              key={`${cat.id}-${i}`}
                              className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
                              onClick={() => handleToggle(cat.id, tpl.content)}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}} // dikontrol via onClick div parent
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                              />
                              <div className="grid gap-0.5 leading-none pointer-events-none">
                                <span className="text-sm font-medium">
                                  {tpl.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {tpl.content}
                                </span>
                              </div>
                            </div>
                          );
                        })}
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
