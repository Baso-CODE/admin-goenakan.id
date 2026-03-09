"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SampleStep =
  | { kind: "followup"; label: string }
  | { kind: "convert_sales" };

type SampleStepData = {
  date: Date | null;
  enabled: boolean;
};

interface SampleFollowUpSectionProps {
  onChange: (
    steps: Array<{ name: string; date: Date | null; enabled: boolean }>,
  ) => void;
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
        init[i] = { date: null, enabled: true };
      });
      return init;
    },
  );
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const notify = (
    newSteps: SampleStep[],
    newData: Record<number, SampleStepData>,
  ) => {
    onChange(
      newSteps.map((step, i) => ({
        name: getStepLabel(step),
        date: newData[i]?.date ?? null,
        enabled: newData[i]?.enabled ?? true,
      })),
    );
  };

  const updateDate = (idx: number, date: Date) => {
    const updated = {
      ...stepData,
      [idx]: { ...stepData[idx], date },
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

    // Geser stepData: insert di convertIdx, geser convert ke bawah
    const newData: Record<number, SampleStepData> = {};
    newSteps.forEach((_, i) => {
      if (i < convertIdx) {
        newData[i] = stepData[i];
      } else if (i === convertIdx) {
        newData[i] = { date: null, enabled: true };
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
        <button
          type="button"
          onClick={addFollowUp}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Tambah Follow Up
        </button>
      </div>

      {/* Vertical line */}
      <div className="relative">
        <div className="absolute left-4.75 top-4 bottom-4 w-0.5 bg-gray-200 z-0" />

        <div className="space-y-2">
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
                    "flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-all",
                    isEnabled
                      ? `${color.border} ${color.bg}`
                      : "border-gray-200 bg-gray-50",
                  )}
                  onClick={() => setExpandedStep(isExpanded ? null : idx)}>
                  {/* Dot */}
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
                      isEnabled ? color.dot : "bg-gray-300",
                    )}>
                    {isEnabled ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Label + date preview */}
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isEnabled ? color.text : "text-gray-400",
                        )}>
                        {getStepLabel(step)}
                      </span>
                      {data?.date && (
                        <span className="text-[11px] text-muted-foreground">
                          —{" "}
                          {format(data.date, "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </span>
                      )}
                      {!data?.date && isEnabled && (
                        <span className="text-[10px] text-orange-400 italic">
                          belum diisi
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

                {/* Expanded: Date Picker */}
                {isExpanded && (
                  <div className="ml-10 mt-1.5 p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Tanggal Rencana
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-48 justify-start text-left font-normal h-8 text-xs">
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
                          onSelect={(d) => d && updateDate(idx, d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
