import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InvoiceStatus } from "@prisma/client";
import { RecordPaymentDialog } from "./payment-dialog";
import { EditInvoiceDialog, DeleteInvoiceButton } from "./edit-invoice-dialog";

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "outline",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;

  const [invoice, feeCategories] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { include: { user: true, section: { include: { class: true } } } },
        academicYear: true,
        items: { include: { feeCategory: true } },
        payments: { include: { receivedBy: true }, orderBy: { paymentDate: "desc" } },
      },
    }),
    prisma.feeCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!invoice) notFound();

  const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(total - paid, 0);

  return (
    <div>
      <Link
        href="/admin/fees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Fees
      </Link>

      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${invoice.academicYear.name} · Issued ${invoice.issueDate.toLocaleDateString()}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <EditInvoiceDialog
              invoiceId={invoice.id}
              dueDate={invoice.dueDate.toISOString().slice(0, 10)}
              items={invoice.items.map((item) => ({ feeCategoryId: item.feeCategoryId, amount: item.amount }))}
              feeCategories={feeCategories.map((c) => ({ id: c.id, label: c.name }))}
            />
            {invoice.payments.length === 0 ? <DeleteInvoiceButton invoiceId={invoice.id} /> : null}
            {balance > 0 ? <RecordPaymentDialog invoiceId={invoice.id} maxAmount={balance} /> : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{invoice.student.user.name}</p>
            <p className="text-muted-foreground">{invoice.student.admissionNo}</p>
            <p className="text-muted-foreground">
              {invoice.student.section
                ? `${invoice.student.section.class.name} - ${invoice.student.section.name}`
                : "No section assigned"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>{invoice.status}</Badge>
            <p className="text-muted-foreground">Due {invoice.dueDate.toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-2xl font-semibold tabular-nums">Rs. {balance.toLocaleString()}</p>
            <p className="text-muted-foreground">
              Rs. {paid.toLocaleString()} paid of Rs. {total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                    <TableCell className="text-right">Rs. {item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoice.payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentDate.toLocaleDateString()}</TableCell>
                      <TableCell>{payment.method.replace("_", " ")}</TableCell>
                      <TableCell>{payment.transactionRef ?? "—"}</TableCell>
                      <TableCell className="text-right">Rs. {payment.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
