import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddTeacherDialog, EditTeacherDialog } from "./teacher-dialogs";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      classSubjects: true,
      sectionsAsClassTeacher: { include: { class: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles and assignments."
        action={<AddTeacherDialog />}
      />

      <Card>
        <CardContent className="p-0">
          {teachers.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No teachers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Class Teacher For</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/teachers/${teacher.id}`} className="hover:underline">
                        {teacher.user.name}
                      </Link>
                    </TableCell>
                    <TableCell>{teacher.employeeId}</TableCell>
                    <TableCell>{teacher.user.email}</TableCell>
                    <TableCell>{teacher.phone ?? "—"}</TableCell>
                    <TableCell>{teacher.qualification ?? "—"}</TableCell>
                    <TableCell>{format(teacher.joiningDate, "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{teacher.classSubjects.length}</Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.sectionsAsClassTeacher.length === 0
                        ? "—"
                        : teacher.sectionsAsClassTeacher.map((s) => `${s.class.name} ${s.name}`).join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditTeacherDialog
                          teacher={{
                            id: teacher.id,
                            name: teacher.user.name,
                            email: teacher.user.email,
                            employeeId: teacher.employeeId,
                            phone: teacher.phone,
                            address: teacher.address,
                            gender: teacher.gender,
                            qualification: teacher.qualification,
                            joiningDate: teacher.joiningDate,
                          }}
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
