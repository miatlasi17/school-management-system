import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Contact,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  Wallet,
  Library,
  Bus,
  BedDouble,
  Banknote,
  Megaphone,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser } from "@/lib/session";

const iconClass = "size-4 shrink-0";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
  { href: "/admin/students", label: "Students", icon: <Users className={iconClass} /> },
  { href: "/admin/teachers", label: "Teachers", icon: <GraduationCap className={iconClass} /> },
  { href: "/admin/staff", label: "Staff", icon: <Contact className={iconClass} /> },
  { href: "/admin/classes", label: "Classes & Sections", icon: <BookOpen className={iconClass} /> },
  { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className={iconClass} /> },
  { href: "/admin/timetable", label: "Timetable", icon: <CalendarClock className={iconClass} /> },
  { href: "/admin/attendance", label: "Attendance", icon: <ClipboardCheck className={iconClass} /> },
  { href: "/admin/exams", label: "Exams & Marks", icon: <FileSpreadsheet className={iconClass} /> },
  { href: "/admin/fees", label: "Fees", icon: <Wallet className={iconClass} /> },
  { href: "/admin/library", label: "Library", icon: <Library className={iconClass} /> },
  { href: "/admin/transport", label: "Transport", icon: <Bus className={iconClass} /> },
  { href: "/admin/hostel", label: "Hostel", icon: <BedDouble className={iconClass} /> },
  { href: "/admin/payroll", label: "Payroll", icon: <Banknote className={iconClass} /> },
  { href: "/admin/notices", label: "Notices", icon: <Megaphone className={iconClass} /> },
  { href: "/admin/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
  { href: "/admin/messages", label: "Messages", icon: <MessageSquare className={iconClass} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("ADMIN");

  return (
    <DashboardShell navItems={navItems} roleLabel="Administrator" userName={user.name ?? ""} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
