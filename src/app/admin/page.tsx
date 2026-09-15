import Link from "next/link";
import { Users, GraduationCap, Wallet, ClipboardCheck, Megaphone, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    studentCount,
    teacherCount,
    sectionCount,
    outstandingInvoices,
    todayAttendance,
    notices,
    upcomingEvents,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.teacher.count(),
    prisma.section.count(),
    prisma.invoice.findMany({ where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { date: { gte: todayStart, lte: todayEnd } },
      _count: true,
    }),
    prisma.notice.findMany({ orderBy: { publishDate: "desc" }, take: 5 }),
    prisma.event.findMany({ where: { startDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 5 }),
  ]);

  const outstandingTotal = await Promise.all(
    outstandingInvoices.map(async (inv) => {
      const items = await prisma.invoiceItem.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } });
      const paid = await prisma.payment.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } });
      return (items._sum.amount ?? 0) - (paid._sum.amount ?? 0);
    })
  );
  const totalOutstanding = outstandingTotal.reduce((a, b) => a + b, 0);

  const presentToday = todayAttendance.find((a) => a.status === "PRESENT")?._count ?? 0;
  const totalMarkedToday = todayAttendance.reduce((sum, a) => sum + a._count, 0);
  const attendanceRate = totalMarkedToday > 0 ? Math.round((presentToday / totalMarkedToday) * 100) : null;

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of your school, right now." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Students" value={studentCount} icon={Users} />
        <StatCard label="Teachers" value={teacherCount} icon={GraduationCap} hint={`${sectionCount} sections`} />
        <StatCard
          label="Outstanding Fees"
          value={`£${totalOutstanding.toLocaleString()}`}
          icon={Wallet}
          hint={`${outstandingInvoices.length} unpaid invoices`}
        />
        <StatCard
          label="Attendance Today"
          value={attendanceRate !== null ? `${attendanceRate}%` : "Not marked"}
          icon={ClipboardCheck}
          hint={totalMarkedToday > 0 ? `${presentToday}/${totalMarkedToday} present` : "No records yet"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4" /> Recent Notices
            </CardTitle>
            <Link href="/admin/notices" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices published yet.</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.publishDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{n.audience}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" /> Upcoming Events
            </CardTitle>
            <Link href="/admin/events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.location ?? "TBD"}</p>
                  </div>
                  <Badge variant="outline">{e.startDate.toLocaleDateString()}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
