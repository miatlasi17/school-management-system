import Link from "next/link";
import { DayOfWeek } from "@prisma/client";
import { CalendarClock, ClipboardCheck, Wallet, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
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

export default async function StudentDashboardPage() {
  const { student, user } = await requireStudent();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todaySlots, attendanceStats, invoices, notices] = await Promise.all([
    student.sectionId
      ? prisma.timetableSlot.findMany({
          where: { sectionId: student.sectionId, dayOfWeek: DAY_NAMES[new Date().getDay()] },
          include: { subject: true, teacher: { include: { user: true } } },
          orderBy: { startTime: "asc" },
        })
      : Promise.resolve([]),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: student.id, date: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { studentId: student.id, status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
    }),
    prisma.notice.findMany({
      where: { audience: { in: ["ALL", "STUDENTS"] } },
      orderBy: { publishDate: "desc" },
      take: 5,
    }),
  ]);

  const presentCount = attendanceStats.find((a) => a.status === "PRESENT")?._count ?? 0;
  const totalCount = attendanceStats.reduce((sum, a) => sum + a._count, 0);
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name}`} description={`${student.section?.class.name ?? ""} ${student.section?.name ?? ""}`.trim()} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Attendance (30 days)"
          value={attendanceRate !== null ? `${attendanceRate}%` : "No data"}
          icon={ClipboardCheck}
        />
        <StatCard label="Today's Periods" value={todaySlots.length} icon={CalendarClock} />
        <StatCard label="Unpaid Invoices" value={invoices.length} icon={Wallet} />
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
                    <p className="font-medium">{slot.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.startTime} - {slot.endTime} · {slot.teacher.user.name}
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
            <Link href="/student/notices" className="text-sm text-primary hover:underline">
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
