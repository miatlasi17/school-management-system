"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { bookSchema, type BookInput } from "@/lib/validations/library";
import { createBook, updateBook, deleteBook } from "@/actions/library";

function BookForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: BookInput;
  onSubmit: (values: BookInput) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookInput>({ resolver: zodResolver(bookSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. To Kill a Mockingbird" {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input id="author" placeholder="e.g. Harper Lee" {...register("author")} />
        {errors.author ? <p className="text-sm text-destructive">{errors.author.message}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input id="isbn" placeholder="Optional" {...register("isbn")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="Optional" {...register("category")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="publisher">Publisher</Label>
        <Input id="publisher" placeholder="Optional" {...register("publisher")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="totalCopies">Total copies</Label>
        <Input id="totalCopies" type="number" min={1} {...register("totalCopies", { valueAsNumber: true })} />
        {errors.totalCopies ? <p className="text-sm text-destructive">{errors.totalCopies.message}</p> : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddBookDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: BookInput) {
    startTransition(async () => {
      const result = await createBook(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Book added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Book
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add book</DialogTitle>
          <DialogDescription>Add a new book to the library catalog.</DialogDescription>
        </DialogHeader>
        <BookForm
          defaultValues={{ title: "", author: "", isbn: "", category: "", publisher: "", totalCopies: 1 }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditBookDialog({
  book,
}: {
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    category: string | null;
    publisher: string | null;
    totalCopies: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: BookInput) {
    startTransition(async () => {
      const result = await updateBook(book.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Book updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit book</DialogTitle>
        </DialogHeader>
        <BookForm
          defaultValues={{
            title: book.title,
            author: book.author,
            isbn: book.isbn ?? "",
            category: book.category ?? "",
            publisher: book.publisher ?? "",
            totalCopies: book.totalCopies,
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBookButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBook(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Book deleted");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" />}
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this book. It cannot be deleted while copies are issued to students.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
