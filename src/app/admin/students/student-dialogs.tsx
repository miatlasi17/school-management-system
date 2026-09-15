"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createStudentSchema, type CreateStudentInput } from "@/lib/validations/people";
import { createStudent, updateStudent, setStudentActive } from "@/actions/people";

type Option = { id: string; label: string };

const emptyStudent: CreateStudentInput = {
  name: "",
  email: "",
  admissionNo: "",
  rollNo: "",
  sectionId: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  bloodGroup: "",
};

// ---------------------------------------------------------------------------
// Shared form
// ---------------------------------------------------------------------------

function StudentForm({
  defaultValues,
  sections,
  onSubmit,
  pending,
  submitLabel,
}: {
  defaultValues: CreateStudentInput;
  sections: Option[];
  onSubmit: (values: CreateStudentInput) => void;
  pending: boolean;
  submitLabel: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudentInput>({ resolver: zodResolver(createStudentSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto px-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="e.g. Emma Bennett" {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="student@school.test" {...register("email")} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admissionNo">Admission No.</Label>
          <Input id="admissionNo" placeholder="e.g. S-02001" {...register("admissionNo")} />
          {errors.admissionNo ? <p className="text-sm text-destructive">{errors.admissionNo.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNo">Roll No.</Label>
          <Input id="rollNo" placeholder="Optional" {...register("rollNo")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Section</Label>
          <Controller
            control={control}
            name="sectionId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.sectionId ? <p className="text-sm text-destructive">{errors.sectionId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                value={field.value || "unspecified"}
                onValueChange={(v) => field.onChange(v === "unspecified" || v === null ? "" : (v as CreateStudentInput["gender"]))}
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
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood group</Label>
          <Input id="bloodGroup" placeholder="e.g. O+" {...register("bloodGroup")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Optional" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="Optional" {...register("address")} />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-medium">Guardian details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian name</Label>
            <Input id="guardianName" placeholder="Optional" {...register("guardianName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian phone</Label>
            <Input id="guardianPhone" placeholder="Optional" {...register("guardianPhone")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardianEmail">Guardian email</Label>
          <Input id="guardianEmail" type="email" placeholder="Optional" {...register("guardianEmail")} />
          {errors.guardianEmail ? <p className="text-sm text-destructive">{errors.guardianEmail.message}</p> : null}
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

export function AddStudentDialog({ sections }: { sections: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(values: CreateStudentInput) {
    startTransition(async () => {
      const result = await createStudent(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Student created");
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
        <Plus className="size-4" /> Add Student
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {createdPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Student created</DialogTitle>
              <DialogDescription>
                Share this temporary password with the student. For security, it will not be shown again.
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
              <DialogTitle>Add student</DialogTitle>
              <DialogDescription>Create a student account and enrol them in a section.</DialogDescription>
            </DialogHeader>
            <StudentForm
              defaultValues={emptyStudent}
              sections={sections}
              onSubmit={handleSubmit}
              pending={pending}
              submitLabel="Create student"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------------

export type StudentEditData = {
  id: string;
  name: string;
  email: string;
  admissionNo: string;
  rollNo: string | null;
  sectionId: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth: Date | null;
  address: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  bloodGroup: string | null;
  isActive: boolean;
};

export function EditStudentDialog({ student, sections }: { student: StudentEditData; sections: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: CreateStudentInput) {
    startTransition(async () => {
      const result = await updateStudent(student.id, { ...values, isActive: student.isActive });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Student updated");
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
          <DialogTitle>Edit student</DialogTitle>
        </DialogHeader>
        <StudentForm
          defaultValues={{
            name: student.name,
            email: student.email,
            admissionNo: student.admissionNo,
            rollNo: student.rollNo ?? "",
            sectionId: student.sectionId ?? "",
            gender: student.gender ?? "",
            dateOfBirth: student.dateOfBirth ? format(student.dateOfBirth, "yyyy-MM-dd") : "",
            address: student.address ?? "",
            phone: student.phone ?? "",
            guardianName: student.guardianName ?? "",
            guardianPhone: student.guardianPhone ?? "",
            guardianEmail: student.guardianEmail ?? "",
            bloodGroup: student.bloodGroup ?? "",
          }}
          sections={sections}
          onSubmit={handleSubmit}
          pending={pending}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Activate / deactivate
// ---------------------------------------------------------------------------

export function ToggleStudentActiveButton({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const result = await setStudentActive(id, !isActive);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Student deactivated" : "Student reactivated");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant={isActive ? "outline" : "secondary"} />}>
        {isActive ? "Deactivate" : "Reactivate"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Deactivate" : "Reactivate"} {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? "This student will no longer be able to sign in and will be marked inactive. Their academic records are kept."
              : "This student will be able to sign in again and will be marked active."}
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

// ---------------------------------------------------------------------------
// Section filter
// ---------------------------------------------------------------------------

export function StudentSectionFilter({ sections, sectionId }: { sections: Option[]; sectionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete("sectionId");
    } else {
      params.set("sectionId", value);
    }
    const query = params.toString();
    router.push(query ? `/admin/students?${query}` : "/admin/students");
  }

  return (
    <div className="mb-6 max-w-xs space-y-2">
      <Label>Filter by section</Label>
      <Select value={sectionId || "all"} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
