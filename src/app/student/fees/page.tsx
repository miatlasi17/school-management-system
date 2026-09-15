import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Banknote, ReceiptText } from "lucide-react";
import type { InvoiceStatus } from "@prisma/client";

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "outline",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export default async function StudentFeesPage() {
  const { student } = await requireStudent();

  const invoices = await prisma.invoice.findMany({
    where: { studentId: student.id },
    include: {
      academicYear: true,
      items: { include: { feeCategory: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
    orderBy: { issueDate: "desc" },
  });

  const summaries = invoices.map((invoice) => {
    const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    return { invoice, total, paid, balance: Math.max(total - paid, 0) };
  });

  const totalOutstanding = summaries.reduce((sum, s) => sum + s.balance, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.paid, 0);
  const unpaidCount = invoices.filter((i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID" || i.status === "OVERDUE").length;

  return (
    <div>
      <PageHeader title="Fees" description="Your invoices, payments and outstanding balance." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding Balance" value={`£${totalOutstanding.toLocaleString()}`} icon={Wallet} />
        <StatCard label="Total Paid" value={`£${totalPaid.toLocaleString()}`} icon={Banknote} />
        <StatCard label="Unpaid Invoices" value={unpaidCount} icon={ReceiptText} />
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No invoices have been issued to you yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {summaries.map(({ invoice, total, paid, balance }) => (
            <Card key={invoice.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{invoice.invoiceNumber}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.academicYear.name} · Due {invoice.dueDate.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>{invoice.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold tabular-nums">£{total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-lg font-semibold tabular-nums">£{paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold tabular-nums">£{balance.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Line Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.feeCategory.name}</TableCell>
                          <TableCell className="text-right">£{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {invoice.payments.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Payment History</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentDate.toLocaleDateString()}</TableCell>
                            <TableCell>{payment.method.replace("_", " ")}</TableCell>
                            <TableCell className="text-right">£{payment.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
