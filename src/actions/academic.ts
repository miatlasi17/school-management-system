"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { classSchema, sectionSchema, subjectSchema, classSubjectSchema } from "@/lib/validations/academic";
import { errorResult, type ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export async function createClass(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.schoolClass.create({ data: parsed.data });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create class.");
  }
}

export async function updateClass(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.schoolClass.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update class.");
  }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.schoolClass.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Could not delete class. Remove its sections first." };
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function createSection(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.section.create({
      data: {
        classId: parsed.data.classId,
        name: parsed.data.name,
        roomNumber: parsed.data.roomNumber || null,
        classTeacherId: parsed.data.classTeacherId || null,
      },
    });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create section.");
  }
}

export async function updateSection(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.section.update({
      where: { id },
      data: {
        classId: parsed.data.classId,
        name: parsed.data.name,
        roomNumber: parsed.data.roomNumber || null,
        classTeacherId: parsed.data.classTeacherId || null,
      },
    });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update section.");
  }
}

export async function deleteSection(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.section.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Could not delete section. Remove its students first." };
  }
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function createSubject(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.subject.create({ data: parsed.data });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create subject.");
  }
}

export async function updateSubject(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.subject.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update subject.");
  }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.subject.delete({ where: { id } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { error: "Could not delete subject. It may still be assigned to a class." };
  }
}

export async function assignClassSubject(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = classSubjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: parsed.data.classId, subjectId: parsed.data.subjectId } },
      update: { teacherId: parsed.data.teacherId || null },
      create: {
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        teacherId: parsed.data.teacherId || null,
      },
    });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not assign subject.");
  }
}

export async function removeClassSubject(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.classSubject.delete({ where: { id } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not remove assignment.");
  }
}
