"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DayOfWeek } from "@prisma/client";
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
import { timetableSlotSchema, DAY_OF_WEEK_VALUES, DAY_LABELS, type TimetableSlotInput } from "@/lib/validations/timetable";
import { createTimetableSlot, updateTimetableSlot, deleteTimetableSlot } from "@/actions/timetable";

type Option = { id: string; label: string };

function SlotForm({
  defaultValues,
  subjects,
  teachers,
  onSubmit,
  pending,
}: {
  defaultValues: TimetableSlotInput;
  subjects: Option[];
  teachers: Option[];
  onSubmit: (values: TimetableSlotInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TimetableSlotInput>({ resolver: zodResolver(timetableSlotSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Label>Teacher</Label>
        <Controller
          control={control}
          name="teacherId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.teacherId ? <p className="text-sm text-destructive">{errors.teacherId.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Day</Label>
        <Controller
          control={control}
          name="dayOfWeek"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {DAY_OF_WEEK_VALUES.map((day) => (
                  <SelectItem key={day} value={day}>
                    {DAY_LABELS[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.dayOfWeek ? <p className="text-sm text-destructive">{errors.dayOfWeek.message}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {errors.startTime ? <p className="text-sm text-destructive">{errors.startTime.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
          {errors.endTime ? <p className="text-sm text-destructive">{errors.endTime.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room">Room</Label>
        <Input id="room" placeholder="Optional" {...register("room")} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddSlotDialog({
  sectionId,
  subjects,
  teachers,
}: {
  sectionId: string;
  subjects: Option[];
  teachers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: TimetableSlotInput) {
    startTransition(async () => {
      const result = await createTimetableSlot({ ...values, sectionId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Slot created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Slot
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add timetable slot</DialogTitle>
          <DialogDescription>Schedule a period for this section.</DialogDescription>
        </DialogHeader>
        <SlotForm
          defaultValues={{
            sectionId,
            subjectId: subjects[0]?.id ?? "",
            teacherId: teachers[0]?.id ?? "",
            dayOfWeek: "MONDAY",
            startTime: "09:00",
            endTime: "09:45",
            room: "",
          }}
          subjects={subjects}
          teachers={teachers}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditSlotDialog({
  slot,
  subjects,
  teachers,
}: {
  slot: {
    id: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string | null;
  };
  subjects: Option[];
  teachers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: TimetableSlotInput) {
    startTransition(async () => {
      const result = await updateTimetableSlot(slot.id, { ...values, sectionId: slot.sectionId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Slot updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon-sm" variant="ghost" />}>
        <Pencil className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit timetable slot</DialogTitle>
        </DialogHeader>
        <SlotForm
          defaultValues={{
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room ?? "",
          }}
          subjects={subjects}
          teachers={teachers}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSlotButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTimetableSlot(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Slot deleted");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" />}
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete slot?</AlertDialogTitle>
          <AlertDialogDescription>This will remove {label} from the timetable.</AlertDialogDescription>
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
