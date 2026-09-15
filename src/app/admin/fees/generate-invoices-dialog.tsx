"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { generateInvoicesForClass } from "@/actions/fees";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };

export function GenerateInvoicesDialog({ classes, academicYears }: { classes: Option[]; academicYears: Option[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!classId || !academicYearId || !dueDate) {
      toast.error("Please select a class, academic year and due date.");
      return;
    }
    startTransition(async () => {
      const result = await generateInvoicesForClass(classId, academicYearId, dueDate);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Generated ${result.created} invoice${result.created === 1 ? "" : "s"}.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Generate Invoices
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate invoices</DialogTitle>
          <DialogDescription>
            Create an invoice for every active student in a class who doesn&apos;t already have one for the selected
            academic year, based on that class&apos;s fee structure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(value) => setClassId(value ?? "")} items={toSelectItems(classes)}>
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
          </div>
          <div className="space-y-2">
            <Label>Academic year</Label>
            <Select
              value={academicYearId}
              onValueChange={(value) => setAcademicYearId(value ?? "")}
              items={toSelectItems(academicYears)}
            >
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
