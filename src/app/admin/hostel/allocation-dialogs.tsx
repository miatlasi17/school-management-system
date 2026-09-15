"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { allocateRoomSchema, type AllocateRoomInput } from "@/lib/validations/hostel";
import { allocateRoom, deallocateRoom } from "@/actions/hostel";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };

export function AllocateRoomDialog({
  roomId,
  occupied,
  capacity,
  students,
}: {
  roomId: string;
  occupied: number;
  capacity: number;
  students: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllocateRoomInput>({
    resolver: zodResolver(allocateRoomSchema),
    defaultValues: { roomId, studentId: "" },
  });

  const isFull = occupied >= capacity;

  function onSubmit(values: AllocateRoomInput) {
    startTransition(async () => {
      const result = await allocateRoom(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Student allocated");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  if (isFull) {
    return (
      <Button size="icon" variant="ghost" disabled title="Room is full">
        <UserPlus className="size-4" />
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <UserPlus className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate room</DialogTitle>
          <DialogDescription>Assign a student who is not already housed to this room.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Controller
              control={control}
              name="studentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={toSelectItems(students)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No unallocated students
                      </SelectItem>
                    ) : (
                      students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.studentId ? <p className="text-sm text-destructive">{errors.studentId.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || students.length === 0}>
              {pending ? "Saving..." : "Allocate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeallocateButton({ studentId, name }: { studentId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove() {
    startTransition(async () => {
      const result = await deallocateRoom(studentId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Allocation removed");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full hover:bg-destructive/20">
        <X className="size-3" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name} from this room?</AlertDialogTitle>
          <AlertDialogDescription>This will remove the student&apos;s room allocation.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleRemove}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
