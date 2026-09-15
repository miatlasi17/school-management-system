"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign } from "lucide-react";
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
import { recordPaymentSchema, type RecordPaymentInput } from "@/lib/validations/fees";
import { recordPayment } from "@/actions/fees";

const PAYMENT_METHODS: { value: RecordPaymentInput["method"]; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "ONLINE", label: "Online" },
  { value: "CHEQUE", label: "Cheque" },
];

export function RecordPaymentDialog({ invoiceId, maxAmount }: { invoiceId: string; maxAmount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { invoiceId, amount: maxAmount, method: "CASH", transactionRef: "" },
  });

  function onSubmit(values: RecordPaymentInput) {
    startTransition(async () => {
      const result = await recordPayment(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment recorded");
      setOpen(false);
      reset({ invoiceId, amount: maxAmount, method: "CASH", transactionRef: "" });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <CircleDollarSign className="size-4" /> Record Payment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Record a payment received against this invoice.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (£)</Label>
            <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount", { valueAsNumber: true })} />
            {errors.amount ? <p className="text-sm text-destructive">{errors.amount.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method ? <p className="text-sm text-destructive">{errors.method.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionRef">Reference (optional)</Label>
            <Input id="transactionRef" placeholder="e.g. transaction / cheque number" {...register("transactionRef")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
