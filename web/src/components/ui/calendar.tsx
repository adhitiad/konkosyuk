"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays, startOfWeek, endOfWeek, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  selectedRange?: { start: Date; end: Date } | null;
  onSelectRange?: (range: { start: Date; end: Date } | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  markedDates?: Array<{ date: Date; type: "available" | "booked" | "pricing" | "inspection"; label?: string }>;
  className?: string;
  showMonthPicker?: boolean;
  mode?: "single" | "range" | "multiple";
}

export function Calendar({
  selectedDate,
  onSelectDate,
  selectedRange,
  onSelectRange,
  minDate,
  maxDate,
  disabledDates = [],
  markedDates = [],
  className,
  showMonthPicker = true,
  mode = "single",
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateDisabled = (date: Date) => {
    if (minDate && date < startOfDay(minDate)) return true;
    if (maxDate && date > endOfDay(maxDate)) return true;
    if (disabledDates.some((d) => isSameDay(d, date))) return true;
    return false;
  };

  const getDateMark = (date: Date) => {
    return markedDates.find((m) => isSameDay(m.date, date));
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (mode === "single" && onSelectDate) {
      onSelectDate(date);
    } else if (mode === "range" && onSelectRange) {
      if (!selectedRange) {
        onSelectRange({ start: date, end: date });
      } else if (!selectedRange.end || selectedRange.end.getTime() !== selectedRange.start.getTime()) {
        if (date < selectedRange.start) {
          onSelectRange({ start: date, end: selectedRange.start });
        } else {
          onSelectRange({ start: selectedRange.start, end: date });
        }
      } else {
        onSelectRange({ start: date, end: date });
      }
    }
  };

  const isSelected = (date: Date) => {
    if (mode === "single") {
      return selectedDate ? isSameDay(date, selectedDate) : false;
    }
    if (mode === "range" && selectedRange) {
      if (!selectedRange.end) return isSameDay(date, selectedRange.start);
      return date >= selectedRange.start && date <= selectedRange.end;
    }
    return false;
  };

  const isRangeStart = (date: Date) => {
    return mode === "range" && selectedRange && isSameDay(date, selectedRange.start);
  };

  const isRangeEnd = (date: Date) => {
    return mode === "range" && selectedRange && selectedRange.end && isSameDay(date, selectedRange.end);
  };

  const getMarkColor = (type: string) => {
    switch (type) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "booked":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pricing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "inspection":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className={cn("w-full max-w-md", className)}>
      {showMonthPicker && (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} strokeWidth={2} className="size-4" />
          </button>
          <h3 className="font-semibold text-lg">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <HugeiconsIcon icon={ChevronRightIcon} strokeWidth={2} className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const disabled = isDateDisabled(date);
          const selected = isSelected(date);
          const rangeStart = isRangeStart(date);
          const rangeEnd = isRangeEnd(date);
          const mark = getDateMark(date);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all",
                !isCurrentMonth && "text-muted-foreground/50",
                isCurrentMonth && "hover:bg-muted",
                disabled && "opacity-30 cursor-not-allowed",
                selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !selected && isCurrentMonth && !disabled && "hover:bg-muted",
                rangeStart && "rounded-r-none",
                rangeEnd && "rounded-l-none",
                rangeStart && rangeEnd && "rounded-lg",
              )}
            >
              <span className={cn(isToday(date) && !selected && "font-bold text-primary")}>
                {format(date, "d")}
              </span>
              {mark && (
                <span className={cn("text-[10px] px-1 rounded-full mt-0.5 truncate w-full", getMarkColor(mark.type))}>
                  {mark.label || ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
