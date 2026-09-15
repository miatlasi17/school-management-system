import { z } from "zod";

export const vehicleSchema = z.object({
  number: z.string().min(1, "Vehicle number is required").max(30),
  capacity: z.number().int("Capacity must be a whole number").positive("Capacity must be greater than 0"),
  driverName: z.string().max(100).optional().or(z.literal("")),
  driverPhone: z.string().max(30).optional().or(z.literal("")),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

export const routeSchema = z.object({
  name: z.string().min(1, "Route name is required").max(100),
  vehicleId: z.string().optional().or(z.literal("")),
  fare: z.number().nonnegative("Fare cannot be negative"),
});
export type RouteInput = z.infer<typeof routeSchema>;

export const routeStopSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  name: z.string().min(1, "Stop name is required").max(100),
  pickupTime: z.string().max(5).optional().or(z.literal("")),
  order: z.number().int("Order must be a whole number"),
});
export type RouteStopInput = z.infer<typeof routeStopSchema>;

export const assignTransportSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeId: z.string().min(1, "Route is required"),
  stopId: z.string().optional().or(z.literal("")),
});
export type AssignTransportInput = z.infer<typeof assignTransportSchema>;
