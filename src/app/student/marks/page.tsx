import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function computeGrade(percentage: number): string {
  if (percentage >= 90) return "A*";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 35) return "E";
  return "F";
}

export default async function StudentMarksPage() {
  const { student } = await requireStudent();

  const marks = await prisma.mark.findMany({
    where: { studentId: student.id },
    include: {
      examSubject: { include: { exam: { include: { academicYear: true } }, subject: true } },
    },
    orderBy: [{ examSubject: { exam: { startDate: "desc" } } }, { examSubject: { subject: { name: "asc" } } }],
  });

  const examGroups = new Map<string, typeof marks>();
  for (const mark of marks) {
    const examId = mark.examSubject.exam.id;
    const group = examGroups.get(examId) ?? [];
    group.push(mark);
    examGroups.set(examId, group);
  }
  const groups = Array.from(examGroups.values());

  return (
    <div>
      <PageHeader title="Marks & Report Card" description="Your exam results, subject by subject." />

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No marks have been published yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const exam = group[0].examSubject.exam;
            const scored = group.filter((m) => !m.isAbsent && m.marksObtained !== null);
            const totalObtained = scored.reduce((sum, m) => sum + (m.marksObtained ?? 0), 0);
            const totalMax = scored.reduce((sum, m) => sum + m.examSubject.maxMarks, 0);
            const average = totalMax > 0 ? (totalObtained / totalMax) * 100 : null;

            return (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle className="text-base">{exam.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {exam.academicYear.name} · {exam.startDate.toLocaleDateString()} -{" "}
                    {exam.endDate.toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.map((m) => {
                        const passed =
                          !m.isAbsent && m.marksObtained !== null && m.marksObtained >= m.examSubject.passMarks;
                        const percentage =
                          !m.isAbsent && m.marksObtained !== null
                            ? (m.marksObtained / m.examSubject.maxMarks) * 100
                            : null;
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.examSubject.subject.name}</TableCell>
                            <TableCell>
                              {m.isAbsent
                                ? "Absent"
                                : m.marksObtained !== null
                                  ? `${m.marksObtained} / ${m.examSubject.maxMarks}`
                                  : "—"}
                            </TableCell>
                            <TableCell>
                              {m.isAbsent ? (
                                <Badge variant="secondary">Absent</Badge>
                              ) : m.marksObtained === null ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : passed ? (
                                <Badge>Pass</Badge>
                              ) : (
                                <Badge variant="destructive">Fail</Badge>
                              )}
                            </TableCell>
                            <TableCell>{percentage !== null ? computeGrade(percentage) : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell className="font-medium">
                          {totalObtained} / {totalMax}
                        </TableCell>
                        <TableCell colSpan={2} className="font-medium">
                          {average !== null ? `${average.toFixed(1)}% average` : "—"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
