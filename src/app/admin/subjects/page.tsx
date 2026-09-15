import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddSubjectDialog, EditSubjectDialog, DeleteSubjectButton } from "./subject-dialogs";
import { AssignClassSubjectDialog, RemoveClassSubjectButton } from "./assignment-dialogs";

export default async function SubjectsPage() {
  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.schoolClass.findMany({
      orderBy: { order: "asc" },
      include: {
        classSubjects: {
          include: { subject: true, teacher: { include: { user: true } } },
          orderBy: { subject: { name: "asc" } },
        },
      },
    }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const subjectOptions = subjects.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` }));
  const classOptions = classes.map((c) => ({ id: c.id, label: c.name }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.user.name }));

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subjects and assign them to classes with a teacher."
        action={<AddSubjectDialog />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects yet. Add your first subject to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.code}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <EditSubjectDialog id={subject.id} name={subject.name} code={subject.code} />
                          <DeleteSubjectButton id={subject.id} name={subject.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Class Assignments</CardTitle>
            <AssignClassSubjectDialog classes={classOptions} subjects={subjectOptions} teachers={teacherOptions} />
          </CardHeader>
          <CardContent className="space-y-6">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes yet.</p>
            ) : (
              classes.map((cls) => (
                <div key={cls.id}>
                  <h3 className="mb-2 text-sm font-medium">{cls.name}</h3>
                  {cls.classSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects assigned to this class yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cls.classSubjects.map((cs) => (
                          <TableRow key={cs.id}>
                            <TableCell className="font-medium">{cs.subject.name}</TableCell>
                            <TableCell>{cs.teacher?.user.name ?? "Unassigned"}</TableCell>
                            <TableCell className="text-right">
                              <RemoveClassSubjectButton id={cs.id} label={`${cls.name} · ${cs.subject.name}`} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
