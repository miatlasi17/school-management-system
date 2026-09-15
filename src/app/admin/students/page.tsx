import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AddStudentDialog,
  EditStudentDialog,
  ToggleStudentActiveButton,
  StudentSectionFilter,
} from "./student-dialogs";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const params = await searchParams;

  const sections = await prisma.section.findMany({
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
    include: { class: true },
  });
  const sectionOptions = sections.map((s) => ({ id: s.id, label: `${s.class.name} ${s.name}` }));

  const sectionId = params.sectionId && sections.some((s) => s.id === params.sectionId) ? params.sectionId : "";

  const students = await prisma.student.findMany({
    where: sectionId ? { sectionId } : {},
    include: { user: true, section: { include: { class: true } } },
    orderBy: [{ user: { name: "asc" } }],
  });

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student admissions and profiles."
        action={<AddStudentDialog sections={sectionOptions} />}
      />

      <StudentSectionFilter sections={sectionOptions} sectionId={sectionId} />

      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No students found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Class / Section</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/students/${student.id}`} className="hover:underline">
                        {student.user.name}
                      </Link>
                    </TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>
                      {student.section ? `${student.section.class.name} ${student.section.name}` : "Unassigned"}
                    </TableCell>
                    <TableCell>{student.rollNo ?? "—"}</TableCell>
                    <TableCell>{student.guardianName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={student.isActive ? "secondary" : "destructive"}>
                        {student.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditStudentDialog
                          student={{
                            id: student.id,
                            name: student.user.name,
                            email: student.user.email,
                            admissionNo: student.admissionNo,
                            rollNo: student.rollNo,
                            sectionId: student.sectionId,
                            gender: student.gender,
                            dateOfBirth: student.dateOfBirth,
                            address: student.address,
                            phone: student.phone,
                            guardianName: student.guardianName,
                            guardianPhone: student.guardianPhone,
                            guardianEmail: student.guardianEmail,
                            bloodGroup: student.bloodGroup,
                            isActive: student.isActive,
                          }}
                          sections={sectionOptions}
                        />
                        <ToggleStudentActiveButton
                          id={student.id}
                          name={student.user.name}
                          isActive={student.isActive}
                        />
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
