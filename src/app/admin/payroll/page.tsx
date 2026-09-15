import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, Wallet, CheckCircle2, Clock } from "lucide-react";
import { PayrollFilters } from "./payroll-filters";
import { GeneratePayrollButton, MarkPaidButton } from "./payroll-actions";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();

  const parsedMonth = Number(params.month);
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;

  const parsedYear = Number(params.year);
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : now.getFullYear();

  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { teacher: { include: { user: true } }, staff: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = payrolls.filter((p) => p.status === "PAID").length;
  const pendingCount = payrolls.filter((p) => p.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Generate and track monthly payroll for teachers and staff."
        action={<GeneratePayrollButton month={month} year={year} />}
      />

      <PayrollFilters month={month} year={year} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Gross" value={`£${totalGross.toLocaleString()}`} icon={Banknote} />
        <StatCard label="Total Net" value={`£${totalNet.toLocaleString()}`} icon={Wallet} />
        <StatCard label="Paid" value={paidCount} icon={CheckCircle2} />
        <StatCard label="Pending" value={pendingCount} icon={Clock} />
      </div>

      <Card>
        <CardContent className="p-0">
          {payrolls.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No payroll records for {MONTH_NAMES[month - 1]} {year} yet. Generate payroll to create them from
              teachers and staff who have a salary structure set.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">
                      {payroll.teacher ? payroll.teacher.user.name : (payroll.staff?.name ?? "—")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payroll.teacher ? "Teacher" : "Staff"}</Badge>
                    </TableCell>
                    <TableCell>£{payroll.grossSalary.toLocaleString()}</TableCell>
                    <TableCell>£{payroll.deductions.toLocaleString()}</TableCell>
                    <TableCell>£{payroll.netSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={payroll.status === "PAID" ? "default" : "secondary"}>{payroll.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payroll.status === "PENDING" ? <MarkPaidButton id={payroll.id} /> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
