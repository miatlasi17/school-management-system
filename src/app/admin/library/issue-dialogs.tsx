"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { BookPlus, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { issueBookSchema, type IssueBookInput } from "@/lib/validations/library";
import { issueBook, returnBook } from "@/actions/library";

type BookOption = { id: string; label: string; availableCopies: number };
type StudentOption = { id: string; label: string };

export function IssueBookDialog({
  books,
  students,
  book,
}: {
  books: BookOption[];
  students: StudentOption[];
  /** When provided, the dialog issues this specific book instead of offering a book picker. */
  book?: BookOption;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const defaultDueDate = format(addDays(new Date(), 14), "yyyy-MM-dd");
  const defaultValues: IssueBookInput = { bookId: book?.id ?? "", studentId: "", dueDate: defaultDueDate };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueBookInput>({ resolver: zodResolver(issueBookSchema), defaultValues });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleFormSubmit(values: IssueBookInput) {
    startTransition(async () => {
      const result = await issueBook(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Book issued");
      setOpen(false);
      router.refresh();
    });
  }

  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const disabled = book ? book.availableCopies === 0 : availableBooks.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant={book ? "outline" : "default"} className="gap-1.5" disabled={disabled} />}
      >
        {book ? (
          "Issue"
        ) : (
          <>
            <BookPlus className="size-4" /> Issue Book
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue book</DialogTitle>
          <DialogDescription>Assign a book copy to a student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Book</Label>
            {book ? (
              <>
                <p className="text-sm font-medium">{book.label}</p>
                <input type="hidden" {...register("bookId")} />
              </>
            ) : (
              <Controller
                control={control}
                name="bookId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label} ({b.availableCopies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.bookId ? <p className="text-sm text-destructive">{errors.bookId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Student</Label>
            <Controller
              control={control}
              name="studentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.studentId ? <p className="text-sm text-destructive">{errors.studentId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate ? <p className="text-sm text-destructive">{errors.dueDate.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Issuing..." : "Issue book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReturnBookButton({
  bookIssueId,
  bookTitle,
  studentName,
  dueDate,
}: {
  bookIssueId: string;
  bookTitle: string;
  studentName: string;
  dueDate: Date;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const now = new Date();
  const isOverdue = now > dueDate;
  const daysLate = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const estimatedFine = daysLate * 0.5;

  function handleReturn() {
    startTransition(async () => {
      const result = await returnBook(bookIssueId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Book marked as returned");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Undo2 className="size-4" /> Return
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Return &ldquo;{bookTitle}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the book as returned by {studentName} and restore one available copy.
            {isOverdue
              ? ` This return is ${daysLate} day${daysLate === 1 ? "" : "s"} overdue — a fine of £${estimatedFine.toFixed(2)} will be recorded.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleReturn}>
            {pending ? "Processing..." : "Confirm return"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
