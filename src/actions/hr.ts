"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { staffSchema, salaryStructureSchema, generatePayrollSchema } from "@/lib/validations/hr";
import { errorResult, type ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export async function createStaff(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.staff.create({
      data: {
        employeeId: parsed.data.employeeId,
        name: parsed.data.name,
        designation: parsed.data.designation,
        department: parsed.data.department || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        gender: parsed.data.gender || null,
        joiningDate: parsed.data.joiningDate ? new Date(parsed.data.joiningDate) : undefined,
      },
    });
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create staff member.");
  }
}

export async function updateStaff(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.staff.update({
      where: { id },
      data: {
        employeeId: parsed.data.employeeId,
        name: parsed.data.name,
        designation: parsed.data.designation,
        department: parsed.data.department || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        gender: parsed.data.gender || null,
        joiningDate: parsed.data.joiningDate ? new Date(parsed.data.joiningDate) : undefined,
      },
    });
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update staff member.");
  }
}

// Soft toggle rather than a hard delete since a staff member may already have payroll history.
export async function setStaffActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.staff.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update staff status.");
  }
}

// ---------------------------------------------------------------------------
// Salary structures
// ---------------------------------------------------------------------------

export async function upsertSalaryStructure(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = salaryStructureSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { teacherId, staffId, basic, allowances, deductions } = parsed.data;

  try {
    if (teacherId) {
      await prisma.salaryStructure.upsert({
        where: { teacherId },
        update: { basic, allowances, deductions },
        create: { teacherId, basic, allowances, deductions },
      });
    } else if (staffId) {
      await prisma.salaryStructure.upsert({
        where: { staffId },
        update: { basic, allowances, deductions },
        create: { staffId, basic, allowances, deductions },
      });
    } else {
      return { error: "A teacher or staff member is required." };
    }
    revalidatePath("/admin/payroll");
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not save salary structure.");
  }
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export async function generatePayroll(
  input: unknown
): Promise<{ error: string } | { success: true; count: number }> {
  await requireUser("ADMIN");
  const parsed = generatePayrollSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { month, year } = parsed.data;

  try {
    const [teachers, staffMembers] = await Promise.all([
      prisma.teacher.findMany({
        where: { salaryStructure: { isNot: null } },
        include: { salaryStructure: true },
      }),
      prisma.staff.findMany({
        where: { isActive: true, salaryStructure: { isNot: null } },
        include: { salaryStructure: true },
      }),
    ]);

    let count = 0;

    // Note: Payroll's compound unique index ([teacherId, staffId, month, year]) has two nullable
    // columns, and Prisma's generated compound-unique `where` input types those fields as required
    // (non-null) — it won't accept `staffId: null` / `teacherId: null` there even though the column
    // itself is nullable. So instead of `payroll.upsert` on that compound key, look the row up with a
    // regular (non-unique) `findFirst`, which does accept `null`, then update or create explicitly.
    for (const teacher of teachers) {
      const structure = teacher.salaryStructure;
      if (!structure) continue;
      const grossSalary = structure.basic + structure.allowances;
      const netSalary = grossSalary - structure.deductions;
      const existing = await prisma.payroll.findFirst({
        where: { teacherId: teacher.id, staffId: null, month, year },
      });
      if (existing) {
        await prisma.payroll.update({
          where: { id: existing.id },
          data: { grossSalary, deductions: structure.deductions, netSalary },
        });
      } else {
        await prisma.payroll.create({
          data: {
            teacherId: teacher.id,
            staffId: null,
            month,
            year,
            grossSalary,
            deductions: structure.deductions,
            netSalary,
            status: "PENDING",
            paymentDate: null,
          },
        });
      }
      count++;
    }

    for (const staff of staffMembers) {
      const structure = staff.salaryStructure;
      if (!structure) continue;
      const grossSalary = structure.basic + structure.allowances;
      const netSalary = grossSalary - structure.deductions;
      const existing = await prisma.payroll.findFirst({
        where: { teacherId: null, staffId: staff.id, month, year },
      });
      if (existing) {
        await prisma.payroll.update({
          where: { id: existing.id },
          data: { grossSalary, deductions: structure.deductions, netSalary },
        });
      } else {
        await prisma.payroll.create({
          data: {
            teacherId: null,
            staffId: staff.id,
            month,
            year,
            grossSalary,
            deductions: structure.deductions,
            netSalary,
            status: "PENDING",
            paymentDate: null,
          },
        });
      }
      count++;
    }

    revalidatePath("/admin/payroll");
    return { success: true, count };
  } catch {
    return { error: "Could not generate payroll. Please try again." };
  }
}

export async function markPayrollPaid(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.payroll.update({
      where: { id },
      data: { status: "PAID", paymentDate: new Date() },
    });
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not mark payroll as paid.");
  }
}

// Only removes rows still PENDING for the period; PAID rows are kept as a historical record.
export async function deletePayrollRun(
  month: number,
  year: number
): Promise<{ error: string } | { success: true; message?: string }> {
  await requireUser("ADMIN");
  try {
    const paidCount = await prisma.payroll.count({ where: { month, year, status: "PAID" } });
    await prisma.payroll.deleteMany({ where: { month, year, status: "PENDING" } });
    revalidatePath("/admin/payroll");
    return {
      success: true,
      message: paidCount > 0 ? `${paidCount} already-paid record(s) were kept.` : undefined,
    };
  } catch {
    return { error: "Could not delete payroll run. Please try again." };
  }
}
