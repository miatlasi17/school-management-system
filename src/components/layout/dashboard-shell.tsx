import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  userEmail,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Brightwood</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <NavLinks items={navItems} />
        </nav>
        <div className="space-y-3 border-t p-3">
          <div className="flex items-center gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <MobileNav navItems={navItems} roleLabel={roleLabel} />
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="size-5" />
              Brightwood
            </Link>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-x-hidden bg-muted/10 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
