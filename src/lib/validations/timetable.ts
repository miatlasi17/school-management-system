import { z } from "zod";

export const DAY_OF_WEEK_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const DAY_LABELS: Record<(typeof DAY_OF_WEEK_VALUES)[number], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timetableSlotSchema = z
  .object({
    sectionId: z.string().min(1, "Section is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    dayOfWeek: z.enum(DAY_OF_WEEK_VALUES),
    startTime: z.string().regex(timePattern, "Use HH:MM format"),
    endTime: z.string().regex(timePattern, "Use HH:MM format"),
    room: z.string().max(30).optional().or(z.literal("")),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>;
