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
import { routeSchema, type RouteInput } from "@/lib/validations/transport";
import { createRoute, updateRoute, deleteRoute } from "@/actions/transport";

type Option = { id: string; label: string };

function RouteForm({
  defaultValues,
  vehicles,
  onSubmit,
  pending,
}: {
  defaultValues: RouteInput;
  vehicles: Option[];
  onSubmit: (values: RouteInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteInput>({ resolver: zodResolver(routeSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Route name</Label>
        <Input id="name" placeholder="e.g. North Loop" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Vehicle</Label>
        <Controller
          control={control}
          name="vehicleId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fare">Fare</Label>
        <Input id="fare" type="number" step="0.01" {...register("fare", { valueAsNumber: true })} />
        {errors.fare ? <p className="text-sm text-destructive">{errors.fare.message}</p> : null}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddRouteDialog({ vehicles }: { vehicles: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RouteInput) {
    startTransition(async () => {
      const result = await createRoute(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Route created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Route
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add route</DialogTitle>
          <DialogDescription>Create a new transport route.</DialogDescription>
        </DialogHeader>
        <RouteForm
          defaultValues={{ name: "", vehicleId: "", fare: 0 }}
          vehicles={vehicles}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditRouteDialog({
  route,
  vehicles,
}: {
  route: { id: string; name: string; vehicleId: string | null; fare: number };
  vehicles: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RouteInput) {
    startTransition(async () => {
      const result = await updateRoute(route.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Route updated");
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
          <DialogTitle>Edit route</DialogTitle>
        </DialogHeader>
        <RouteForm
          defaultValues={{
            name: route.name,
            vehicleId: route.vehicleId ?? "",
            fare: route.fare,
          }}
          vehicles={vehicles}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRouteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRoute(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Route deleted");
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
            This will permanently delete this route along with its stops and student assignments.
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
