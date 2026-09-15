"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toSelectItems } from "@/lib/utils";

type SectionOption = { id: string; label: string };

export function AttendanceFilters({
  basePath,
  sections,
  sectionId,
  date,
}: {
  basePath: string;
  sections: SectionOption[];
  sectionId: string;
  date: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label>Section</Label>
        <Select
          value={sectionId}
          onValueChange={(value) => {
            if (typeof value === "string") updateParam("sectionId", value);
          }}
          items={toSelectItems(sections)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="attendance-date">Date</Label>
        <Input
          id="attendance-date"
          type="date"
          value={date}
          onChange={(e) => updateParam("date", e.target.value)}
          className="w-full sm:w-48"
        />
      </div>
    </div>
  );
}
