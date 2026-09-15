import Link from "next/link";
import { Wallet, Banknote, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";
import { GenerateInvoicesDialog } from "./generate-invoices-dialog";
import { AddEditFeeStructureDialog, DeleteFeeStructureButton } from "./fee-structure-dialogs";
import { AddFeeCategoryDialog, DeleteFeeCategoryButton } from "./fee-category-dialogs";

const STATUS_FILTERS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "outline",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export default async function AdminFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = STATUS_FILTERS.some((s) => s.value === params.status) ? params.status : undefined;

  const [classes, academicYears, feeCategories, feeStructures, invoices, outstandingInvoices, currentYear] =
    await Promise.all([
      prisma.schoolClass.findMany({ orderBy: { order: "asc" } }),
      prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
      prisma.feeCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.schoolClass.findMany({
        orderBy: { order: "asc" },
        include: {
          feeStructures: {
            include: { feeCategory: true, academicYear: true },
            orderBy: [{ academicYear: { startDate: "desc" } }, { feeCategory: { name: "asc" } }],
          },
        },
      }),
      prisma.invoice.findMany({
        where: statusFilter ? { status: statusFilter as InvoiceStatus } : undefined,
        include: {
          student: { include: { user: true, section: { include: { class: true } } } },
          items: true,
          payments: true,
        },
        orderBy: { issueDate: "desc" },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
        include: { items: true, payments: true },
      }),
      prisma.academicYear.findFirst({ where: { isCurrent: true } }),
    ]);

  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => {
    const total = inv.items.reduce((s, i) => s + i.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(total - paid, 0);
  }, 0);

  const totalCollected = currentYear
    ? await prisma.payment.aggregate({
        where: { paymentDate: { gte: currentYear.startDate, lte: currentYear.endDate } },
        _sum: { amount: true },
      })
    : { _sum: { amount: 0 } };

  const classOptions = classes.map((c) => ({ id: c.id, label: c.name }));
  const academicYearOptions = academicYears.map((y) => ({ id: y.id, label: y.name }));
  const feeCategoryOptions = feeCategories.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div>
      <PageHeader title="Fees & Finance" description="Manage fee categories, fee structures and student invoices." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Outstanding" value={`Rs. ${totalOutstanding.toLocaleString()}`} icon={Wallet} />
        <StatCard
          label="Collected This Year"
          value={`Rs. ${(totalCollected._sum.amount ?? 0).toLocaleString()}`}
          icon={Banknote}
          hint={currentYear ? currentYear.name : "No current academic year set"}
        />
        <StatCard label="Unpaid Invoices" value={outstandingInvoices.length} icon={ReceiptText} />
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="categories">Fee Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <Link
                  key={s.value}
                  href={s.value === "ALL" ? "/admin/fees" : `/admin/fees?status=${s.value}`}
                  className={cn(
                    "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                    (statusFilter ?? "ALL") === s.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <GenerateInvoicesDialog classes={classOptions} academicYears={academicYearOptions} />
          </div>

          <Card>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No invoices found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const total = invoice.items.reduce((s, i) => s + i.amount, 0);
                      const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
                      return (
                        <TableRow key={invoice.id} className="cursor-pointer">
                          <TableCell className="p-0">
                            <Link href={`/admin/fees/${invoice.id}`} className="flex items-center px-4 py-2">
                              {invoice.student.user.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              {invoice.student.section
                                ? `${invoice.student.section.class.name} - ${invoice.student.section.name}`
                                : "—"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              Rs. {total.toLocaleString()}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              Rs. {paid.toLocaleString()}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>{invoice.status}</Badge>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/fees/${invoice.id}`} className="block py-2">
                              {invoice.dueDate.toLocaleDateString()}
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          <div className="mb-4 flex justify-end">
            <AddEditFeeStructureDialog
              classes={classOptions}
              categories={feeCategoryOptions}
              academicYears={academicYearOptions}
            />
          </div>

          <div className="space-y-4">
            {feeStructures.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">No classes yet.</CardContent>
              </Card>
            ) : (
              feeStructures.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{cls.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cls.feeStructures.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No fee structure defined for this class yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Academic Year</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cls.feeStructures.map((fs) => (
                            <TableRow key={fs.id}>
                              <TableCell className="font-medium">{fs.feeCategory.name}</TableCell>
                              <TableCell>{fs.academicYear.name}</TableCell>
                              <TableCell>Rs. {fs.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <AddEditFeeStructureDialog
                                    classes={classOptions}
                                    categories={feeCategoryOptions}
                                    academicYears={academicYearOptions}
                                    feeStructure={{
                                      id: fs.id,
                                      classId: cls.id,
                                      feeCategoryId: fs.feeCategoryId,
                                      academicYearId: fs.academicYearId,
                                      amount: fs.amount,
                                    }}
                                  />
                                  <DeleteFeeStructureButton id={fs.id} label={`${cls.name} · ${fs.feeCategory.name}`} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="mb-4 flex justify-end">
            <AddFeeCategoryDialog />
          </div>
          <Card>
            <CardContent className="p-0">
              {feeCategories.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No fee categories yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <DeleteFeeCategoryButton id={category.id} name={category.name} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
