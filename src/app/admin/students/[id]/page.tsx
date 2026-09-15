import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, GraduationCap, Wallet, BookOpen, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, section: { include: { class: true } } },
  });
  if (!student) notFound();

  const [attendances, marks, invoices, bookIssues] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId: id }, orderBy: { date: "desc" }, take: 10 }),
    prisma.mark.findMany({
      where: { studentId: id },
      include: { examSubject: { include: { exam: true, subject: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { studentId: id },
      include: { items: { include: { feeCategory: true } }, payments: true },
      orderBy: { issueDate: "desc" },
    }),
    prisma.bookIssue.findMany({
      where: { studentId: id },
      include: { book: true },
      orderBy: { issueDate: "desc" },
    }),
  ]);

  const marksByExam = new Map<string, { examName: string; marks: typeof marks }>();
  for (const mark of marks) {
    const examId = mark.examSubject.exam.id;
    if (!marksByExam.has(examId)) {
      marksByExam.set(examId, { examName: mark.examSubject.exam.name, marks: [] });
    }
    marksByExam.get(examId)!.marks.push(mark);
  }

  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const totalDue = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.amount, 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0), 0);

  return (
    <div>
      <Link
        href="/admin/students"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <PageHeader
        title={student.user.name}
        description={`Admission No. ${student.admissionNo}${
          student.section ? ` · ${student.section.class.name} ${student.section.name}` : " · Unassigned"
        }`}
        action={
          <Badge variant={student.isActive ? "secondary" : "destructive"}>
            {student.isActive ? "Active" : "Inactive"}
          </Badge>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance (last 10)"
          value={`${presentCount}/${attendances.length}`}
          icon={ClipboardCheck}
        />
        <StatCard label="Exams Recorded" value={marksByExam.size} icon={GraduationCap} />
        <StatCard label="Fees Outstanding" value={`£${(totalDue - totalPaid).toLocaleString()}`} icon={Wallet} />
        <StatCard
          label="Books Issued"
          value={bookIssues.filter((b) => b.status === "ISSUED" || b.status === "OVERDUE").length}
          icon={BookOpen}
        />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileField label="Email" value={student.user.email} />
              <ProfileField label="Roll No." value={student.rollNo ?? "—"} />
              <ProfileField label="Gender" value={student.gender ?? "—"} />
              <ProfileField
                label="Date of birth"
                value={student.dateOfBirth ? format(student.dateOfBirth, "d MMM yyyy") : "—"}
              />
              <ProfileField label="Blood group" value={student.bloodGroup ?? "—"} />
              <ProfileField label="Phone" value={student.phone ?? "—"} />
              <ProfileField label="Address" value={student.address ?? "—"} />
              <ProfileField label="Admission date" value={format(student.admissionDate, "d MMM yyyy")} />
              <ProfileField label="Guardian name" value={student.guardianName ?? "—"} />
              <ProfileField label="Guardian phone" value={student.guardianPhone ?? "—"} />
              <ProfileField label="Guardian email" value={student.guardianEmail ?? "—"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last 10 attendance records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {attendances.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{format(a.date, "d MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "PRESENT" ? "secondary" : a.status === "ABSENT" ? "destructive" : "outline"}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.remarks ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks" className="mt-4 space-y-4">
          {marksByExam.size === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No marks recorded yet.
              </CardContent>
            </Card>
          ) : (
            Array.from(marksByExam.values()).map((group) => (
              <Card key={group.examName}>
                <CardHeader>
                  <CardTitle className="text-base">{group.examName}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.marks.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.examSubject.subject.name}</TableCell>
                          <TableCell>{m.isAbsent ? "Absent" : (m.marksObtained ?? "—")}</TableCell>
                          <TableCell>{m.examSubject.maxMarks}</TableCell>
                          <TableCell>
                            {m.isAbsent ? (
                              <Badge variant="outline">Absent</Badge>
                            ) : (m.marksObtained ?? 0) >= m.examSubject.passMarks ? (
                              <Badge variant="secondary">Pass</Badge>
                            ) : (
                              <Badge variant="destructive">Fail</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => {
                      const amount = inv.items.reduce((s, i) => s + i.amount, 0);
                      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell>{format(inv.dueDate, "d MMM yyyy")}</TableCell>
                          <TableCell>£{amount.toLocaleString()}</TableCell>
                          <TableCell>£{paid.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === "PAID" ? "secondary" : inv.status === "OVERDUE" ? "destructive" : "outline"}>
                              {inv.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Book issues</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bookIssues.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No books issued.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookIssues.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.book.title}</TableCell>
                        <TableCell>{format(b.issueDate, "d MMM yyyy")}</TableCell>
                        <TableCell>{format(b.dueDate, "d MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === "RETURNED" ? "secondary" : b.status === "OVERDUE" || b.status === "LOST" ? "destructive" : "outline"}>
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
