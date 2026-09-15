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
import { roomSchema, type RoomInput } from "@/lib/validations/hostel";
import { createRoom, updateRoom, deleteRoom } from "@/actions/hostel";

function RoomForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: RoomInput;
  onSubmit: (values: RoomInput) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomInput>({ resolver: zodResolver(roomSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("hostelId")} />
      <div className="space-y-2">
        <Label htmlFor="roomNumber">Room number</Label>
        <Input id="roomNumber" placeholder="e.g. 101" {...register("roomNumber")} />
        {errors.roomNumber ? <p className="text-sm text-destructive">{errors.roomNumber.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} />
        {errors.capacity ? <p className="text-sm text-destructive">{errors.capacity.message}</p> : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddRoomDialog({ hostelId }: { hostelId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RoomInput) {
    startTransition(async () => {
      const result = await createRoom(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Room added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Room
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add room</DialogTitle>
          <DialogDescription>Add a new room to this hostel.</DialogDescription>
        </DialogHeader>
        <RoomForm defaultValues={{ hostelId, roomNumber: "", capacity: 1 }} onSubmit={handleSubmit} pending={pending} />
      </DialogContent>
    </Dialog>
  );
}

export function EditRoomDialog({
  room,
  hostelId,
}: {
  room: { id: string; roomNumber: string; capacity: number };
  hostelId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RoomInput) {
    startTransition(async () => {
      const result = await updateRoom(room.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Room updated");
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
          <DialogTitle>Edit room</DialogTitle>
        </DialogHeader>
        <RoomForm
          defaultValues={{ hostelId, roomNumber: room.roomNumber, capacity: room.capacity }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoomButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRoom(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Room deleted");
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
          <AlertDialogTitle>Delete room {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this room. Occupants must be removed first.
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
