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
import { hostelSchema, type HostelInput } from "@/lib/validations/hostel";
import { createHostel, updateHostel, deleteHostel } from "@/actions/hostel";

const HOSTEL_TYPE_ITEMS = { BOYS: "Boys", GIRLS: "Girls" };

function HostelForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: HostelInput;
  onSubmit: (values: HostelInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HostelInput>({ resolver: zodResolver(hostelSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Hostel name</Label>
        <Input id="name" placeholder="e.g. Elm House" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} items={HOSTEL_TYPE_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOYS">Boys</SelectItem>
                <SelectItem value="GIRLS">Girls</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type ? <p className="text-sm text-destructive">{errors.type.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="warden">Warden</Label>
        <Input id="warden" placeholder="Optional" {...register("warden")} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddHostelDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: HostelInput) {
    startTransition(async () => {
      const result = await createHostel(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Hostel created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Hostel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add hostel</DialogTitle>
          <DialogDescription>Create a new hostel.</DialogDescription>
        </DialogHeader>
        <HostelForm defaultValues={{ name: "", type: "BOYS", warden: "" }} onSubmit={handleSubmit} pending={pending} />
      </DialogContent>
    </Dialog>
  );
}

export function EditHostelDialog({
  hostel,
}: {
  hostel: { id: string; name: string; type: "BOYS" | "GIRLS"; warden: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: HostelInput) {
    startTransition(async () => {
      const result = await updateHostel(hostel.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Hostel updated");
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
          <DialogTitle>Edit hostel</DialogTitle>
        </DialogHeader>
        <HostelForm
          defaultValues={{ name: hostel.name, type: hostel.type, warden: hostel.warden ?? "" }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteHostelButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteHostel(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Hostel deleted");
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
            This will permanently delete this hostel. Rooms must be removed first.
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
