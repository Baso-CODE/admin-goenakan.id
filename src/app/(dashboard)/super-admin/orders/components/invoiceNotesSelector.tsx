import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceNote, NoteCategory } from "../types/order.types";

interface InvoiceNotesSelectorProps {
  noteCategories: NoteCategory[];
  invoiceNotes: InvoiceNote[];
  manualInputs: Record<string, string>;
  onToggleNote: (categoryId: string, content: string) => void;
  onManualInputChange: (inputs: Record<string, string>) => void;
  onAddManualNote: (categoryId: string) => void;
}

export function InvoiceNotesSelector({
  noteCategories,
  invoiceNotes,
  manualInputs,
  onToggleNote,
  onManualInputChange,
  onAddManualNote,
}: InvoiceNotesSelectorProps) {
  if (noteCategories.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t">
      <Label className="text-base font-semibold">
        Catatan Invoice (Opsional)
      </Label>
      <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
        {noteCategories.map((cat) => {
          const selectedNotes =
            invoiceNotes.find((n) => n.categoryId === cat.id)?.contents || [];

          return (
            <div
              key={cat.id}
              className="space-y-3 bg-gray-50 p-4 rounded-md border">
              <Label className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {cat.name}
              </Label>

              {/* Template checkboxes */}
              <div className="space-y-2 pl-1">
                {cat.templates && cat.templates.length > 0 ? (
                  cat.templates.map((t) => {
                    const isChecked = selectedNotes.includes(t.content);
                    return (
                      <div key={t.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`note-${t.id}`}
                          checked={isChecked}
                          onCheckedChange={() =>
                            onToggleNote(cat.id, t.content)
                          }
                        />
                        <label
                          htmlFor={`note-${t.id}`}
                          className="text-sm font-medium leading-none cursor-pointer pt-0.5 text-gray-600">
                          {t.title}
                          <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                            {t.content.length > 50
                              ? t.content.substring(0, 50) + "..."
                              : t.content}
                          </span>
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Tidak ada template.
                  </p>
                )}
              </div>

              {/* Manual input */}
              <div className="flex gap-2 pt-2 border-t mt-2">
                <Input
                  placeholder="Tulis catatan manual..."
                  className="h-8 text-xs bg-white"
                  value={manualInputs[cat.id] || ""}
                  onChange={(e) =>
                    onManualInputChange({
                      ...manualInputs,
                      [cat.id]: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddManualNote(cat.id);
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => onAddManualNote(cat.id)}
                  type="button">
                  Add
                </Button>
              </div>

              {/* Selected chips */}
              {selectedNotes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="bg-white border text-xs px-2 py-1 rounded-md flex items-center gap-2 shadow-sm">
                      <span className="truncate max-w-50">{note}</span>
                      <button
                        onClick={() => onToggleNote(cat.id, note)}
                        className="text-red-500 hover:text-red-700">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
