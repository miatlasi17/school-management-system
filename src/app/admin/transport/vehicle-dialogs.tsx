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
import { vehicleSchema, type VehicleInput } from "@/lib/validations/transport";
import { createVehicle, updateVehicle, deleteVehicle } from "@/actions/transport";

function VehicleForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: VehicleInput;
  onSubmit: (values: VehicleInput) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleInput>({ resolver: zodResolver(vehicleSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="number">Vehicle number</Label>
        <Input id="number" placeholder="e.g. SCH-101" {...register("number")} />
        {errors.number ? <p className="text-sm text-destructive">{errors.number.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} />
        {errors.capacity ? <p className="text-sm text-destructive">{errors.capacity.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="driverName">Driver name</Label>
        <Input id="driverName" placeholder="Optional" {...register("driverName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="driverPhone">Driver phone</Label>
        <Input id="driverPhone" placeholder="Optional" {...register("driverPhone")} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: VehicleInput) {
    startTransition(async () => {
      const result = await createVehicle(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Vehicle created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Vehicle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
          <DialogDescription>Register a new transport vehicle.</DialogDescription>
        </DialogHeader>
        <VehicleForm
          defaultValues={{ number: "", capacity: 1, driverName: "", driverPhone: "" }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditVehicleDialog({
  vehicle,
}: {
  vehicle: { id: string; number: string; capacity: number; driverName: string | null; driverPhone: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: VehicleInput) {
    startTransition(async () => {
      const result = await updateVehicle(vehicle.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Vehicle updated");
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
          <DialogTitle>Edit vehicle</DialogTitle>
        </DialogHeader>
        <VehicleForm
          defaultValues={{
            number: vehicle.number,
            capacity: vehicle.capacity,
            driverName: vehicle.driverName ?? "",
            driverPhone: vehicle.driverPhone ?? "",
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteVehicleButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteVehicle(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Vehicle deleted");
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
            This will permanently delete this vehicle. It must not be assigned to any route.
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
