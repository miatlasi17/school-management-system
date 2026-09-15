"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { submitMarks } from "@/actions/exams";

export type MarksGridStudent = {
  id: string;
  name: string;
  rollNo: string | null;
  section: string;
};

export type MarksGridExistingMark = {
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
} | null;

type RowState = {
  marksObtained: string;
  isAbsent: boolean;
  remarks: string;
};

export function MarksGrid({
  examSubjectId,
  maxMarks,
  students,
  existingMarks,
}: {
  examSubjectId: string;
  maxMarks: number;
  students: MarksGridStudent[];
  existingMarks: Record<string, MarksGridExistingMark>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      students.map((s) => {
        const existing = existingMarks[s.id];
        return [
          s.id,
          {
            marksObtained: existing?.marksObtained != null ? String(existing.marksObtained) : "",
            isAbsent: existing?.isAbsent ?? false,
            remarks: existing?.remarks ?? "",
          } satisfies RowState,
        ];
      })
    )
  );

  function updateRow(studentId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  function handleSave() {
    const marks = students.map((s) => {
      const row = rows[s.id];
      const trimmed = row.marksObtained.trim();
      return {
        studentId: s.id,
        marksObtained: row.isAbsent || trimmed === "" ? null : Number(trimmed),
        isAbsent: row.isAbsent,
        remarks: row.remarks,
      };
    });

    startTransition(async () => {
      const result = await submitMarks({ examSubjectId, marks });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Marks saved");
      router.refresh();
    });
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No students found in this class.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Marks (out of {maxMarks})</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const row = rows[s.id];
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    {s.rollNo ? <span className="ml-1 text-xs text-muted-foreground">#{s.rollNo}</span> : null}
                  </TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={maxMarks}
                      step="any"
                      className="w-24"
                      disabled={row.isAbsent}
                      value={row.marksObtained}
                      onChange={(e) => updateRow(s.id, { marksObtained: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={row.isAbsent}
                      onCheckedChange={(checked) =>
                        updateRow(s.id, {
                          isAbsent: checked === true,
                          marksObtained: checked === true ? "" : row.marksObtained,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-40"
                      placeholder="Optional"
                      value={row.remarks}
                      onChange={(e) => updateRow(s.id, { remarks: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving..." : "Save Marks"}
        </Button>
      </CardFooter>
    </Card>
  );
}
