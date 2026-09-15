import { z } from "zod";

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);

export const staffSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(30),
  name: z.string().min(1, "Name is required").max(120),
  designation: z.string().min(1, "Designation is required").max(100),
  department: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  gender: genderEnum.optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
});
export type StaffInput = z.infer<typeof staffSchema>;

export const salaryStructureSchema = z
  .object({
    teacherId: z.string().optional().or(z.literal("")),
    staffId: z.string().optional().or(z.literal("")),
    basic: z.number().nonnegative("Basic salary must be zero or more"),
    // Note: intentionally not using zod's `.default(0)` here — combined with zodResolver it makes the
    // resolver's input/output types diverge (input optional, output required) and breaks type inference
    // (mirrors the documented z.coerce.number() + zodResolver gotcha). Callers supply 0 via form defaultValues instead.
    allowances: z.number().nonnegative("Allowances must be zero or more"),
    deductions: z.number().nonnegative("Deductions must be zero or more"),
  })
  .refine((data) => Boolean(data.teacherId) !== Boolean(data.staffId), {
    message: "Provide exactly one of teacher or staff.",
    path: ["staffId"],
  });
export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>;

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});
export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
