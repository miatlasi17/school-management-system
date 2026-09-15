"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { examSubjectSchema, type ExamSubjectInput } from "@/lib/validations/exams";
import { createExamSubject, deleteExamSubject } from "@/actions/exams";

type Option = { id: string; label: string };

export function AddExamSubjectDialog({
  examId,
  classes,
  subjects,
  teachers,
}: {
  examId: string;
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const defaultValues: ExamSubjectInput = {
    examId,
    classId: classes[0]?.id ?? "",
    subjectId: subjects[0]?.id ?? "",
    invigilatorId: "",
    examDate: "",
    maxMarks: 100,
    passMarks: 35,
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamSubjectInput>({ resolver: zodResolver(examSubjectSchema), defaultValues });

  function onSubmit(values: ExamSubjectInput) {
    startTransition(async () => {
      const result = await createExamSubject({ ...values, examId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Subject scheduled");
      setOpen(false);
      reset(defaultValues);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Subject to Exam
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add subject to exam</DialogTitle>
          <DialogDescription>Schedule a class / subject combination for this exam.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Controller
              control={control}
              name="classId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.classId ? <p className="text-sm text-destructive">{errors.classId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Controller
              control={control}
              name="subjectId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subjectId ? <p className="text-sm text-destructive">{errors.subjectId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Invigilator</Label>
            <Controller
              control={control}
              name="invigilatorId"
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Exam date</Label>
            <Input id="examDate" type="date" {...register("examDate")} />
            {errors.examDate ? <p className="text-sm text-destructive">{errors.examDate.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max marks</Label>
              <Input id="maxMarks" type="number" {...register("maxMarks", { valueAsNumber: true })} />
              {errors.maxMarks ? <p className="text-sm text-destructive">{errors.maxMarks.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passMarks">Pass marks</Label>
              <Input id="passMarks" type="number" {...register("passMarks", { valueAsNumber: true })} />
              {errors.passMarks ? <p className="text-sm text-destructive">{errors.passMarks.message}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteExamSubjectButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExamSubject(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed from exam");
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
          <AlertDialogTitle>Remove {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this subject from the exam along with any marks entered for it.
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
