import { z } from "zod";

export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  content: z.string().min(1, "Content is required"),
  audience: z.enum(["ALL", "TEACHERS", "STUDENTS"]),
  expiryDate: z.string().optional().or(z.literal("")),
});
export type NoticeInput = z.infer<typeof noticeSchema>;

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(150),
    description: z.string().max(2000).optional().or(z.literal("")),
    location: z.string().max(150).optional().or(z.literal("")),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    audience: z.enum(["ALL", "TEACHERS", "STUDENTS"]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type EventInput = z.infer<typeof eventSchema>;

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(150),
  body: z.string().min(1, "Message is required"),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
