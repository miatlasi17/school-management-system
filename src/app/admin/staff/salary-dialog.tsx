"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";
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
import { salaryStructureSchema, type SalaryStructureInput } from "@/lib/validations/hr";
import { upsertSalaryStructure } from "@/actions/hr";

type Target = { type: "staff"; id: string } | { type: "teacher"; id: string };

export function SalaryStructureDialog({
  target,
  existing,
}: {
  target: Target;
  existing?: { basic: number; allowances: number; deductions: number };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalaryStructureInput>({
    resolver: zodResolver(salaryStructureSchema),
    defaultValues: {
      teacherId: target.type === "teacher" ? target.id : "",
      staffId: target.type === "staff" ? target.id : "",
      basic: existing?.basic ?? 0,
      allowances: existing?.allowances ?? 0,
      deductions: existing?.deductions ?? 0,
    },
  });

  function onSubmit(values: SalaryStructureInput) {
    startTransition(async () => {
      const result = await upsertSalaryStructure(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Salary structure saved");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Wallet className="size-4" /> Set Salary
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salary structure</DialogTitle>
          <DialogDescription>
            Set the basic pay, allowances and deductions used when generating payroll.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="basic">Basic salary (₹)</Label>
            <Input id="basic" type="number" step="0.01" min="0" {...register("basic", { valueAsNumber: true })} />
            {errors.basic ? <p className="text-sm text-destructive">{errors.basic.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowances">Allowances (₹)</Label>
            <Input
              id="allowances"
              type="number"
              step="0.01"
              min="0"
              {...register("allowances", { valueAsNumber: true })}
            />
            {errors.allowances ? <p className="text-sm text-destructive">{errors.allowances.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deductions">Deductions (₹)</Label>
            <Input
              id="deductions"
              type="number"
              step="0.01"
              min="0"
              {...register("deductions", { valueAsNumber: true })}
            />
            {errors.deductions ? <p className="text-sm text-destructive">{errors.deductions.message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
