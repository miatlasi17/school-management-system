"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Pencil, Copy } from "lucide-react";
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
import { createTeacherSchema, type CreateTeacherInput } from "@/lib/validations/people";
import { createTeacher, updateTeacher } from "@/actions/people";

const GENDER_ITEMS = { unspecified: "Unspecified", MALE: "Male", FEMALE: "Female", OTHER: "Other" };

const emptyTeacher: CreateTeacherInput = {
  name: "",
  email: "",
  employeeId: "",
  phone: "",
  address: "",
  gender: "",
  qualification: "",
  joiningDate: "",
};

// ---------------------------------------------------------------------------
// Shared form
// ---------------------------------------------------------------------------

function TeacherForm({
  defaultValues,
  onSubmit,
  pending,
  submitLabel,
}: {
  defaultValues: CreateTeacherInput;
  onSubmit: (values: CreateTeacherInput) => void;
  pending: boolean;
  submitLabel: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeacherInput>({ resolver: zodResolver(createTeacherSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto px-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="e.g. Priya Sharma" {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="teacher@school.test" {...register("email")} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input id="employeeId" placeholder="e.g. T-1006" {...register("employeeId")} />
          {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                value={field.value || "unspecified"}
                onValueChange={(v) => field.onChange(v === "unspecified" || v === null ? "" : (v as CreateTeacherInput["gender"]))}
                items={GENDER_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Optional" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" placeholder="e.g. B.Ed." {...register("qualification")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="joiningDate">Joining date</Label>
          <Input id="joiningDate" type="date" {...register("joiningDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="Optional" {...register("address")} />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Add
// ---------------------------------------------------------------------------

export function AddTeacherDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(values: CreateTeacherInput) {
    startTransition(async () => {
      const result = await createTeacher(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Teacher created");
      setCreatedPassword(result.password);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setCreatedPassword(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Teacher
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {createdPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Teacher created</DialogTitle>
              <DialogDescription>
                Share this temporary password with the teacher. For security, it will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="text-sm font-medium break-all">{createdPassword}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(createdPassword).then(
                    () => toast.success("Password copied to clipboard"),
                    () => toast.error("Could not copy password")
                  );
                }}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add teacher</DialogTitle>
              <DialogDescription>Create a teacher account.</DialogDescription>
            </DialogHeader>
            <TeacherForm defaultValues={emptyTeacher} onSubmit={handleSubmit} pending={pending} submitLabel="Create teacher" />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------------

export type TeacherEditData = {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  phone: string | null;
  address: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  qualification: string | null;
  joiningDate: Date;
};

export function EditTeacherDialog({ teacher }: { teacher: TeacherEditData }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: CreateTeacherInput) {
    startTransition(async () => {
      const result = await updateTeacher(teacher.id, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Teacher updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit teacher</DialogTitle>
        </DialogHeader>
        <TeacherForm
          defaultValues={{
            name: teacher.name,
            email: teacher.email,
            employeeId: teacher.employeeId,
            phone: teacher.phone ?? "",
            address: teacher.address ?? "",
            gender: teacher.gender ?? "",
            qualification: teacher.qualification ?? "",
            joiningDate: format(teacher.joiningDate, "yyyy-MM-dd"),
          }}
          onSubmit={handleSubmit}
          pending={pending}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
