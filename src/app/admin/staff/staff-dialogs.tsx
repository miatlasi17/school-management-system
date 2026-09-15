"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
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
import { staffSchema, type StaffInput } from "@/lib/validations/hr";
import { createStaff, updateStaff, setStaffActive } from "@/actions/hr";

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const;
const GENDER_ITEMS: Record<string, string> = {
  unspecified: "Unspecified",
  ...Object.fromEntries(GENDER_OPTIONS.map((g) => [g, g.charAt(0) + g.slice(1).toLowerCase()])),
};

function StaffForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: StaffInput;
  onSubmit: (values: StaffInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffInput>({ resolver: zodResolver(staffSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input id="employeeId" placeholder="e.g. ST-2002" {...register("employeeId")} />
          {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="e.g. Grace Muthoni" {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" placeholder="e.g. Front Office Manager" {...register("designation")} />
          {errors.designation ? <p className="text-sm text-destructive">{errors.designation.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="Optional" {...register("department")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Optional" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Optional" {...register("email")} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="Optional" {...register("address")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                value={field.value || "unspecified"}
                onValueChange={(v) => field.onChange(v === "unspecified" ? "" : v)}
                items={GENDER_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joiningDate">Joining date</Label>
          <Input id="joiningDate" type="date" {...register("joiningDate")} />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: StaffInput) {
    startTransition(async () => {
      const result = await createStaff(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Staff member added");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Staff
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
          <DialogDescription>Create a new non-teaching staff record.</DialogDescription>
        </DialogHeader>
        <StaffForm
          defaultValues={{
            employeeId: "",
            name: "",
            designation: "",
            department: "",
            phone: "",
            email: "",
            address: "",
            gender: "",
            joiningDate: "",
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

type StaffRecord = {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  joiningDate: Date;
};

export function EditStaffDialog({ staff }: { staff: StaffRecord }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: StaffInput) {
    startTransition(async () => {
      const result = await updateStaff(staff.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Staff member updated");
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
          <DialogTitle>Edit staff member</DialogTitle>
        </DialogHeader>
        <StaffForm
          defaultValues={{
            employeeId: staff.employeeId,
            name: staff.name,
            designation: staff.designation,
            department: staff.department ?? "",
            phone: staff.phone ?? "",
            email: staff.email ?? "",
            address: staff.address ?? "",
            gender: staff.gender ?? "",
            joiningDate: staff.joiningDate.toISOString().slice(0, 10),
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ToggleStaffActiveButton({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const result = await setStaffActive(id, !isActive);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Staff member marked inactive" : "Staff member marked active");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className={isActive ? "text-destructive hover:text-destructive" : ""}
          />
        }
      >
        {isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? "Deactivate" : "Reactivate"} {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? "This staff member will be excluded from future payroll runs. Their payroll history is kept."
              : "This staff member will be included in future payroll runs again."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleToggle}>
            {isActive ? "Deactivate" : "Reactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
