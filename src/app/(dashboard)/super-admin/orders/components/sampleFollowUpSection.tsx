"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 🔥 UPDATE INTERFACE
export type SampleStepItem = {
  name: string;
  date: Date | null;
  enabled: boolean;
  method?: string;
  notes?: string;
  nextAction?: string;
};

type SampleStep =
  | { kind: "followup"; label: string }
  | { kind: "convert_sales" };

type SampleStepData = {
  date: Date | null;
  enabled: boolean;
  // 🔥 TAMBAHAN FIELD
  method: string;
  notes: string;
  nextAction: string;
};

interface SampleFollowUpSectionProps {
  onChange: (steps: SampleStepItem[]) => void;
}

const getStepColor = (step: SampleStep) => {
  if (step.kind === "convert_sales")
    return {
      dot: "bg-green-500",
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    };
  return {
    dot: "bg-blue-500",
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  };
};

const getStepLabel = (step: SampleStep): string => {
  if (step.kind === "convert_sales") return "Convert to Sales";
  return step.label;
};

const INITIAL_STEPS: SampleStep[] = [
  { kind: "followup", label: "Follow Up 1" },
  { kind: "followup", label: "Follow Up 2" },
  { kind: "followup", label: "Follow Up 3" },
  { kind: "convert_sales" },
];

export function SampleFollowUpSection({
  onChange,
}: SampleFollowUpSectionProps) {
  const [steps, setSteps] = useState<SampleStep[]>(INITIAL_STEPS);

  const [stepData, setStepData] = useState<Record<number, SampleStepData>>(
    () => {
      const init: Record<number, SampleStepData> = {};
      INITIAL_STEPS.forEach((_, i) => {
        // 🔥 UPDATE DEFAULT INITIAL STATE
        init[i] = {
          date: null,
          enabled: true,
          method: "",
          notes: "",
          nextAction: "",
        };
      });
      return init;
    },
  );
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const notify = (
    newSteps: SampleStep[],
    newData: Record<number, SampleStepData>,
  ) => {
    // 🔥 KIRIM DATA LENGKAP SAAT ADA PERUBAHAN
    onChange(
      newSteps.map((step, i) => ({
        name: getStepLabel(step),
        date: newData[i]?.date ?? null,
        enabled: newData[i]?.enabled ?? true,
        method: newData[i]?.method || undefined,
        notes: newData[i]?.notes || undefined,
        nextAction: newData[i]?.nextAction || undefined,
      })),
    );
  };

  const updateStepField = <K extends keyof SampleStepData>(
    idx: number,
    field: K,
    value: SampleStepData[K],
  ) => {
    const updated = {
      ...stepData,
      [idx]: { ...stepData[idx], [field]: value },
    };
    setStepData(updated);
    notify(steps, updated);
  };

  const toggleEnabled = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = {
      ...stepData,
      [idx]: { ...stepData[idx], enabled: !stepData[idx]?.enabled },
    };
    setStepData(updated);
    notify(steps, updated);
  };

  const addFollowUp = () => {
    const fuCount = steps.filter((s) => s.kind === "followup").length;
    const newStep: SampleStep = {
      kind: "followup",
      label: `Follow Up ${fuCount + 1}`,
    };
    const convertIdx = steps.findIndex((s) => s.kind === "convert_sales");

    const newSteps = [
      ...steps.slice(0, convertIdx),
      newStep,
      ...steps.slice(convertIdx),
    ];

    const newData: Record<number, SampleStepData> = {};
    newSteps.forEach((_, i) => {
      if (i < convertIdx) {
        newData[i] = stepData[i];
      } else if (i === convertIdx) {
        // 🔥 DEFAULT UNTUK STEP BARU
        newData[i] = {
          date: null,
          enabled: true,
          method: "",
          notes: "",
          nextAction: "",
        };
      } else {
        newData[i] = stepData[i - 1];
      }
    });

    setSteps(newSteps);
    setStepData(newData);
    notify(newSteps, newData);
  };

  return (
    <div className="mt-4 p-4 border border-blue-100 rounded-lg bg-blue-50/30 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-blue-700">
          📋 Sample Follow Up Plan
        </p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4.75 top-6 bottom-6 w-0.5 bg-gray-200 z-0" />

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const data = stepData[idx];
            const color = getStepColor(step);
            const isExpanded = expandedStep === idx;
            const isEnabled = data?.enabled ?? true;

            return (
              <div key={idx} className="relative z-10">
                {/* Step Row */}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                    isEnabled
                      ? `${color.border} ${color.bg}`
                      : "border-gray-200 bg-gray-50",
                  )}
                  onClick={() => setExpandedStep(isExpanded ? null : idx)}>
                  {/* Dot */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
                      isEnabled ? color.dot : "bg-gray-300",
                    )}>
                    {isEnabled ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Label + date preview */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isEnabled ? color.text : "text-gray-400",
                        )}>
                        {getStepLabel(step)}
                      </span>
                      {isEnabled && data?.date && (
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          {format(data.date, "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </span>
                      )}
                      {!data?.date && isEnabled && (
                        <span className="ml-2 text-[10px] text-orange-400 italic">
                          (Tanggal belum diset)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleEnabled(idx, e)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all",
                          isEnabled
                            ? `${color.badge} border-transparent`
                            : "text-gray-400 border-gray-300 hover:border-gray-400",
                        )}>
                        {isEnabled ? "✓ Aktif" : "Lewati"}
                      </button>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* 🔥 EXPANDED: FULL FORM SEPERTI DI DIALOG */}
                {isExpanded && isEnabled && (
                  <div className="ml-11 mt-2 space-y-3 border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                    {/* Date & Method */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Tanggal Rencana
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left font-normal h-8 text-xs">
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {data?.date
                                ? format(data.date, "dd MMM yyyy", {
                                    locale: idLocale,
                                  })
                                : "Pilih tanggal"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={data?.date ?? undefined}
                              onSelect={(d) =>
                                d && updateStepField(idx, "date", d)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Metode
                        </label>
                        <Select
                          value={data?.method}
                          onValueChange={(v) =>
                            updateStepField(idx, "method", v)
                          }>
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Pilih metode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone Call">
                              Phone Call
                            </SelectItem>
                            <SelectItem value="Meeting">
                              Meeting / Visit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Catatan / Hasil */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        Topik / Catatan
                      </label>
                      <Textarea
                        className="text-xs min-h-15 resize-none bg-white"
                        placeholder="Contoh: Follow up progress sampel dan minta feedback..."
                        value={data?.notes}
                        onChange={(e) =>
                          updateStepField(idx, "notes", e.target.value)
                        }
                      />
                    </div>

                    {/* Next Action */}
                    {step.kind === "followup" && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Tindakan Selanjutnya
                        </label>
                        <Input
                          className="h-8 text-xs bg-white"
                          placeholder="Contoh: Hubungi kembali jika barang sudah diuji coba..."
                          value={data?.nextAction}
                          onChange={(e) =>
                            updateStepField(idx, "nextAction", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Button dipindah ke bawah */}
      <button
        type="button"
        onClick={addFollowUp}
        className="ml-11 mt-4 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
        <Plus className="h-3.5 w-3.5" /> Tambah Follow Up Baru
      </button>
    </div>
  );
}
