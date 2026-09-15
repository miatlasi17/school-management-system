"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
      <Printer className="size-4" /> Print / Save as PDF
    </Button>
  );
}
