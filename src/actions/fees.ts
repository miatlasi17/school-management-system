"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { feeCategorySchema, feeStructureSchema, recordPaymentSchema, updateInvoiceSchema } from "@/lib/validations/fees";
import { errorResult, type ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Fee Categories
// ---------------------------------------------------------------------------

export async function createFeeCategory(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = feeCategorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.feeCategory.create({ data: parsed.data });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create fee category.");
  }
}

export async function deleteFeeCategory(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.feeCategory.delete({ where: { id } });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch {
    return { error: "Could not delete fee category. It may still be used by a fee structure or invoice." };
  }
}

// ---------------------------------------------------------------------------
// Fee Structures
// ---------------------------------------------------------------------------

export async function upsertFeeStructure(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = feeStructureSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.feeStructure.upsert({
      where: {
        classId_feeCategoryId_academicYearId: {
          classId: parsed.data.classId,
          feeCategoryId: parsed.data.feeCategoryId,
          academicYearId: parsed.data.academicYearId,
        },
      },
      update: { amount: parsed.data.amount },
      create: parsed.data,
    });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not save fee structure.");
  }
}

export async function deleteFeeStructure(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.feeStructure.delete({ where: { id } });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete fee structure.");
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

type GenerateInvoicesResult = { error: string } | { success: true; created: number };

async function generateUniqueInvoiceNumber(): Promise<string | null> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    const candidate = `INV-${year}-${suffix}`;
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
    if (!existing) return candidate;
  }
  return null;
}

export async function generateInvoicesForClass(
  classId: string,
  academicYearId: string,
  dueDate: string
): Promise<GenerateInvoicesResult> {
  await requireUser("ADMIN");

  if (!classId || !academicYearId || !dueDate) {
    return { error: "Class, academic year and due date are required." };
  }
  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return { error: "Invalid due date." };
  }

  try {
    const structures = await prisma.feeStructure.findMany({ where: { classId, academicYearId } });
    if (structures.length === 0) {
      return { error: "No fee structure has been defined for this class and academic year." };
    }

    const students = await prisma.student.findMany({
      where: { isActive: true, section: { classId } },
      select: { id: true },
    });
    if (students.length === 0) {
      return { error: "No active students found in this class." };
    }

    const existingInvoices = await prisma.invoice.findMany({
      where: { academicYearId, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true },
    });
    const alreadyInvoiced = new Set(existingInvoices.map((i) => i.studentId));
    const pendingStudents = students.filter((s) => !alreadyInvoiced.has(s.id));

    let created = 0;
    for (const student of pendingStudents) {
      const invoiceNumber = await generateUniqueInvoiceNumber();
      if (!invoiceNumber) continue;

      await prisma.invoice.create({
        data: {
          studentId: student.id,
          academicYearId,
          invoiceNumber,
          dueDate: parsedDueDate,
          items: {
            create: structures.map((s) => ({ feeCategoryId: s.feeCategoryId, amount: s.amount })),
          },
        },
      });
      created += 1;
    }

    revalidatePath("/admin/fees");
    return { success: true, created };
  } catch {
    return { error: "Could not generate invoices." };
  }
}

export async function updateInvoice(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = updateInvoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) return { error: "Invalid due date." };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!invoice) return { error: "Invoice not found." };

    const newTotal = parsed.data.items.reduce((sum, item) => sum + item.amount, 0);
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const status: InvoiceStatus =
      invoice.status === InvoiceStatus.CANCELLED
        ? InvoiceStatus.CANCELLED
        : paid >= newTotal && newTotal > 0
          ? InvoiceStatus.PAID
          : paid > 0
            ? InvoiceStatus.PARTIALLY_PAID
            : InvoiceStatus.UNPAID;

    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.update({
        where: { id },
        data: {
          dueDate,
          status,
          items: { create: parsed.data.items },
        },
      }),
    ]);

    revalidatePath("/admin/fees");
    revalidatePath(`/admin/fees/${id}`);
    revalidatePath("/student/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update invoice.");
  }
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } },
    });
    if (!invoice) return { error: "Invoice not found." };
    if (invoice._count.payments > 0) {
      return { error: "Cannot delete an invoice that already has payments recorded." };
    }
    await prisma.invoice.delete({ where: { id } });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete invoice.");
  }
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordPayment(input: unknown): Promise<ActionResult> {
  const user = await requireUser("ADMIN");
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      include: { items: true, payments: true },
    });
    if (!invoice) return { error: "Invoice not found." };

    await prisma.payment.create({
      data: {
        invoiceId: parsed.data.invoiceId,
        amount: parsed.data.amount,
        method: parsed.data.method,
        transactionRef: parsed.data.transactionRef || null,
        receivedById: user.id,
      },
    });

    const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + parsed.data.amount;

    const status: InvoiceStatus =
      paid >= total ? InvoiceStatus.PAID : paid > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.UNPAID;

    await prisma.invoice.update({ where: { id: parsed.data.invoiceId }, data: { status } });

    revalidatePath("/admin/fees");
    revalidatePath(`/admin/fees/${parsed.data.invoiceId}`);
    revalidatePath("/student/fees");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not record payment.");
  }
}
