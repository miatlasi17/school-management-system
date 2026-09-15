"use server";

import { revalidatePath } from "next/cache";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { bookSchema, issueBookSchema } from "@/lib/validations/library";
import { errorResult, type ActionResult } from "@/lib/action-result";

const FINE_PER_DAY = 0.5;

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function createBook(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.book.create({
      data: {
        title: parsed.data.title,
        author: parsed.data.author,
        isbn: parsed.data.isbn || null,
        category: parsed.data.category || null,
        publisher: parsed.data.publisher || null,
        totalCopies: parsed.data.totalCopies,
        availableCopies: parsed.data.totalCopies,
      },
    });
    revalidatePath("/admin/library");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create book.");
  }
}

export async function updateBook(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) return { error: "Book not found." };

    const newTotalCopies = parsed.data.totalCopies;
    const availableCopies = Math.min(
      newTotalCopies,
      Math.max(0, existing.availableCopies + (newTotalCopies - existing.totalCopies)),
    );

    await prisma.book.update({
      where: { id },
      data: {
        title: parsed.data.title,
        author: parsed.data.author,
        isbn: parsed.data.isbn || null,
        category: parsed.data.category || null,
        publisher: parsed.data.publisher || null,
        totalCopies: newTotalCopies,
        availableCopies,
      },
    });
    revalidatePath("/admin/library");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update book.");
  }
}

export async function deleteBook(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const activeIssues = await prisma.bookIssue.count({ where: { bookId: id, status: "ISSUED" } });
    if (activeIssues > 0) {
      return { error: "Cannot delete this book while copies are still issued to students." };
    }
    await prisma.book.delete({ where: { id } });
    revalidatePath("/admin/library");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete book.");
  }
}

// ---------------------------------------------------------------------------
// Book issues
// ---------------------------------------------------------------------------

export async function issueBook(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = issueBookSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: parsed.data.bookId } });
      if (!book || book.availableCopies <= 0) {
        throw new Error("NO_COPIES_AVAILABLE");
      }

      await tx.bookIssue.create({
        data: {
          bookId: parsed.data.bookId,
          studentId: parsed.data.studentId,
          dueDate: new Date(parsed.data.dueDate),
          status: "ISSUED",
        },
      });

      await tx.book.update({
        where: { id: parsed.data.bookId },
        data: { availableCopies: { decrement: 1 } },
      });
    });

    revalidatePath("/admin/library");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "NO_COPIES_AVAILABLE") {
      return { error: "No available copies of this book to issue." };
    }
    return errorResult(error, "Could not issue book.");
  }
}

export async function returnBook(bookIssueId: string): Promise<ActionResult> {
  await requireUser("ADMIN");

  try {
    await prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findUnique({ where: { id: bookIssueId } });
      if (!issue) throw new Error("NOT_FOUND");
      if (issue.status !== "ISSUED") throw new Error("ALREADY_RETURNED");

      const returnDate = new Date();
      const daysLate = Math.max(0, differenceInCalendarDays(returnDate, issue.dueDate));
      const fineAmount = daysLate * FINE_PER_DAY;

      await tx.bookIssue.update({
        where: { id: bookIssueId },
        data: { returnDate, status: "RETURNED", fineAmount },
      });

      const book = await tx.book.findUnique({ where: { id: issue.bookId } });
      if (book) {
        await tx.book.update({
          where: { id: issue.bookId },
          data: { availableCopies: Math.min(book.totalCopies, book.availableCopies + 1) },
        });
      }
    });

    revalidatePath("/admin/library");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_RETURNED") {
      return { error: "This book has already been returned." };
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "Book issue record not found." };
    }
    return errorResult(error, "Could not process the return.");
  }
}
