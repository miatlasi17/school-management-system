"use client";

import { useState } from "react";
import { Menu, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";

export function MobileNav({ navItems, roleLabel }: { navItems: NavItem[]; roleLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold">Brightwood</p>
              <p className="text-xs font-normal text-muted-foreground">{roleLabel}</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="space-y-0.5 p-3">
          <NavLinks items={navItems} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
