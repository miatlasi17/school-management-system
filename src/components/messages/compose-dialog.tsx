"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendMessageSchema, type SendMessageInput } from "@/lib/validations/communication";
import { sendMessage } from "@/actions/communication";
import { toSelectItems } from "@/lib/utils";

type Recipient = { id: string; label: string };

export function ComposeDialog({ recipients }: { recipients: Recipient[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendMessageInput>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { receiverId: recipients[0]?.id ?? "", subject: "", body: "" },
  });

  function handleFormSubmit(values: SendMessageInput) {
    startTransition(async () => {
      const result = await sendMessage(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Message sent");
      setOpen(false);
      reset({ receiverId: recipients[0]?.id ?? "", subject: "", body: "" });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> New Message
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Send a message to a teacher, student, or administrator.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Controller
              control={control}
              name="receiverId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={toSelectItems(recipients)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.receiverId ? <p className="text-sm text-destructive">{errors.receiverId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Subject" {...register("subject")} />
            {errors.subject ? <p className="text-sm text-destructive">{errors.subject.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={5} placeholder="Write your message..." {...register("body")} />
            {errors.body ? <p className="text-sm text-destructive">{errors.body.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || recipients.length === 0}>
              {pending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
