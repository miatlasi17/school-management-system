import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus, Route as RouteIcon, Users } from "lucide-react";
import { AddVehicleDialog, EditVehicleDialog, DeleteVehicleButton } from "./vehicle-dialogs";
import { AddRouteDialog, EditRouteDialog, DeleteRouteButton } from "./route-dialogs";
import { AddStopDialog, EditStopDialog, DeleteStopButton } from "./stop-dialogs";
import { AssignTransportDialog, RemoveTransportButton } from "./assignment-dialogs";

export default async function TransportPage() {
  const [vehicles, routes, assignments, students] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { number: "asc" } }),
    prisma.route.findMany({
      orderBy: { name: "asc" },
      include: { vehicle: true, stops: { orderBy: { order: "asc" } } },
    }),
    prisma.studentTransport.findMany({
      include: {
        student: { include: { user: true, section: { include: { class: true } } } },
        route: true,
        stop: true,
      },
      orderBy: { student: { user: { name: "asc" } } },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      include: { user: true, section: { include: { class: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const vehicleOptions = vehicles.map((v) => ({ id: v.id, label: `${v.number} (${v.capacity} seats)` }));
  const routeOptions = routes.map((r) => ({ id: r.id, label: r.name }));
  const stopOptions = routes.flatMap((r) => r.stops.map((s) => ({ id: s.id, name: s.name, routeId: r.id })));
  const studentOptions = students.map((s) => ({
    id: s.id,
    label: `${s.user.name}${s.section ? ` (${s.section.class.name} ${s.section.name})` : ""}`,
  }));

  return (
    <div>
      <PageHeader title="Transport" description="Manage vehicles, routes, stops, and student transport assignments." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Vehicles" value={vehicles.length} icon={Bus} />
        <StatCard label="Routes" value={routes.length} icon={RouteIcon} />
        <StatCard label="Students assigned" value={assignments.length} icon={Users} />
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="assignments">Student Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Vehicles</CardTitle>
              <AddVehicleDialog />
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.number}</TableCell>
                        <TableCell>{v.capacity}</TableCell>
                        <TableCell>{v.driverName ?? "—"}</TableCell>
                        <TableCell>{v.driverPhone ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <EditVehicleDialog vehicle={v} />
                            <DeleteVehicleButton id={v.id} name={v.number} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-end">
            <AddRouteDialog vehicles={vehicleOptions} />
          </div>
          {routes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No routes yet. Create your first route to get started.
              </CardContent>
            </Card>
          ) : (
            routes.map((route) => (
              <Card key={route.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {route.name}
                    <Badge variant="secondary">{route.stops.length} stops</Badge>
                    {route.vehicle ? <Badge variant="outline">{route.vehicle.number}</Badge> : null}
                    <Badge variant="outline">Fare {route.fare}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <AddStopDialog routeId={route.id} />
                    <EditRouteDialog route={route} vehicles={vehicleOptions} />
                    <DeleteRouteButton id={route.id} name={route.name} />
                  </div>
                </CardHeader>
                <CardContent>
                  {route.stops.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stops on this route yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Stop</TableHead>
                          <TableHead>Pickup time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {route.stops.map((stop) => (
                          <TableRow key={stop.id}>
                            <TableCell>{stop.order}</TableCell>
                            <TableCell className="font-medium">{stop.name}</TableCell>
                            <TableCell>{stop.pickupTime ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <EditStopDialog stop={stop} routeId={route.id} />
                                <DeleteStopButton id={stop.id} name={stop.name} />
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
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Student Assignments</CardTitle>
              <AssignTransportDialog students={studentOptions} routes={routeOptions} stops={stopOptions} />
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students assigned to transport yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class / Section</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Stop</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.student.user.name}</TableCell>
                        <TableCell>
                          {a.student.section ? `${a.student.section.class.name} ${a.student.section.name}` : "—"}
                        </TableCell>
                        <TableCell>{a.route.name}</TableCell>
                        <TableCell>{a.stop?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <RemoveTransportButton studentId={a.studentId} name={a.student.user.name} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
