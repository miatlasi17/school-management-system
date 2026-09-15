"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { auth } from "@/auth";
import { noticeSchema, eventSchema, sendMessageSchema } from "@/lib/validations/communication";
import { errorResult, type ActionResult } from "@/lib/action-result";

function revalidateNotices() {
  revalidatePath("/admin/notices");
  revalidatePath("/teacher/notices");
  revalidatePath("/student/notices");
}

function revalidateMessages() {
  revalidatePath("/admin/messages");
  revalidatePath("/teacher/messages");
  revalidatePath("/student/messages");
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

export async function createNotice(input: unknown): Promise<ActionResult> {
  const user = await requireUser("ADMIN");
  const parsed = noticeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.notice.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        audience: parsed.data.audience,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
        publishedById: user.id,
      },
    });
    revalidateNotices();
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create notice.");
  }
}

export async function deleteNotice(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.notice.delete({ where: { id } });
    revalidateNotices();
    return { success: true };
  } catch {
    return { error: "Could not delete notice." };
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function createEvent(input: unknown): Promise<ActionResult> {
  const user = await requireUser("ADMIN");
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        audience: parsed.data.audience,
        publishedById: user.id,
      },
    });
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create event.");
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.event.delete({ where: { id } });
    revalidatePath("/admin/events");
    return { success: true };
  } catch {
    return { error: "Could not delete event." };
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in to send a message." };

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.receiverId === session.user.id) {
    return { error: "You cannot send a message to yourself." };
  }

  try {
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: parsed.data.receiverId,
        subject: parsed.data.subject,
        body: parsed.data.body,
      },
    });
    revalidateMessages();
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not send message.");
  }
}

export async function markMessageRead(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };

  try {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return { error: "Message not found." };
    if (message.receiverId !== session.user.id) {
      return { error: "You can only mark your own received messages as read." };
    }
    if (!message.readAt) {
      await prisma.message.update({ where: { id }, data: { readAt: new Date() } });
    }
    revalidateMessages();
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not mark message as read.");
  }
}
