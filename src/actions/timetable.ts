"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { timetableSlotSchema, type TimetableSlotInput } from "@/lib/validations/timetable";
import { errorResult, type ActionResult } from "@/lib/action-result";

function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

async function findConflict(
  data: Pick<TimetableSlotInput, "sectionId" | "teacherId" | "dayOfWeek" | "startTime" | "endTime">,
  excludeId?: string
): Promise<string | null> {
  const candidates = await prisma.timetableSlot.findMany({
    where: {
      dayOfWeek: data.dayOfWeek,
      OR: [{ teacherId: data.teacherId }, { sectionId: data.sectionId }],
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  for (const slot of candidates) {
    if (!timesOverlap(data.startTime, data.endTime, slot.startTime, slot.endTime)) continue;
    if (slot.teacherId === data.teacherId) {
      return "Teacher is already scheduled at this time.";
    }
    if (slot.sectionId === data.sectionId) {
      return "This section already has a class scheduled at this time.";
    }
  }
  return null;
}

export async function createTimetableSlot(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = timetableSlotSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const conflict = await findConflict(parsed.data);
  if (conflict) return { error: conflict };

  try {
    await prisma.timetableSlot.create({
      data: {
        sectionId: parsed.data.sectionId,
        subjectId: parsed.data.subjectId,
        teacherId: parsed.data.teacherId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room || null,
      },
    });
    revalidatePath("/admin/timetable");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create timetable slot.");
  }
}

export async function updateTimetableSlot(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = timetableSlotSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const conflict = await findConflict(parsed.data, id);
  if (conflict) return { error: conflict };

  try {
    await prisma.timetableSlot.update({
      where: { id },
      data: {
        sectionId: parsed.data.sectionId,
        subjectId: parsed.data.subjectId,
        teacherId: parsed.data.teacherId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room || null,
      },
    });
    revalidatePath("/admin/timetable");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update timetable slot.");
  }
}

export async function deleteTimetableSlot(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.timetableSlot.delete({ where: { id } });
    revalidatePath("/admin/timetable");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete timetable slot.");
  }
}
