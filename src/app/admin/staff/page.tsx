import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStaffDialog, EditStaffDialog, ToggleStaffActiveButton } from "./staff-dialogs";
import { SalaryStructureDialog } from "./salary-dialog";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { name: "asc" },
    include: { salaryStructure: true },
  });

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage non-teaching staff records for HR and payroll."
        action={<AddStaffDialog />}
      />

      <Card>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No staff members yet. Add your first staff record to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.employeeId}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>{member.department ?? "—"}</TableCell>
                    <TableCell>{member.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <SalaryStructureDialog
                          target={{ type: "staff", id: member.id }}
                          existing={
                            member.salaryStructure
                              ? {
                                  basic: member.salaryStructure.basic,
                                  allowances: member.salaryStructure.allowances,
                                  deductions: member.salaryStructure.deductions,
                                }
                              : undefined
                          }
                        />
                        <EditStaffDialog
                          staff={{
                            id: member.id,
                            employeeId: member.employeeId,
                            name: member.name,
                            designation: member.designation,
                            department: member.department,
                            phone: member.phone,
                            email: member.email,
                            address: member.address,
                            gender: member.gender,
                            joiningDate: member.joiningDate,
                          }}
                        />
                        <ToggleStaffActiveButton id={member.id} name={member.name} isActive={member.isActive} />
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
