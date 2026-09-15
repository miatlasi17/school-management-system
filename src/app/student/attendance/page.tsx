import { UserCheck, UserX, Clock, Percent } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PRESENT: "default",
  ABSENT: "destructive",
  LATE: "secondary",
  HALF_DAY: "secondary",
  EXCUSED: "outline",
};

const RECORD_LIMIT = 60;

export default async function StudentAttendancePage() {
  const { student } = await requireStudent();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [recentStats, records, totalCount] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: student.id, date: { gte: ninetyDaysAgo } },
      _count: true,
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: RECORD_LIMIT,
    }),
    prisma.attendance.count({ where: { studentId: student.id } }),
  ]);

  const presentCount = recentStats.find((s) => s.status === "PRESENT")?._count ?? 0;
  const absentCount = recentStats.find((s) => s.status === "ABSENT")?._count ?? 0;
  const lateCount =
    (recentStats.find((s) => s.status === "LATE")?._count ?? 0) +
    (recentStats.find((s) => s.status === "HALF_DAY")?._count ?? 0);
  const totalRecent = recentStats.reduce((sum, s) => sum + s._count, 0);
  const attendanceRate = totalRecent > 0 ? Math.round((presentCount / totalRecent) * 100) : null;

  return (
    <div>
      <PageHeader title="My Attendance" description="Your attendance record for the last 90 days." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Present" value={presentCount} icon={UserCheck} />
        <StatCard label="Absent" value={absentCount} icon={UserX} />
        <StatCard label="Late / Half Day" value={lateCount} icon={Clock} />
        <StatCard label="Attendance Rate" value={attendanceRate !== null ? `${attendanceRate}%` : "No data"} icon={Percent} />
      </div>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[record.status] ?? "outline"}>{record.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.remarks ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {totalCount > RECORD_LIMIT ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing the most recent {RECORD_LIMIT} of {totalCount} records.
        </p>
      ) : null}
    </div>
  );
}
