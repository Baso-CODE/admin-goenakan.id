import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export function DatePickerHelper({
  date,
  setDate,
  placeholder,
}: {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-48 justify-start text-left font-normal px-3",
            !date && "text-muted-foreground",
          )}>
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {date ? format(date, "PPP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      {/* Tambahkan kelas w-auto p-3 agar popover memiliki ruang yang pas */}
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          captionLayout="dropdown"
          fromYear={1970}
          toYear={2040}
        />
      </PopoverContent>
    </Popover>
  );
}
