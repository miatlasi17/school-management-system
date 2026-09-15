import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TeacherStudentsPage() {
  const { teacher } = await requireTeacher();

  const [classTeacherSections, taughtClassSubjects] = await Promise.all([
    prisma.section.findMany({
      where: { classTeacherId: teacher.id },
      select: { id: true },
    }),
    prisma.classSubject.findMany({
      where: { teacherId: teacher.id },
      select: { classId: true },
    }),
  ]);

  const classTeacherSectionIds = new Set(classTeacherSections.map((s) => s.id));
  const taughtClassIds = taughtClassSubjects.map((cs) => cs.classId);

  const subjectSections = taughtClassIds.length
    ? await prisma.section.findMany({ where: { classId: { in: taughtClassIds } }, select: { id: true } })
    : [];

  const sectionIds = Array.from(new Set([...classTeacherSectionIds, ...subjectSections.map((s) => s.id)]));

  const students = sectionIds.length
    ? await prisma.student.findMany({
        where: { sectionId: { in: sectionIds }, isActive: true },
        include: { user: true, section: { include: { class: true } } },
        orderBy: [{ section: { name: "asc" } }, { user: { name: "asc" } }],
      })
    : [];

  return (
    <div>
      <PageHeader
        title="My Students"
        description="Students in the sections you are the class teacher for, and classes you teach a subject in."
      />

      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No students found. You are not yet assigned as a class teacher or subject teacher for any section.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Guardian Phone</TableHead>
                  <TableHead>Relationship</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.user.name}</TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>
                      {student.section ? `${student.section.class.name} ${student.section.name}` : "—"}
                    </TableCell>
                    <TableCell>{student.guardianName ?? "—"}</TableCell>
                    <TableCell>{student.guardianPhone ?? "—"}</TableCell>
                    <TableCell>
                      {student.sectionId && classTeacherSectionIds.has(student.sectionId) ? (
                        <Badge variant="secondary">Class Teacher</Badge>
                      ) : (
                        <Badge variant="outline">Subject Teacher</Badge>
                      )}
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
