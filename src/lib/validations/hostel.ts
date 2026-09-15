import { z } from "zod";

export const hostelSchema = z.object({
  name: z.string().min(1, "Hostel name is required").max(100),
  type: z.enum(["BOYS", "GIRLS"]),
  warden: z.string().max(100).optional().or(z.literal("")),
});
export type HostelInput = z.infer<typeof hostelSchema>;

export const roomSchema = z.object({
  hostelId: z.string().min(1, "Hostel is required"),
  roomNumber: z.string().min(1, "Room number is required").max(20),
  capacity: z.number().int("Capacity must be a whole number").positive("Capacity must be greater than 0"),
});
export type RoomInput = z.infer<typeof roomSchema>;

export const allocateRoomSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  studentId: z.string().min(1, "Student is required"),
});
export type AllocateRoomInput = z.infer<typeof allocateRoomSchema>;
