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
import { Textarea } from "@/components/ui/textarea";
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
import { eventSchema, type EventInput } from "@/lib/validations/communication";
import { createEvent, deleteEvent } from "@/actions/communication";
import { toSelectItems } from "@/lib/utils";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Everyone" },
  { value: "TEACHERS", label: "Teachers" },
  { value: "STUDENTS", label: "Students" },
] as const;
const AUDIENCE_ITEMS = toSelectItems(AUDIENCE_OPTIONS);

function EventForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: EventInput;
  onSubmit: (values: EventInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EventInput>({ resolver: zodResolver(eventSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. Annual Sports Day" {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} placeholder="Optional details" {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="Optional" {...register("location")} />
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

      <div className="space-y-2">
        <Label>Audience</Label>
        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} items={AUDIENCE_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.audience ? <p className="text-sm text-destructive">{errors.audience.message}</p> : null}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: EventInput) {
    startTransition(async () => {
      const result = await createEvent(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Event created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Event
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>Schedule a new school event.</DialogDescription>
        </DialogHeader>
        <EventForm
          defaultValues={{ title: "", description: "", location: "", startDate: "", endDate: "", audience: "ALL" }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEvent(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Event deleted");
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
          <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete this event.</AlertDialogDescription>
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
