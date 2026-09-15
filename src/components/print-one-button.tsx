"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prints just one card on a page that lists many (e.g. a single invoice
 * among a student's full fee history) by hiding every other element
 * carrying `data-print-card` for the duration of the print, then
 * restoring them once printing finishes.
 */
export function PrintOneButton({ cardId }: { cardId: string }) {
  function handlePrint() {
    const cards = document.querySelectorAll<HTMLElement>("[data-print-card]");
    const restore: { el: HTMLElement; display: string }[] = [];

    cards.forEach((card) => {
      if (card.dataset.printCard !== cardId) {
        restore.push({ el: card, display: card.style.display });
        card.style.display = "none";
      }
    });

    const cleanup = () => {
      restore.forEach(({ el, display }) => {
        el.style.display = display;
      });
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.print();
  }

  return (
    <Button size="sm" variant="outline" className="no-print gap-1.5" onClick={handlePrint}>
      <Printer className="size-4" /> Print / Save as PDF
    </Button>
  );
}
