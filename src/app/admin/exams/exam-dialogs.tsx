"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { examSchema, type ExamInput } from "@/lib/validations/exams";
import { createExam, updateExam, deleteExam } from "@/actions/exams";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };

function ExamForm({
  defaultValues,
  academicYears,
  onSubmit,
  pending,
}: {
  defaultValues: ExamInput;
  academicYears: Option[];
  onSubmit: (values: ExamInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamInput>({ resolver: zodResolver(examSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Exam name</Label>
        <Input id="name" placeholder="e.g. Mid-Term Examination" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Academic year</Label>
        <Controller
          control={control}
          name="academicYearId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} items={toSelectItems(academicYears)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.academicYearId ? <p className="text-sm text-destructive">{errors.academicYearId.message}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate ? <p className="text-sm text-destructive">{errors.startDate.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate ? <p className="text-sm text-destructive">{errors.endDate.message}</p> : null}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddExamDialog({ academicYears }: { academicYears: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: ExamInput) {
    startTransition(async () => {
      const result = await createExam(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Exam created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Exam
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exam</DialogTitle>
          <DialogDescription>Schedule a new examination.</DialogDescription>
        </DialogHeader>
        <ExamForm
          defaultValues={{ name: "", academicYearId: academicYears[0]?.id ?? "", startDate: "", endDate: "" }}
          academicYears={academicYears}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditExamDialog({
  exam,
  academicYears,
}: {
  exam: { id: string; name: string; academicYearId: string; startDate: string; endDate: string };
  academicYears: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: ExamInput) {
    startTransition(async () => {
      const result = await updateExam(exam.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Exam updated");
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
          <DialogTitle>Edit exam</DialogTitle>
        </DialogHeader>
        <ExamForm
          defaultValues={{
            name: exam.name,
            academicYearId: exam.academicYearId,
            startDate: exam.startDate,
            endDate: exam.endDate,
          }}
          academicYears={academicYears}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteExamButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExam(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Exam deleted");
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
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this exam along with all its scheduled subjects and marks.
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
