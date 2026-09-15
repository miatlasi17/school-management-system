import {
  LayoutDashboard,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  Wallet,
  Library,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/session";

const iconClass = "size-4 shrink-0";

const navItems = [
  { href: "/student", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
  { href: "/student/timetable", label: "Timetable", icon: <CalendarClock className={iconClass} /> },
  { href: "/student/attendance", label: "Attendance", icon: <ClipboardCheck className={iconClass} /> },
  { href: "/student/marks", label: "Marks & Report Card", icon: <FileSpreadsheet className={iconClass} /> },
  { href: "/student/fees", label: "Fees", icon: <Wallet className={iconClass} /> },
  { href: "/student/library", label: "Library", icon: <Library className={iconClass} /> },
  { href: "/student/notices", label: "Notices", icon: <Megaphone className={iconClass} /> },
  { href: "/student/messages", label: "Messages", icon: <MessageSquare className={iconClass} /> },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");

  return (
    <DashboardShell navItems={navItems} roleLabel="Student" userName={user.name ?? ""} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
