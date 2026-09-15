import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(150),
  isbn: z.string().max(30).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  publisher: z.string().max(150).optional().or(z.literal("")),
  totalCopies: z.number().int("Must be a whole number").positive("Must be at least 1"),
});
export type BookInput = z.infer<typeof bookSchema>;

export const issueBookSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  studentId: z.string().min(1, "Student is required"),
  dueDate: z.string().min(1, "Due date is required"),
});
export type IssueBookInput = z.infer<typeof issueBookSchema>;
