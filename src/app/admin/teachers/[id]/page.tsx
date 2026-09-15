import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { DayOfWeek } from "@prisma/client";
import { ArrowLeft, BookOpen, Users, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: true,
      classSubjects: { include: { class: true, subject: true }, orderBy: { class: { order: "asc" } } },
      sectionsAsClassTeacher: { include: { class: true }, orderBy: { name: "asc" } },
      timetableSlots: {
        include: { section: { include: { class: true } }, subject: true },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!teacher) notFound();

  const slotsByDay = new Map<DayOfWeek, typeof teacher.timetableSlots>();
  for (const slot of teacher.timetableSlots) {
    if (!slotsByDay.has(slot.dayOfWeek)) slotsByDay.set(slot.dayOfWeek, []);
    slotsByDay.get(slot.dayOfWeek)!.push(slot);
  }

  return (
    <div>
      <Link
        href="/admin/teachers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to teachers
      </Link>

      <PageHeader
        title={teacher.user.name}
        description={`Employee ID ${teacher.employeeId}${teacher.qualification ? ` · ${teacher.qualification}` : ""}`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Subjects Taught" value={teacher.classSubjects.length} icon={BookOpen} />
        <StatCard label="Class Teacher For" value={teacher.sectionsAsClassTeacher.length} icon={Users} />
        <StatCard label="Weekly Periods" value={teacher.timetableSlots.length} icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Email" value={teacher.user.email} />
            <ProfileField label="Phone" value={teacher.phone ?? "—"} />
            <ProfileField label="Gender" value={teacher.gender ?? "—"} />
            <ProfileField
              label="Date of birth"
              value={teacher.dateOfBirth ? format(teacher.dateOfBirth, "d MMM yyyy") : "—"}
            />
            <ProfileField label="Joining date" value={format(teacher.joiningDate, "d MMM yyyy")} />
            <ProfileField label="Address" value={teacher.address ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class Teacher For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teacher.sectionsAsClassTeacher.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not a class teacher for any section.</p>
            ) : (
              teacher.sectionsAsClassTeacher.map((section) => (
                <div key={section.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                  <span>
                    {section.class.name} {section.name}
                  </span>
                  <Badge variant="secondary">{section.roomNumber ?? "No room"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Subjects &amp; Classes Taught</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teacher.classSubjects.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No subjects assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacher.classSubjects.map((cs) => (
                  <TableRow key={cs.id}>
                    <TableCell>{cs.class.name}</TableCell>
                    <TableCell>{cs.subject.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teacher.timetableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timetable slots assigned yet.</p>
          ) : (
            WEEK_ORDER.filter((day) => slotsByDay.has(day)).map((day) => (
              <div key={day}>
                <p className="mb-2 text-sm font-medium">{day.charAt(0) + day.slice(1).toLowerCase()}</p>
                <div className="space-y-2">
                  {slotsByDay.get(day)!.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">
                          {slot.subject.name} · {slot.section.class.name} {slot.section.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime} {slot.room ? `· Room ${slot.room}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
