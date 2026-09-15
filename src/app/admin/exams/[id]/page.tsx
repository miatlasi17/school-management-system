import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddExamSubjectDialog, DeleteExamSubjectButton } from "./exam-subject-dialogs";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { academicYear: true },
  });
  if (!exam) notFound();

  const [examSubjects, classes, subjects, teachers] = await Promise.all([
    prisma.examSubject.findMany({
      where: { examId: id },
      include: { class: true, subject: true, invigilator: { include: { user: true } } },
      orderBy: [{ class: { order: "asc" } }, { subject: { name: "asc" } }],
    }),
    prisma.schoolClass.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const classOptions = classes.map((c) => ({ id: c.id, label: c.name }));
  const subjectOptions = subjects.map((s) => ({ id: s.id, label: s.name }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.user.name }));

  return (
    <div>
      <PageHeader
        title={exam.name}
        description={`${exam.academicYear.name} · ${exam.startDate.toLocaleDateString()} - ${exam.endDate.toLocaleDateString()}`}
        action={
          <AddExamSubjectDialog examId={exam.id} classes={classOptions} subjects={subjectOptions} teachers={teacherOptions} />
        }
      />

      <Card>
        <CardContent>
          {examSubjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No subjects scheduled yet for this exam.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Invigilator</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Max / Pass Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examSubjects.map((es) => (
                  <TableRow key={es.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/exams/${exam.id}/${es.id}`} className="hover:underline">
                        {es.class.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/exams/${exam.id}/${es.id}`} className="hover:underline">
                        {es.subject.name}
                      </Link>
                    </TableCell>
                    <TableCell>{es.invigilator?.user.name ?? "Unassigned"}</TableCell>
                    <TableCell>{es.examDate ? es.examDate.toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {es.maxMarks} / {es.passMarks}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteExamSubjectButton id={es.id} label={`${es.class.name} · ${es.subject.name}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
