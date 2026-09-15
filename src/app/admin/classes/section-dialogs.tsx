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
import { sectionSchema, type SectionInput } from "@/lib/validations/academic";
import { createSection, updateSection, deleteSection } from "@/actions/academic";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };

function SectionForm({
  defaultValues,
  classes,
  teachers,
  onSubmit,
  pending,
}: {
  defaultValues: SectionInput;
  classes: Option[];
  teachers: Option[];
  onSubmit: (values: SectionInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionInput>({ resolver: zodResolver(sectionSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Class</Label>
        <Controller
          control={control}
          name="classId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} items={toSelectItems(classes)}>
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
        <Label htmlFor="name">Section name</Label>
        <Input id="name" placeholder="e.g. A" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomNumber">Room number</Label>
        <Input id="roomNumber" placeholder="Optional" {...register("roomNumber")} />
      </div>

      <div className="space-y-2">
        <Label>Class teacher</Label>
        <Controller
          control={control}
          name="classTeacherId"
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              items={{ none: "Unassigned", ...toSelectItems(teachers) }}
            >
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

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddSectionDialog({ classes, teachers }: { classes: Option[]; teachers: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: SectionInput) {
    startTransition(async () => {
      const result = await createSection(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Section created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Section
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add section</DialogTitle>
          <DialogDescription>Create a new section within a class.</DialogDescription>
        </DialogHeader>
        <SectionForm
          defaultValues={{ classId: classes[0]?.id ?? "", name: "", roomNumber: "", classTeacherId: "" }}
          classes={classes}
          teachers={teachers}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditSectionDialog({
  section,
  classes,
  teachers,
}: {
  section: { id: string; classId: string; name: string; roomNumber: string | null; classTeacherId: string | null };
  classes: Option[];
  teachers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: SectionInput) {
    startTransition(async () => {
      const result = await updateSection(section.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Section updated");
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
          <DialogTitle>Edit section</DialogTitle>
        </DialogHeader>
        <SectionForm
          defaultValues={{
            classId: section.classId,
            name: section.name,
            roomNumber: section.roomNumber ?? "",
            classTeacherId: section.classTeacherId ?? "",
          }}
          classes={classes}
          teachers={teachers}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSectionButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSection(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Section deleted");
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
          <AlertDialogTitle>Delete section {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this section. Students must be reassigned first.
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
