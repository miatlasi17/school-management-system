import { z } from "zod";

export const feeCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(80),
});
export type FeeCategoryInput = z.infer<typeof feeCategorySchema>;

export const feeStructureSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  feeCategoryId: z.string().min(1, "Fee category is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});
export type FeeStructureInput = z.infer<typeof feeStructureSchema>;

export const updateInvoiceSchema = z.object({
  dueDate: z.string().min(1, "Due date is required"),
  items: z
    .array(
      z.object({
        feeCategoryId: z.string().min(1, "Category is required"),
        amount: z.number().positive("Amount must be greater than 0"),
      })
    )
    .min(1, "At least one line item is required"),
});
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "CHEQUE"]),
  transactionRef: z.string().max(100).optional().or(z.literal("")),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
