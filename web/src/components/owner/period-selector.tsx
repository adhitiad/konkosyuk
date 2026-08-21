"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = "month" | "quarter" | "year";

const periods = [
  { value: "month", label: "Bulan" },
  { value: "quarter", label: "Kuartal" },
  { value: "year", label: "Tahun" },
] as const;

const months = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const quarters = [
  { value: "1", label: "Q1 (Jan-Mar)" },
  { value: "2", label: "Q2 (Apr-Jun)" },
  { value: "3", label: "Q3 (Jul-Sep)" },
  { value: "4", label: "Q4 (Okt-Des)" },
];

type PeriodSelectorProps = {
  period: Period;
  year: number;
  month: number;
  propertyId?: string;
  onPeriodChange: (value: Period) => void;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onPropertyIdChange: (value: string | undefined) => void;
};

export function PeriodSelector({
  period,
  year,
  month,
  propertyId,
  onPeriodChange,
  onYearChange,
  onMonthChange,
  onPropertyIdChange,
}: PeriodSelectorProps) {
  const selectedQuarter = String(Math.floor((month - 1) / 3) + 1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as Period)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Periode" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "month" && (
        <Select
          value={String(month)}
          onValueChange={(value) => onMonthChange(Number(value))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {period === "quarter" && (
        <Select
          value={selectedQuarter}
          onValueChange={(value) => {
            const quarter = Number(value);
            const monthValue = (quarter - 1) * 3 + 1;
            onMonthChange(monthValue);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Kuartal" />
          </SelectTrigger>
          <SelectContent>
            {quarters.map((q) => (
              <SelectItem key={q.value} value={q.value}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={String(year)}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 5 }, (_, i) => {
            const y = new Date().getFullYear() - i;
            return (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <input
        placeholder="Filter properti"
        value={propertyId ?? ""}
        onChange={(e) => onPropertyIdChange(e.target.value || undefined)}
        className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}
