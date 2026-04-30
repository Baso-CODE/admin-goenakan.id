// app/super-admin/components/customer/CustomerFilter.tsx
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

interface CustomerFilterProps {
  dateRange: string;
  setDateRange: (val: string) => void;
  comparison: string;
  setComparison: (val: string) => void;
  onApply: () => void;
}

export default function CustomerFilter({
  dateRange,
  setDateRange,
  comparison,
  setComparison,
  onApply,
}: CustomerFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Global Date Filter
        </h3>
        <p className="text-xs text-muted-foreground font-medium ">
          *Impact for all graphs below.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* RANGE DATE */}
        <div className="w-full sm:w-40">
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

        {/* COMPARISON */}
        <div className="w-full sm:w-48">
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

        <Button
          variant="default"
          onClick={onApply}
          className="w-full sm:w-auto shrink-0">
          Apply Filter
        </Button>
      </div>
    </div>
  );
}
