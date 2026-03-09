"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// ======================================================
// TYPES
// ======================================================
type StepType =
  | { kind: "followup"; label: string } // FU1, FU2, dst
  | { kind: "convert_sample" }
  | { kind: "convert_sales" };

type StepData = {
  date: Date;
  method: string;
  notes: string;
  nextAction: string;
  enabled: boolean; // apakah step ini diisi atau dilewati
};

interface FollowUpStepperDialogProps {
  quotationId: string;
  existingFollowUps: { name: string | null }[];
  onSuccess: () => void;
  onSubmit: (data: {
    name: string;
    date: Date;
    method?: string;
    notes?: string;
    nextAction?: string;
  }) => Promise<void>;
}
// ======================================================
// FIXED STEPS BUILDER
// ======================================================
const CONVERT_STEPS: StepType[] = [
  { kind: "convert_sample" },
  { kind: "convert_sales" },
];

const getStepLabel = (step: StepType): string => {
  if (step.kind === "followup") return step.label;
  if (step.kind === "convert_sample") return "Convert to Sample";
  return "Convert to Sales";
};

const getStepColor = (step: StepType) => {
  if (step.kind === "convert_sample")
    return {
      dot: "bg-purple-500",
      border: "border-purple-200",
      bg: "bg-purple-50",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
    };
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

// ======================================================
// MAIN COMPONENT
// ======================================================
export function FollowUpStepperDialog({
  quotationId,
  existingFollowUps,
  onSuccess,
  onSubmit,
}: FollowUpStepperDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number>(0);
  console.log("ini adalah data dari", existingFollowUps);

  const existingFUCount = existingFollowUps.filter((f) =>
    f.name?.toLowerCase().startsWith("follow up"),
  ).length;

  // Build initial steps: minimal 1 FU baru + 2 convert
  const buildSteps = (): StepType[] => {
    return [
      { kind: "followup", label: `Follow Up ${existingFUCount + 1}` },
      ...CONVERT_STEPS,
    ];
  };

  const [steps, setSteps] = useState<StepType[]>(buildSteps());
  const [stepData, setStepData] = useState<Record<number, StepData>>(() => {
    const initial: Record<number, StepData> = {};
    buildSteps().forEach((_, i) => {
      initial[i] = {
        date: new Date(),
        method: "",
        notes: "",
        nextAction: "",
        enabled: i === 0,
      };
    });
    return initial;
  });

  // Tambah FU baru sebelum convert steps
  const addFollowUp = () => {
    const fuCount = steps.filter((s) => s.kind === "followup").length;
    const newStep: StepType = {
      kind: "followup",
      label: `Follow Up ${existingFUCount + fuCount + 1}`,
    };
    const convertIndex = steps.findIndex((s) => s.kind !== "followup");
    const newSteps = [
      ...steps.slice(0, convertIndex),
      newStep,
      ...steps.slice(convertIndex),
    ];
    const newIdx = convertIndex;

    // Geser index stepData untuk convert steps
    const newStepData: Record<number, StepData> = {};
    newSteps.forEach((_, i) => {
      if (i < newIdx) {
        newStepData[i] = stepData[i];
      } else if (i === newIdx) {
        newStepData[i] = {
          date: new Date(),
          method: "",
          notes: "",
          nextAction: "",
          enabled: false,
        };
      } else {
        newStepData[i] = stepData[i - 1];
      }
    });

    setSteps(newSteps);
    setStepData(newStepData);
  };

  const updateStepData = (
    idx: number,
    field: keyof StepData,
    value: StepData[keyof StepData],
  ) => {
    setStepData((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], [field]: value },
    }));
  };

  const toggleEnabled = (idx: number) => {
    updateStepData(idx, "enabled", !stepData[idx]?.enabled);
  };

  // Submit hanya step yang enabled
  const handleSubmit = async () => {
    const enabledSteps = steps
      .map((step, i) => ({ step, data: stepData[i], idx: i }))
      .filter(({ data }) => data?.enabled);

    if (enabledSteps.length === 0) return;

    setLoading(true);
    try {
      for (const { step, data } of enabledSteps) {
        await onSubmit({
          name: getStepLabel(step),
          date: data.date,
          method: data.method || undefined,
          notes: data.notes || undefined,
          nextAction: data.nextAction || undefined,
        });
      }
      setOpen(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(stepData).filter((d) => d?.enabled).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          // Reset saat buka
          const s = buildSteps();
          setSteps(s);
          const init: Record<number, StepData> = {};
          s.forEach((_, i) => {
            init[i] = {
              date: new Date(),
              method: "",
              notes: "",
              nextAction: "",
              enabled: i === 0,
            };
          });
          setStepData(init);
          setExpandedStep(0);
        }
      }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
          <Plus className="h-4 w-4" /> Catat Follow Up
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Aktivitas Follow Up</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-1">
          {/* STEPPER */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4.75 top-6 bottom-6 w-0.5 bg-gray-200 z-0" />

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const data = stepData[idx];
                const color = getStepColor(step);
                const isExpanded = expandedStep === idx;
                const isEnabled = data?.enabled;

                return (
                  <div key={idx} className="relative z-10">
                    {/* Step Header */}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                        isEnabled
                          ? `${color.border} ${color.bg}`
                          : "border-gray-200 bg-gray-50",
                      )}
                      onClick={() => setExpandedStep(isExpanded ? -1 : idx)}>
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

                      {/* Label & toggle */}
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isEnabled ? color.text : "text-gray-400",
                            )}>
                            {getStepLabel(step)}
                          </span>
                          {isEnabled && data.date && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              {format(data.date, "dd MMM yyyy", {
                                locale: idLocale,
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Toggle aktif/nonaktif */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEnabled(idx);
                            }}
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

                    {/* Step Form (expand) */}
                    {isExpanded && (
                      <div className="ml-11 mt-2 space-y-3 border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                        {/* Date */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">
                              Tanggal <span className="text-red-500">*</span>
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
                                  selected={data?.date}
                                  onSelect={(d) =>
                                    d && updateStepData(idx, "date", d)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Metode */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">
                              Metode
                            </label>
                            <Select
                              value={data?.method}
                              onValueChange={(v) =>
                                updateStepData(idx, "method", v)
                              }>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih metode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WhatsApp">
                                  WhatsApp
                                </SelectItem>
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

                        {/* Hasil */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">
                            Hasil Pembicaraan
                          </label>
                          <Textarea
                            className="text-xs min-h-15 resize-none"
                            placeholder="Contoh: Client minta revisi harga..."
                            value={data?.notes}
                            onChange={(e) =>
                              updateStepData(idx, "notes", e.target.value)
                            }
                          />
                        </div>

                        {/* Next Action — hanya untuk FU, bukan convert */}
                        {step.kind === "followup" && (
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">
                              Action Selanjutnya
                            </label>
                            <Input
                              className="h-8 text-xs"
                              placeholder="Contoh: Hubungi lagi Senin depan"
                              value={data?.nextAction}
                              onChange={(e) =>
                                updateStepData(
                                  idx,
                                  "nextAction",
                                  e.target.value,
                                )
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

          {/* Tombol tambah FU */}
          <button
            type="button"
            onClick={addFollowUp}
            className="ml-11 mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="h-3.5 w-3.5" /> Tambah Follow Up
          </button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || enabledCount === 0}
            className="bg-orange-600 hover:bg-orange-700">
            {loading
              ? "Menyimpan..."
              : `Simpan ${enabledCount > 0 ? `(${enabledCount} aktivitas)` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
