import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal(""));

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  admissionNo: z.string().min(1, "Admission number is required").max(30),
  rollNo: z.string().max(20).optional().or(z.literal("")),
  sectionId: z.string().min(1, "Section is required"),
  gender: genderSchema,
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  guardianName: z.string().max(100).optional().or(z.literal("")),
  guardianPhone: z.string().max(30).optional().or(z.literal("")),
  guardianEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  bloodGroup: z.string().max(10).optional().or(z.literal("")),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema.extend({
  isActive: z.boolean(),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  employeeId: z.string().min(1, "Employee ID is required").max(30),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  gender: genderSchema,
  qualification: z.string().max(100).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
});
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = createTeacherSchema;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
