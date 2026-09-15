"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PayrollFilters({ month, year }: { month: number; year: number }) {
  const router = useRouter();

  function update(nextMonth: number, nextYear: number) {
    router.push(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
  }

  const years = Array.from({ length: 6 }, (_, i) => year - 3 + i);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <label htmlFor="payroll-month" className="text-sm font-medium">
          Month
        </label>
        <select
          id="payroll-month"
          value={month}
          onChange={(e) => update(Number(e.target.value), year)}
          className={`${selectClassName} w-full sm:w-48`}
        >
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="payroll-year" className="text-sm font-medium">
          Year
        </label>
        <select
          id="payroll-year"
          value={year}
          onChange={(e) => update(month, Number(e.target.value))}
          className={`${selectClassName} w-full sm:w-32`}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
