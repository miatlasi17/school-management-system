"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { updateInvoiceSchema, type UpdateInvoiceInput } from "@/lib/validations/fees";
import { updateInvoice, deleteInvoice } from "@/actions/fees";
import { toSelectItems } from "@/lib/utils";

type Option = { id: string; label: string };

export function EditInvoiceDialog({
  invoiceId,
  dueDate,
  items,
  feeCategories,
}: {
  invoiceId: string;
  dueDate: string;
  items: { feeCategoryId: string; amount: number }[];
  feeCategories: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateInvoiceInput>({
    resolver: zodResolver(updateInvoiceSchema),
    defaultValues: { dueDate, items },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  function onSubmit(values: UpdateInvoiceInput) {
    startTransition(async () => {
      const result = await updateInvoice(invoiceId, values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Invoice updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset({ dueDate, items });
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Pencil className="size-4" /> Edit Invoice
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit invoice</DialogTitle>
          <DialogDescription>Update the due date and line items. The balance will be recalculated.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate ? <p className="text-sm text-destructive">{errors.dueDate.message}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={() => append({ feeCategoryId: feeCategories[0]?.id ?? "", amount: 0 })}
              >
                <Plus className="size-4" /> Add item
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Controller
                    control={control}
                    name={`items.${index}.feeCategoryId`}
                    render={({ field: selectField }) => (
                      <Select
                        value={selectField.value}
                        onValueChange={selectField.onChange}
                        items={toSelectItems(feeCategories)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-32 shrink-0"
                    {...register(`items.${index}.amount`, { valueAsNumber: true })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.items?.message ? <p className="text-sm text-destructive">{errors.items.message}</p> : null}
            {errors.items?.root?.message ? <p className="text-sm text-destructive">{errors.items.root.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Invoice deleted");
      router.push("/admin/fees");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" />}>
        <Trash2 className="size-4" /> Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the invoice and its line items. This is only possible while no payments have
            been recorded against it.
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
