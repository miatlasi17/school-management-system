"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generatePayroll, markPayrollPaid } from "@/actions/hr";

export function GeneratePayrollButton({ month, year }: { month: number; year: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generatePayroll({ month, year });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Generated ${result.count} payroll record${result.count === 1 ? "" : "s"}`);
      router.refresh();
    });
  }

  return (
    <Button size="sm" className="gap-1.5" disabled={pending} onClick={handleGenerate}>
      <RefreshCw className="size-4" /> {pending ? "Generating..." : "Generate Payroll"}
    </Button>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markPayrollPaid(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Marked as paid");
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={handleMarkPaid}>
      {pending ? "Saving..." : "Mark Paid"}
    </Button>
  );
}
