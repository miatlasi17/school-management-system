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
import { classSchema, type ClassInput } from "@/lib/validations/academic";
import { createClass, updateClass, deleteClass } from "@/actions/academic";

function ClassForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: ClassInput;
  onSubmit: (values: ClassInput) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassInput>({ resolver: zodResolver(classSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Class name</Label>
        <Input id="name" placeholder="e.g. Grade 10" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="order">Display order</Label>
        <Input id="order" type="number" {...register("order", { valueAsNumber: true })} />
        {errors.order ? <p className="text-sm text-destructive">{errors.order.message}</p> : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddClassDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: ClassInput) {
    startTransition(async () => {
      const result = await createClass(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Class created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Class
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add class</DialogTitle>
          <DialogDescription>Create a new class / grade level.</DialogDescription>
        </DialogHeader>
        <ClassForm defaultValues={{ name: "", order: 0 }} onSubmit={handleSubmit} pending={pending} />
      </DialogContent>
    </Dialog>
  );
}

export function EditClassDialog({ id, name, order }: { id: string; name: string; order: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: ClassInput) {
    startTransition(async () => {
      const result = await updateClass(id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Class updated");
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
          <DialogTitle>Edit class</DialogTitle>
        </DialogHeader>
        <ClassForm defaultValues={{ name, order }} onSubmit={handleSubmit} pending={pending} />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteClassButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClass(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Class deleted");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" />}>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this class. Sections must be removed first.
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
