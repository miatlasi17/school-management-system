import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddClassDialog, EditClassDialog, DeleteClassButton } from "./class-dialogs";
import { AddSectionDialog, EditSectionDialog, DeleteSectionButton } from "./section-dialogs";

export default async function ClassesPage() {
  const [classes, teachers] = await Promise.all([
    prisma.schoolClass.findMany({
      orderBy: { order: "asc" },
      include: {
        sections: {
          orderBy: { name: "asc" },
          include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } } },
        },
      },
    }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const classOptions = classes.map((c) => ({ id: c.id, label: c.name }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.user.name }));

  return (
    <div>
      <PageHeader
        title="Classes & Sections"
        description="Manage the classes and sections your school offers."
        action={
          <div className="flex gap-2">
            <AddSectionDialog classes={classOptions} teachers={teacherOptions} />
            <AddClassDialog />
          </div>
        }
      />

      <div className="space-y-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No classes yet. Create your first class to get started.
            </CardContent>
          </Card>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {cls.name}
                  <Badge variant="secondary">{cls.sections.length} sections</Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <EditClassDialog id={cls.id} name={cls.name} order={cls.order} />
                  <DeleteClassButton id={cls.id} name={cls.name} />
                </div>
              </CardHeader>
              <CardContent>
                {cls.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sections in this class yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Class Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cls.sections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">{section.name}</TableCell>
                          <TableCell>{section.roomNumber ?? "—"}</TableCell>
                          <TableCell>{section.classTeacher?.user.name ?? "Unassigned"}</TableCell>
                          <TableCell>{section._count.students}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditSectionDialog
                                section={{
                                  id: section.id,
                                  classId: cls.id,
                                  name: section.name,
                                  roomNumber: section.roomNumber,
                                  classTeacherId: section.classTeacherId,
                                }}
                                classes={classOptions}
                                teachers={teacherOptions}
                              />
                              <DeleteSectionButton id={section.id} name={`${cls.name} ${section.name}`} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
