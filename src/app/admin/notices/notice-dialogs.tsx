"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { noticeSchema, type NoticeInput } from "@/lib/validations/communication";
import { createNotice, deleteNotice } from "@/actions/communication";

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Everyone" },
  { value: "TEACHERS", label: "Teachers" },
  { value: "STUDENTS", label: "Students" },
] as const;

function NoticeForm({
  defaultValues,
  onSubmit,
  pending,
}: {
  defaultValues: NoticeInput;
  onSubmit: (values: NoticeInput) => void;
  pending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NoticeInput>({ resolver: zodResolver(noticeSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. School closed for holidays" {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" rows={4} placeholder="Notice details..." {...register("content")} />
        {errors.content ? <p className="text-sm text-destructive">{errors.content.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Audience</Label>
        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.audience ? <p className="text-sm text-destructive">{errors.audience.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry date</Label>
        <Input id="expiryDate" type="date" {...register("expiryDate")} />
        <p className="text-xs text-muted-foreground">Optional. Leave blank for a notice that never expires.</p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddNoticeDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(values: NoticeInput) {
    startTransition(async () => {
      const result = await createNotice(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Notice published");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Add Notice
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add notice</DialogTitle>
          <DialogDescription>Publish a notice to the selected audience.</DialogDescription>
        </DialogHeader>
        <NoticeForm
          defaultValues={{ title: "", content: "", audience: "ALL", expiryDate: "" }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteNoticeButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNotice(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Notice deleted");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" />}>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete this notice.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
