"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResult, type ActionResult } from "@/lib/action-result";
import {
  createStudentSchema,
  updateStudentSchema,
  createTeacherSchema,
  updateTeacherSchema,
} from "@/lib/validations/people";

// A generated-password result is returned once, on creation only — callers
// need to display it to the admin, so it's not part of the shared ActionResult.
type CreatePersonResult = { success: true; password: string } | { error: string };

function generatePassword() {
  return crypto.randomBytes(6).toString("base64url");
}

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function friendlyUniqueError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
    const meta = (error as { meta?: { target?: string[] | string } }).meta;
    const target = Array.isArray(meta?.target) ? meta.target.join(",") : String(meta?.target ?? "");
    if (target.includes("email")) return "A user with this email already exists.";
    if (target.includes("admissionNo")) return "A student with this admission number already exists.";
    if (target.includes("employeeId")) return "A teacher with this employee ID already exists.";
    return "A record with these details already exists.";
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function createStudent(input: unknown): Promise<CreatePersonResult> {
  await requireUser("ADMIN");
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: Role.STUDENT,
        },
      });
      await tx.student.create({
        data: {
          userId: user.id,
          admissionNo: data.admissionNo,
          rollNo: data.rollNo || null,
          sectionId: data.sectionId,
          gender: data.gender || null,
          dateOfBirth: toDate(data.dateOfBirth),
          address: data.address || null,
          phone: data.phone || null,
          guardianName: data.guardianName || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          bloodGroup: data.bloodGroup || null,
        },
      });
    });
    revalidatePath("/admin/students");
    return { success: true, password };
  } catch (error) {
    return { error: friendlyUniqueError(error, "Could not create student.") };
  }
}

export async function updateStudent(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = updateStudentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const student = await prisma.student.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: { name: data.name, email: data.email.toLowerCase(), isActive: data.isActive },
      }),
      prisma.student.update({
        where: { id },
        data: {
          admissionNo: data.admissionNo,
          rollNo: data.rollNo || null,
          sectionId: data.sectionId,
          gender: data.gender || null,
          dateOfBirth: toDate(data.dateOfBirth),
          address: data.address || null,
          phone: data.phone || null,
          guardianName: data.guardianName || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          bloodGroup: data.bloodGroup || null,
          isActive: data.isActive,
        },
      }),
    ]);
    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${id}`);
    return { success: true };
  } catch (error) {
    return { error: friendlyUniqueError(error, "Could not update student.") };
  }
}

export async function setStudentActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const student = await prisma.student.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    await prisma.$transaction([
      prisma.student.update({ where: { id }, data: { isActive } }),
      prisma.user.update({ where: { id: student.userId }, data: { isActive } }),
    ]);
    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${id}`);
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update student status.");
  }
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function createTeacher(input: unknown): Promise<CreatePersonResult> {
  await requireUser("ADMIN");
  const parsed = createTeacherSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: Role.TEACHER,
        },
      });
      await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          phone: data.phone || null,
          address: data.address || null,
          gender: data.gender || null,
          qualification: data.qualification || null,
          joiningDate: toDate(data.joiningDate) ?? undefined,
        },
      });
    });
    revalidatePath("/admin/teachers");
    return { success: true, password };
  } catch (error) {
    return { error: friendlyUniqueError(error, "Could not create teacher.") };
  }
}

export async function updateTeacher(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = updateTeacherSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.userId },
        data: { name: data.name, email: data.email.toLowerCase() },
      }),
      prisma.teacher.update({
        where: { id },
        data: {
          employeeId: data.employeeId,
          phone: data.phone || null,
          address: data.address || null,
          gender: data.gender || null,
          qualification: data.qualification || null,
          joiningDate: toDate(data.joiningDate) ?? undefined,
        },
      }),
    ]);
    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    return { success: true };
  } catch (error) {
    return { error: friendlyUniqueError(error, "Could not update teacher.") };
  }
}
