import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(50),
  order: z.number().int().min(0).max(20),
});
export type ClassInput = z.infer<typeof classSchema>;

export const sectionSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  name: z.string().min(1, "Section name is required").max(10),
  roomNumber: z.string().max(30).optional().or(z.literal("")),
  classTeacherId: z.string().optional().or(z.literal("")),
});
export type SectionInput = z.infer<typeof sectionSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(80),
  code: z
    .string()
    .min(1, "Subject code is required")
    .max(15)
    .transform((v) => v.toUpperCase()),
});
export type SubjectInput = z.infer<typeof subjectSchema>;

export const classSubjectSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().optional().or(z.literal("")),
});
export type ClassSubjectInput = z.infer<typeof classSubjectSchema>;
