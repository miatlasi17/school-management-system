"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hostelSchema, roomSchema, allocateRoomSchema } from "@/lib/validations/hostel";
import { errorResult, type ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Hostels
// ---------------------------------------------------------------------------

export async function createHostel(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = hostelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.hostel.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        warden: parsed.data.warden || null,
      },
    });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create hostel.");
  }
}

export async function updateHostel(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = hostelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.hostel.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        warden: parsed.data.warden || null,
      },
    });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update hostel.");
  }
}

export async function deleteHostel(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const roomCount = await prisma.room.count({ where: { hostelId: id } });
    if (roomCount > 0) {
      return { error: "Could not delete hostel. Remove its rooms first." };
    }
    await prisma.hostel.delete({ where: { id } });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete hostel.");
  }
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function createRoom(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.room.create({ data: parsed.data });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create room.");
  }
}

export async function updateRoom(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.room.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update room.");
  }
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const occupantCount = await prisma.roomAllocation.count({ where: { roomId: id } });
    if (occupantCount > 0) {
      return { error: "Could not delete room. Remove its occupants first." };
    }
    await prisma.room.delete({ where: { id } });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete room.");
  }
}

// ---------------------------------------------------------------------------
// Room allocations
// ---------------------------------------------------------------------------

export async function allocateRoom(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = allocateRoomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const room = await prisma.room.findUnique({
      where: { id: parsed.data.roomId },
      include: { _count: { select: { allocations: true } } },
    });
    if (!room) return { error: "Room not found." };

    const existing = await prisma.roomAllocation.findUnique({
      where: { studentId: parsed.data.studentId },
    });

    // Only enforce capacity when the student isn't already occupying this same room.
    if ((!existing || existing.roomId !== parsed.data.roomId) && room._count.allocations >= room.capacity) {
      return { error: "Room is full." };
    }

    await prisma.roomAllocation.upsert({
      where: { studentId: parsed.data.studentId },
      update: { roomId: parsed.data.roomId },
      create: { roomId: parsed.data.roomId, studentId: parsed.data.studentId },
    });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not allocate room.");
  }
}

export async function deallocateRoom(studentId: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.roomAllocation.delete({ where: { studentId } });
    revalidatePath("/admin/hostel");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not remove allocation.");
  }
}
