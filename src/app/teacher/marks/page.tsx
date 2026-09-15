import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TeacherMarksPage() {
  const { teacher } = await requireTeacher();

  const classSubjects = await prisma.classSubject.findMany({
    where: { teacherId: teacher.id },
    select: { classId: true, subjectId: true },
  });

  const examSubjects =
    classSubjects.length === 0
      ? []
      : await prisma.examSubject.findMany({
          where: {
            OR: classSubjects.map((cs) => ({ classId: cs.classId, subjectId: cs.subjectId })),
          },
          include: { exam: true, class: true, subject: true },
          orderBy: [{ exam: { startDate: "desc" } }, { class: { order: "asc" } }],
        });

  return (
    <div>
      <PageHeader title="Marks Entry" description="Enter marks for the subjects you teach." />

      <Card>
        <CardContent>
          {examSubjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No exams scheduled yet for your subjects.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Max / Pass Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examSubjects.map((es) => (
                  <TableRow key={es.id}>
                    <TableCell className="font-medium">{es.exam.name}</TableCell>
                    <TableCell>{es.class.name}</TableCell>
                    <TableCell>{es.subject.name}</TableCell>
                    <TableCell>{es.examDate ? es.examDate.toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {es.maxMarks} / {es.passMarks}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/teacher/marks/${es.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <FileSpreadsheet className="size-4" /> Enter Marks
                      </Link>
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
