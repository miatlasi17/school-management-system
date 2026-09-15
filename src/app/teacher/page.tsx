import Link from "next/link";
import { Users, ClipboardCheck, CalendarClock, Megaphone } from "lucide-react";
import { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAY_NAMES: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export default async function TeacherDashboardPage() {
  const { teacher, user } = await requireTeacher();

  const [classSubjects, classTeacherSections, todaySlots, notices] = await Promise.all([
    prisma.classSubject.findMany({
      where: { teacherId: teacher.id },
      include: { class: true, subject: true },
    }),
    prisma.section.findMany({ where: { classTeacherId: teacher.id }, include: { class: true, _count: { select: { students: true } } } }),
    prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id, dayOfWeek: DAY_NAMES[new Date().getDay()] },
      include: { section: { include: { class: true } }, subject: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.notice.findMany({
      where: { audience: { in: ["ALL", "TEACHERS"] } },
      orderBy: { publishDate: "desc" },
      take: 5,
    }),
  ]);

  const studentCount = await prisma.student.count({
    where: { sectionId: { in: classTeacherSections.map((s) => s.id) } },
  });

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name}`} description="Here's what's happening today." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Subjects Taught" value={classSubjects.length} icon={ClipboardCheck} />
        <StatCard label="Class Teacher For" value={classTeacherSections.length} icon={Users} hint={`${studentCount} students`} />
        <StatCard label="Today's Periods" value={todaySlots.length} icon={CalendarClock} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            ) : (
              todaySlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      {slot.subject.name} · {slot.section.class.name} {slot.section.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slot.startTime} - {slot.endTime} {slot.room ? `· Room ${slot.room}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4" /> Notices
            </CardTitle>
            <Link href="/teacher/notices" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.publishDate.toLocaleDateString()}</p>
                  </div>
                  <Badge variant="secondary">{n.audience}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
