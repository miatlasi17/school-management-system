"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { assignTransportSchema, type AssignTransportInput } from "@/lib/validations/transport";
import { assignStudentTransport, removeStudentTransport } from "@/actions/transport";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };
type StopOption = { id: string; name: string; routeId: string };

export function AssignTransportDialog({
  students,
  routes,
  stops,
}: {
  students: Option[];
  routes: Option[];
  stops: StopOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignTransportInput>({
    resolver: zodResolver(assignTransportSchema),
    defaultValues: { studentId: "", routeId: "", stopId: "" },
  });

  const selectedRouteId = useWatch({ control, name: "routeId" });
  const stopsForRoute = stops.filter((s) => s.routeId === selectedRouteId);

  function onSubmit(values: AssignTransportInput) {
    startTransition(async () => {
      const result = await assignStudentTransport(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Transport assigned");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Assign Student
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign transport</DialogTitle>
          <DialogDescription>Assign a student to a route and pickup stop.</DialogDescription>
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
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.studentId ? <p className="text-sm text-destructive">{errors.studentId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Route</Label>
            <Controller
              control={control}
              name="routeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={toSelectItems(routes)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.routeId ? <p className="text-sm text-destructive">{errors.routeId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Stop</Label>
            <Controller
              control={control}
              name="stopId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  disabled={!selectedRouteId}
                  items={{ none: "No stop", ...toSelectItems(stopsForRoute.map((s) => ({ id: s.id, label: s.name }))) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No stop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No stop</SelectItem>
                    {stopsForRoute.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemoveTransportButton({ studentId, name }: { studentId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeStudentTransport(studentId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Assignment removed");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" />}
      >
        <Trash2 className="size-4" /> Remove
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove transport for {name}?</AlertDialogTitle>
          <AlertDialogDescription>This will remove the student&apos;s transport assignment.</AlertDialogDescription>
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
