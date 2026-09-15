"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  vehicleSchema,
  routeSchema,
  routeStopSchema,
  assignTransportSchema,
} from "@/lib/validations/transport";
import { errorResult, type ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function createVehicle(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.vehicle.create({
      data: {
        number: parsed.data.number,
        capacity: parsed.data.capacity,
        driverName: parsed.data.driverName || null,
        driverPhone: parsed.data.driverPhone || null,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create vehicle.");
  }
}

export async function updateVehicle(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.vehicle.update({
      where: { id },
      data: {
        number: parsed.data.number,
        capacity: parsed.data.capacity,
        driverName: parsed.data.driverName || null,
        driverPhone: parsed.data.driverPhone || null,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update vehicle.");
  }
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    const routeCount = await prisma.route.count({ where: { vehicleId: id } });
    if (routeCount > 0) {
      return { error: "Could not delete vehicle. Unassign it from all routes first." };
    }
    await prisma.vehicle.delete({ where: { id } });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete vehicle.");
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function createRoute(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.route.create({
      data: {
        name: parsed.data.name,
        vehicleId: parsed.data.vehicleId || null,
        fare: parsed.data.fare,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create route.");
  }
}

export async function updateRoute(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.route.update({
      where: { id },
      data: {
        name: parsed.data.name,
        vehicleId: parsed.data.vehicleId || null,
        fare: parsed.data.fare,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update route.");
  }
}

export async function deleteRoute(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    // Stops and student assignments cascade-delete with the route (see schema).
    await prisma.route.delete({ where: { id } });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete route.");
  }
}

// ---------------------------------------------------------------------------
// Route stops
// ---------------------------------------------------------------------------

export async function createRouteStop(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = routeStopSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.routeStop.create({
      data: {
        routeId: parsed.data.routeId,
        name: parsed.data.name,
        pickupTime: parsed.data.pickupTime || null,
        order: parsed.data.order,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not create stop.");
  }
}

export async function updateRouteStop(id: string, input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = routeStopSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.routeStop.update({
      where: { id },
      data: {
        routeId: parsed.data.routeId,
        name: parsed.data.name,
        pickupTime: parsed.data.pickupTime || null,
        order: parsed.data.order,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not update stop.");
  }
}

export async function deleteRouteStop(id: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.routeStop.delete({ where: { id } });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not delete stop.");
  }
}

// ---------------------------------------------------------------------------
// Student assignments
// ---------------------------------------------------------------------------

export async function assignStudentTransport(input: unknown): Promise<ActionResult> {
  await requireUser("ADMIN");
  const parsed = assignTransportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.studentTransport.upsert({
      where: { studentId: parsed.data.studentId },
      update: {
        routeId: parsed.data.routeId,
        stopId: parsed.data.stopId || null,
      },
      create: {
        studentId: parsed.data.studentId,
        routeId: parsed.data.routeId,
        stopId: parsed.data.stopId || null,
      },
    });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not assign transport.");
  }
}

export async function removeStudentTransport(studentId: string): Promise<ActionResult> {
  await requireUser("ADMIN");
  try {
    await prisma.studentTransport.delete({ where: { studentId } });
    revalidatePath("/admin/transport");
    return { success: true };
  } catch (error) {
    return errorResult(error, "Could not remove assignment.");
  }
}
