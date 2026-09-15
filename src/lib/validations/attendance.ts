import { z } from "zod";

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED"]),
  remarks: z.string().optional(),
});
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;

export const markAttendanceSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  records: z.array(attendanceRecordSchema).min(1, "No students to mark"),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
