"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { markAttendanceSchema } from "@/lib/validations/attendance";
import { errorResult, type ActionResult } from "@/lib/action-result";

export async function submitAttendance(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to mark attendance." };
  }

  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { sectionId, date, records } = parsed.data;

  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return { error: "Teacher record not found." };

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.classTeacherId !== teacher.id) {
      return { error: "You are not the class teacher for this section." };
    }
  } else if (session.user.role !== "ADMIN") {
    return { error: "You are not authorized to mark attendance." };
  }

  const attendanceDate = new Date(date + "T00:00:00");

  try {
    await prisma.$transaction(
      records.map((record) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: record.studentId, date: attendanceDate } },
          update: {
            status: record.status,
            remarks: record.remarks || null,
            markedById: session.user.id,
            sectionId,
          },
          create: {
            studentId: record.studentId,
            sectionId,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks || null,
            markedById: session.user.id,
          },
        })
      )
    );

    revalidatePath("/admin/attendance");
    revalidatePath("/teacher/attendance");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not save attendance.");
  }
}
