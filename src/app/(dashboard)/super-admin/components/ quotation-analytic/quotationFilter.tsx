"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CalendarDays, Filter, Loader2 } from "lucide-react";

export type QuotationFilterValues = {
  range: string;
  startDate: string;
  endDate: string;
};

interface Props {
  value: QuotationFilterValues;

  onChange: (value: QuotationFilterValues) => void;

  onApply: () => void;

  isLoading?: boolean;
}

export default function QuotationFilter({
  value,
  onChange,
  onApply,
  isLoading = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border bg-background p-2.5">
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <h3 className="text-sm font-semibold">Quotation Date Filter</h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Filter berdasarkan tanggal pembuatan Quotation.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={value.range}
          onValueChange={(range) =>
            onChange({
              ...value,
              range,
            })
          }>
          <SelectTrigger className="w-full bg-background sm:w-48">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="today">Today</SelectItem>

            <SelectItem value="7days">Last 7 Days</SelectItem>

            <SelectItem value="14days">Last 14 Days</SelectItem>

            <SelectItem value="30days">Last 30 Days</SelectItem>

            <SelectItem value="90days">Last 90 Days</SelectItem>

            <SelectItem value="1year">Last 1 Year</SelectItem>

            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {value.range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="Start Date"
              value={value.startDate}
              max={value.endDate || undefined}
              onChange={(event) =>
                onChange({
                  ...value,
                  startDate: event.target.value,
                })
              }
              className="w-full bg-background sm:w-40"
            />

            <span className="text-xs text-muted-foreground">to</span>

            <Input
              type="date"
              aria-label="End Date"
              value={value.endDate}
              min={value.startDate || undefined}
              onChange={(event) =>
                onChange({
                  ...value,
                  endDate: event.target.value,
                })
              }
              className="w-full bg-background sm:w-40"
            />
          </div>
        )}

        <Button
          onClick={onApply}
          disabled={isLoading}
          className="w-full gap-2 sm:w-auto">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          Apply Filter
        </Button>
      </div>
    </div>
  );
}
