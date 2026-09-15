import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BedDouble, Building2, Users } from "lucide-react";
import { AddHostelDialog, EditHostelDialog, DeleteHostelButton } from "./hostel-dialogs";
import { AddRoomDialog, EditRoomDialog, DeleteRoomButton } from "./room-dialogs";
import { AllocateRoomDialog, DeallocateButton } from "./allocation-dialogs";

export default async function HostelPage() {
  const [hostels, unallocatedStudents] = await Promise.all([
    prisma.hostel.findMany({
      orderBy: { name: "asc" },
      include: {
        rooms: {
          orderBy: { roomNumber: "asc" },
          include: {
            allocations: { include: { student: { include: { user: true } } } },
          },
        },
      },
    }),
    prisma.student.findMany({
      where: { isActive: true, roomAllocation: null },
      include: { user: true, section: { include: { class: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const studentOptions = unallocatedStudents.map((s) => ({
    id: s.id,
    label: `${s.user.name}${s.section ? ` (${s.section.class.name} ${s.section.name})` : ""}`,
  }));

  const totalRooms = hostels.reduce((sum, h) => sum + h.rooms.length, 0);
  const totalOccupants = hostels.reduce(
    (sum, h) => sum + h.rooms.reduce((roomSum, r) => roomSum + r.allocations.length, 0),
    0
  );

  return (
    <div>
      <PageHeader
        title="Hostel"
        description="Manage hostels, rooms, and student room allocations."
        action={<AddHostelDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Hostels" value={hostels.length} icon={Building2} />
        <StatCard label="Rooms" value={totalRooms} icon={BedDouble} />
        <StatCard label="Students housed" value={totalOccupants} icon={Users} />
      </div>

      <div className="space-y-4">
        {hostels.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hostels yet. Create your first hostel to get started.
            </CardContent>
          </Card>
        ) : (
          hostels.map((hostel) => (
            <Card key={hostel.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {hostel.name}
                  <Badge variant="secondary">{hostel.type}</Badge>
                  <Badge variant="outline">{hostel.rooms.length} rooms</Badge>
                  {hostel.warden ? (
                    <span className="text-sm font-normal text-muted-foreground">Warden: {hostel.warden}</span>
                  ) : null}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <AddRoomDialog hostelId={hostel.id} />
                  <EditHostelDialog hostel={hostel} />
                  <DeleteHostelButton id={hostel.id} name={hostel.name} />
                </div>
              </CardHeader>
              <CardContent>
                {hostel.rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rooms in this hostel yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Occupancy</TableHead>
                        <TableHead>Occupants</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostel.rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">{room.roomNumber}</TableCell>
                          <TableCell>
                            {room.allocations.length} / {room.capacity}
                          </TableCell>
                          <TableCell>
                            {room.allocations.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {room.allocations.map((a) => (
                                  <Badge key={a.id} variant="outline" className="gap-0 pr-1">
                                    {a.student.user.name}
                                    <DeallocateButton studentId={a.studentId} name={a.student.user.name} />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <AllocateRoomDialog
                                roomId={room.id}
                                occupied={room.allocations.length}
                                capacity={room.capacity}
                                students={studentOptions}
                              />
                              <EditRoomDialog room={room} hostelId={hostel.id} />
                              <DeleteRoomButton id={room.id} name={room.roomNumber} />
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
