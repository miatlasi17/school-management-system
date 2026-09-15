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
import { routeStopSchema, type RouteStopInput } from "@/lib/validations/transport";
import { createRouteStop, updateRouteStop, deleteRouteStop } from "@/actions/transport";

function StopForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: RouteStopInput;
  onSubmit: (values: RouteStopInput) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteStopInput>({ resolver: zodResolver(routeStopSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("routeId")} />
      <div className="space-y-2">
        <Label htmlFor="name">Stop name</Label>
        <Input id="name" placeholder="e.g. Maple Street" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="pickupTime">Pickup time</Label>
        <Input id="pickupTime" placeholder="e.g. 07:30" {...register("pickupTime")} />
        {errors.pickupTime ? <p className="text-sm text-destructive">{errors.pickupTime.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="order">Order</Label>
        <Input id="order" type="number" {...register("order", { valueAsNumber: true })} />
        {errors.order ? <p className="text-sm text-destructive">{errors.order.message}</p> : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddStopDialog({ routeId }: { routeId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RouteStopInput) {
    startTransition(async () => {
      const result = await createRouteStop(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Stop added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Stop
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add stop</DialogTitle>
          <DialogDescription>Add a new pickup stop to this route.</DialogDescription>
        </DialogHeader>
        <StopForm
          defaultValues={{ routeId, name: "", pickupTime: "", order: 0 }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditStopDialog({
  stop,
  routeId,
}: {
  stop: { id: string; name: string; pickupTime: string | null; order: number };
  routeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: RouteStopInput) {
    startTransition(async () => {
      const result = await updateRouteStop(stop.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Stop updated");
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
          <DialogTitle>Edit stop</DialogTitle>
        </DialogHeader>
        <StopForm
          defaultValues={{
            routeId,
            name: stop.name,
            pickupTime: stop.pickupTime ?? "",
            order: stop.order,
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteStopButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRouteStop(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Stop deleted");
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
          <AlertDialogTitle>Delete stop {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this stop. Students assigned here will keep their route but lose this stop.
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
