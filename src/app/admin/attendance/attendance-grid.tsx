"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AttendanceStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { submitAttendance } from "@/actions/attendance";
import { toSelectItems } from "@/lib/utils";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "EXCUSED", label: "Excused" },
];
const STATUS_ITEMS = toSelectItems(STATUS_OPTIONS);

export type AttendanceStudent = {
  id: string;
  name: string;
  admissionNo: string;
  rollNo: string | null;
};

export type ExistingRecord = { status: AttendanceStatus; remarks: string | null };

type RowState = { status: AttendanceStatus; remarks: string };

export function AttendanceGrid({
  students,
  sectionId,
  date,
  existingRecords,
}: {
  students: AttendanceStudent[];
  sectionId: string;
  date: string;
  existingRecords: Record<string, ExistingRecord>;
}) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const student of students) {
      const existing = existingRecords[student.id];
      initial[student.id] = {
        status: existing?.status ?? "PRESENT",
        remarks: existing?.remarks ?? "",
      };
    }
    return initial;
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }

  function setRemarks(studentId: string, remarks: string) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  }

  function handleSave() {
    const records = students.map((student) => ({
      studentId: student.id,
      status: rows[student.id]?.status ?? "PRESENT",
      remarks: rows[student.id]?.remarks || undefined,
    }));

    startTransition(async () => {
      const result = await submitAttendance({ sectionId, date, records });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Attendance saved");
      router.refresh();
    });
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No students in this section.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.rollNo ?? "—"}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.admissionNo}</TableCell>
                <TableCell>
                  <Select
                    value={rows[student.id]?.status ?? "PRESENT"}
                    onValueChange={(value) => setStatus(student.id, value as AttendanceStatus)}
                    items={STATUS_ITEMS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Optional"
                    value={rows[student.id]?.remarks ?? ""}
                    onChange={(e) => setRemarks(student.id, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end border-t p-4">
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
