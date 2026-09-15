"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requireUser } from "@/lib/session";
import { examSchema, examSubjectSchema, marksEntrySchema } from "@/lib/validations/exams";
import { errorResult, type ActionResult } from "@/lib/action-result";

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export async function createExam(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.exam.create({
      data: {
        name: parsed.data.name,
        academicYearId: parsed.data.academicYearId,
        startDate: new Date(parsed.data.startDate + "T00:00:00"),
        endDate: new Date(parsed.data.endDate + "T00:00:00"),
      },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create exam.");
  }
}

export async function updateExam(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.exam.update({
      where: { id },
      data: {
        name: parsed.data.name,
        academicYearId: parsed.data.academicYearId,
        startDate: new Date(parsed.data.startDate + "T00:00:00"),
        endDate: new Date(parsed.data.endDate + "T00:00:00"),
      },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update exam.");
  }
}

export async function deleteExam(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.exam.delete({ where: { id } });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete exam.");
  }
}

// ---------------------------------------------------------------------------
// Exam Subjects
// ---------------------------------------------------------------------------

export async function createExamSubject(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = examSubjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.examSubject.create({
      data: {
        examId: parsed.data.examId,
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        invigilatorId: parsed.data.invigilatorId || null,
        examDate: parsed.data.examDate ? new Date(parsed.data.examDate + "T00:00:00") : null,
        maxMarks: parsed.data.maxMarks,
        passMarks: parsed.data.passMarks,
      },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "This subject is already scheduled for this class in this exam." };
    }
    return errorResult(error, "Could not schedule exam subject.");
  }
}

export async function updateExamSubject(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = examSubjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.examSubject.update({
      where: { id },
      data: {
        examId: parsed.data.examId,
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        invigilatorId: parsed.data.invigilatorId || null,
        examDate: parsed.data.examDate ? new Date(parsed.data.examDate + "T00:00:00") : null,
        maxMarks: parsed.data.maxMarks,
        passMarks: parsed.data.passMarks,
      },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "This subject is already scheduled for this class in this exam." };
    }
    return errorResult(error, "Could not update exam subject.");
  }
}

export async function deleteExamSubject(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.examSubject.delete({ where: { id } });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not remove exam subject.");
  }
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

export async function submitMarks(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to enter marks." };
  }

  const parsed = marksEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { examSubjectId, marks } = parsed.data;

  const examSubject = await prisma.examSubject.findUnique({ where: { id: examSubjectId } });
  if (!examSubject) return { error: "Exam subject not found." };

  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return { error: "Teacher record not found." };

    const classSubject = await prisma.classSubject.findUnique({
      where: {
        classId_subjectId: { classId: examSubject.classId, subjectId: examSubject.subjectId },
      },
    });
    if (!classSubject || classSubject.teacherId !== teacher.id) {
      return { error: "You are not assigned to teach this subject for this class." };
    }
  } else if (session.user.role !== "ADMIN") {
    return { error: "You are not authorized to enter marks." };
  }

  try {
    await prisma.$transaction(
      marks.map((mark) =>
        prisma.mark.upsert({
          where: { examSubjectId_studentId: { examSubjectId, studentId: mark.studentId } },
          update: {
            marksObtained: mark.isAbsent ? null : mark.marksObtained,
            isAbsent: mark.isAbsent,
            remarks: mark.remarks || null,
          },
          create: {
            examSubjectId,
            studentId: mark.studentId,
            marksObtained: mark.isAbsent ? null : mark.marksObtained,
            isAbsent: mark.isAbsent,
            remarks: mark.remarks || null,
          },
        })
      )
    );

    revalidatePath("/admin/exams");
    revalidatePath("/teacher/marks");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not save marks.");
  }
}
