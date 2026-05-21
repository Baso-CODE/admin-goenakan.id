import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface SalesFilterProps {
  dateRange: string;
  setDateRange: (val: string) => void;

  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;

  comparison: string;
  setComparison: (val: string) => void;
  onApply: () => void;
}

export default function SalesFilter({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  comparison,
  setComparison,
  onApply,
}: SalesFilterProps) {
  const parseDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setCustomStartDate(date ? format(date, "yyyy-MM-dd") : "");
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setCustomEndDate(date ? format(date, "yyyy-MM-dd") : "");
  };

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50 p-4 rounded-xl border">
      {/* ========================================== */}
      {/* BAGIAN KIRI: Judul & Deskripsi           */}
      {/* ========================================== */}
      <div className="shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">
          Global Date Filter
        </h3>
        <p className="text-xs text-muted-foreground">
          Filter ini mempengaruhi semua metrik dan grafik di bawah.
        </p>
      </div>

      {/* ========================================== */}
      {/* BAGIAN KANAN: Kumpulan Filter            */}
      {/* ========================================== */}
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        {/* 1. DROPDOWN RENTANG WAKTU UTAMA */}
        <div className="w-full sm:w-50 shrink-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="bg-white">
              <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="14days">Last 14 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. INPUT CUSTOM DATE (Menggunakan Shadcn UI DatePicker) */}
        {dateRange === "custom" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto shrink-0">
            {/* Start Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-37.5 justify-between text-left font-normal bg-white",
                    !customStartDate && "text-muted-foreground",
                  )}>
                  {customStartDate ? (
                    format(parseDate(customStartDate)!, "dd/MM/yyyy")
                  ) : (
                    <span>Start Date</span>
                  )}
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(customStartDate)}
                  onSelect={handleStartDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Kata "to" akan disembunyikan jika dibuka di layar HP agar hemat ruang */}
            <span className="text-sm text-slate-500 hidden sm:inline-block">
              to
            </span>

            {/* End Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-37.5 justify-between text-left font-normal bg-white",
                    !customEndDate && "text-muted-foreground",
                  )}>
                  {customEndDate ? (
                    format(parseDate(customEndDate)!, "dd/MM/yyyy")
                  ) : (
                    <span>End Date</span>
                  )}
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(customEndDate)}
                  onSelect={handleEndDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* 3. DROPDOWN PERBANDINGAN */}
        <div className="w-full sm:w-45 shrink-0">
          <Select value={comparison} onValueChange={setComparison}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Comparison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Comparison</SelectItem>
              <SelectItem value="previous_period">
                vs Previous Period
              </SelectItem>
              <SelectItem value="previous_year">vs Previous Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. TOMBOL APPLY */}
        <Button
          variant="default"
          onClick={onApply}
          className="w-full sm:w-auto shrink-0 bg-slate-900 hover:bg-slate-800 text-white">
          Apply Filter
        </Button>
      </div>
    </div>
  );
}
