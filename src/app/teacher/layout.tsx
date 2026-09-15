import {
  LayoutDashboard,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  Users,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/session";

const iconClass = "size-4 shrink-0";

const navItems = [
  { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
  { href: "/teacher/timetable", label: "My Timetable", icon: <CalendarClock className={iconClass} /> },
  { href: "/teacher/attendance", label: "Attendance", icon: <ClipboardCheck className={iconClass} /> },
  { href: "/teacher/marks", label: "Marks Entry", icon: <FileSpreadsheet className={iconClass} /> },
  { href: "/teacher/students", label: "My Students", icon: <Users className={iconClass} /> },
  { href: "/teacher/notices", label: "Notices", icon: <Megaphone className={iconClass} /> },
  { href: "/teacher/messages", label: "Messages", icon: <MessageSquare className={iconClass} /> },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("TEACHER");

  return (
    <DashboardShell navItems={navItems} roleLabel="Teacher" userName={user.name ?? ""} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
