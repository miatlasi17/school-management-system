import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddExamDialog, EditExamDialog, DeleteExamButton } from "./exam-dialogs";

export default async function ExamsPage() {
  const [exams, academicYears] = await Promise.all([
    prisma.exam.findMany({
      include: { academicYear: true, _count: { select: { examSubjects: true } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.academicYear.findMany({ orderBy: { name: "desc" } }),
  ]);

  const yearOptions = academicYears.map((y) => ({ id: y.id, label: y.name }));

  return (
    <div>
      <PageHeader
        title="Exams & Marks"
        description="Schedule examinations and manage subject-wise marks entry."
        action={<AddExamDialog academicYears={yearOptions} />}
      />

      <Card>
        <CardContent>
          {exams.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No exams yet. Create your first exam to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Subjects Scheduled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/exams/${exam.id}`} className="hover:underline">
                        {exam.name}
                      </Link>
                    </TableCell>
                    <TableCell>{exam.academicYear.name}</TableCell>
                    <TableCell>
                      {exam.startDate.toLocaleDateString()} - {exam.endDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{exam._count.examSubjects}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditExamDialog
                          exam={{
                            id: exam.id,
                            name: exam.name,
                            academicYearId: exam.academicYearId,
                            startDate: exam.startDate.toISOString().slice(0, 10),
                            endDate: exam.endDate.toISOString().slice(0, 10),
                          }}
                          academicYears={yearOptions}
                        />
                        <DeleteExamButton id={exam.id} name={exam.name} />
                      </div>
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
