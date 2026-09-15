import { z } from "zod";

export const examSchema = z
  .object({
    name: z.string().min(1, "Exam name is required").max(120),
    academicYearId: z.string().min(1, "Academic year is required"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type ExamInput = z.infer<typeof examSchema>;

export const examSubjectSchema = z
  .object({
    examId: z.string().min(1, "Exam is required"),
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    invigilatorId: z.string().optional().or(z.literal("")),
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Exam date must be in YYYY-MM-DD format")
      .optional()
      .or(z.literal("")),
    maxMarks: z.number().positive("Max marks must be a positive number"),
    passMarks: z.number().nonnegative("Pass marks cannot be negative"),
  })
  .refine((data) => data.passMarks <= data.maxMarks, {
    message: "Pass marks cannot exceed max marks",
    path: ["passMarks"],
  });
export type ExamSubjectInput = z.infer<typeof examSubjectSchema>;

export const markEntrySchema = z
  .object({
    studentId: z.string().min(1),
    marksObtained: z.number().min(0).nullable(),
    isAbsent: z.boolean(),
    remarks: z.string().optional(),
  })
  .refine((data) => data.isAbsent || data.marksObtained !== null, {
    message: "Marks are required unless the student is marked absent",
    path: ["marksObtained"],
  });
export type MarkEntryInput = z.infer<typeof markEntrySchema>;

export const marksEntrySchema = z.object({
  examSubjectId: z.string().min(1),
  marks: z.array(markEntrySchema).min(1, "No students to mark"),
});
export type MarksEntryInput = z.infer<typeof marksEntrySchema>;
