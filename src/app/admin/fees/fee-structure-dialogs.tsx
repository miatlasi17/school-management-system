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
import { feeStructureSchema, type FeeStructureInput } from "@/lib/validations/fees";
import { upsertFeeStructure, deleteFeeStructure } from "@/actions/fees";

type Option = { id: string; label: string };

type FeeStructureRecord = {
  id: string;
  classId: string;
  feeCategoryId: string;
  academicYearId: string;
  amount: number;
};

function FeeStructureForm({
  defaultValues,
  classes,
  categories,
  academicYears,
  onSubmit,
  pending,
}: {
  defaultValues: FeeStructureInput;
  classes: Option[];
  categories: Option[];
  academicYears: Option[];
  onSubmit: (values: FeeStructureInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeStructureInput>({ resolver: zodResolver(feeStructureSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Class</Label>
        <Controller
          control={control}
          name="classId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.classId ? <p className="text-sm text-destructive">{errors.classId.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Fee category</Label>
        <Controller
          control={control}
          name="feeCategoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a fee category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.feeCategoryId ? <p className="text-sm text-destructive">{errors.feeCategoryId.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Academic year</Label>
        <Controller
          control={control}
          name="academicYearId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.academicYearId ? <p className="text-sm text-destructive">{errors.academicYearId.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input id="amount" type="number" step="0.01" min="0" {...register("amount", { valueAsNumber: true })} />
        {errors.amount ? <p className="text-sm text-destructive">{errors.amount.message}</p> : null}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddEditFeeStructureDialog({
  classes,
  categories,
  academicYears,
  feeStructure,
}: {
  classes: Option[];
  categories: Option[];
  academicYears: Option[];
  feeStructure?: FeeStructureRecord;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(feeStructure);

  function handleSubmit(values: FeeStructureInput) {
    startTransition(async () => {
      const result = await upsertFeeStructure(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Fee structure updated" : "Fee structure created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="size-4" /> Add Fee Structure
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit fee structure" : "Add fee structure"}</DialogTitle>
          <DialogDescription>Set the amount charged for a fee category, per class and academic year.</DialogDescription>
        </DialogHeader>
        <FeeStructureForm
          defaultValues={{
            classId: feeStructure?.classId ?? classes[0]?.id ?? "",
            feeCategoryId: feeStructure?.feeCategoryId ?? categories[0]?.id ?? "",
            academicYearId: feeStructure?.academicYearId ?? academicYears[0]?.id ?? "",
            amount: feeStructure?.amount ?? 0,
          }}
          classes={classes}
          categories={categories}
          academicYears={academicYears}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFeeStructureButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFeeStructure(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Fee structure deleted");
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
          <AlertDialogTitle>Delete fee structure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the {label} fee structure. Existing invoices already generated are not affected.
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
