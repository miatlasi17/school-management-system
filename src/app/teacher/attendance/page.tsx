import { format } from "date-fns";
import { UserCheck, UserX, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceFilters } from "@/app/admin/attendance/attendance-filters";
import { AttendanceGrid, type AttendanceStudent, type ExistingRecord } from "@/app/admin/attendance/attendance-grid";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const { teacher } = await requireTeacher();
  const params = await searchParams;

  const sections = await prisma.section.findMany({
    where: { classTeacherId: teacher.id },
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
    include: { class: true },
  });

  if (sections.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance" description="Mark and review daily student attendance." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You are not assigned as a class teacher for any section.
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionOptions = sections.map((section) => ({
    id: section.id,
    label: `${section.class.name} - ${section.name}`,
  }));

  const sectionId = params.sectionId && sections.some((s) => s.id === params.sectionId)
    ? params.sectionId
    : sections[0].id;

  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : format(new Date(), "yyyy-MM-dd");

  const students = await prisma.student.findMany({
    where: { sectionId, isActive: true },
    include: { user: true },
    orderBy: [{ rollNo: "asc" }, { user: { name: "asc" } }],
  });

  const attendanceDate = new Date(date + "T00:00:00");
  const records = await prisma.attendance.findMany({
    where: { sectionId, date: attendanceDate },
  });

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
      <PageHeader title="Attendance" description="Mark and review daily student attendance for your class." />

      <AttendanceFilters basePath="/teacher/attendance" sections={sectionOptions} sectionId={sectionId} date={date} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Present" value={presentCount} icon={UserCheck} />
        <StatCard label="Absent" value={absentCount} icon={UserX} />
        <StatCard label="Late / Half Day" value={lateCount} icon={Clock} />
      </div>

      <AttendanceGrid students={attendanceStudents} sectionId={sectionId} date={date} existingRecords={existingRecords} />
    </div>
  );
}
