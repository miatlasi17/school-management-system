import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { UserCheck, UserX, Clock } from "lucide-react";
import { AttendanceFilters } from "./attendance-filters";
import { AttendanceGrid, type AttendanceStudent, type ExistingRecord } from "./attendance-grid";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const params = await searchParams;

  const sections = await prisma.section.findMany({
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
    include: { class: true },
  });

  const sectionOptions = sections.map((section) => ({
    id: section.id,
    label: `${section.class.name} - ${section.name}`,
  }));

  const sectionId = params.sectionId && sections.some((s) => s.id === params.sectionId)
    ? params.sectionId
    : sections[0]?.id;

  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : format(new Date(), "yyyy-MM-dd");

  const students = sectionId
    ? await prisma.student.findMany({
        where: { sectionId, isActive: true },
        include: { user: true },
        orderBy: [{ rollNo: "asc" }, { user: { name: "asc" } }],
      })
    : [];

  const attendanceDate = new Date(date + "T00:00:00");
  const records = sectionId
    ? await prisma.attendance.findMany({
        where: { sectionId, date: attendanceDate },
      })
    : [];

  const existingRecords: Record<string, ExistingRecord> = {};
  for (const record of records) {
    existingRecords[record.studentId] = { status: record.status, remarks: record.remarks };
  }

  const attendanceStudents: AttendanceStudent[] = students.map((student) => ({
    id: student.id,
    name: student.user.name,
    admissionNo: student.admissionNo,
    rollNo: student.rollNo,
  }));

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE" || r.status === "HALF_DAY").length;

  return (
    <div>
      <PageHeader title="Attendance" description="Mark and review daily student attendance." />

      <AttendanceFilters basePath="/admin/attendance" sections={sectionOptions} sectionId={sectionId ?? ""} date={date} />

      {sectionId ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Present" value={presentCount} icon={UserCheck} />
            <StatCard label="Absent" value={absentCount} icon={UserX} />
            <StatCard label="Late / Half Day" value={lateCount} icon={Clock} />
          </div>

          <AttendanceGrid students={attendanceStudents} sectionId={sectionId} date={date} existingRecords={existingRecords} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No sections available. Create a class and section first.</p>
      )}
    </div>
  );
}
