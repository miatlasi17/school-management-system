import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DAY_OF_WEEK_VALUES, DAY_LABELS } from "@/lib/validations/timetable";
import { AddSlotDialog, EditSlotDialog, DeleteSlotButton } from "./slot-dialogs";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { sectionId: sectionIdParam } = await searchParams;

  const sections = await prisma.section.findMany({
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
    include: { class: true },
  });

  const selectedSection = sections.find((s) => s.id === sectionIdParam) ?? sections[0];

  const [slots, subjects, teachers] = await Promise.all([
    selectedSection
      ? prisma.timetableSlot.findMany({
          where: { sectionId: selectedSection.id },
          include: { subject: true, teacher: { include: { user: true } } },
          orderBy: { startTime: "asc" },
        })
      : Promise.resolve([]),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const subjectOptions = subjects.map((s) => ({ id: s.id, label: s.name }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.user.name }));

  const visibleDays: (typeof DAY_OF_WEEK_VALUES)[number][] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  if (slots.some((s) => s.dayOfWeek === "SATURDAY")) visibleDays.push("SATURDAY");

  const periodKeys = Array.from(new Set(slots.map((s) => `${s.startTime}|${s.endTime}`))).sort((a, b) =>
    a.localeCompare(b)
  );

  const grid = periodKeys.map((key) => {
    const [startTime, endTime] = key.split("|");
    const cells = visibleDays.map(
      (day) => slots.find((s) => s.dayOfWeek === day && s.startTime === startTime && s.endTime === endTime) ?? null
    );
    return { startTime, endTime, cells };
  });

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly class schedule by section."
        action={
          selectedSection ? (
            <AddSlotDialog sectionId={selectedSection.id} subjects={subjectOptions} teachers={teacherOptions} />
          ) : null
        }
      />

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No sections yet. Create a class and section first.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/admin/timetable?sectionId=${section.id}`}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: selectedSection?.id === section.id ? "default" : "outline",
                  })
                )}
              >
                {section.class.name} {section.name}
              </Link>
            ))}
          </div>

          <Card>
            <CardContent className="overflow-x-auto">
              {grid.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No timetable slots for this section yet.
                </p>
              ) : (
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      {visibleDays.map((day) => (
                        <TableHead key={day}>{DAY_LABELS[day]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grid.map((row) => (
                      <TableRow key={`${row.startTime}-${row.endTime}`}>
                        <TableCell className="align-top text-xs whitespace-nowrap text-muted-foreground">
                          {row.startTime} - {row.endTime}
                        </TableCell>
                        {row.cells.map((slot, i) => (
                          <TableCell key={i} className="align-top whitespace-normal">
                            {slot ? (
                              <div className="rounded-md border bg-muted/40 p-2">
                                <p className="font-medium">{slot.subject.name}</p>
                                <p className="text-xs text-muted-foreground">{slot.teacher.user.name}</p>
                                {slot.room ? <p className="text-xs text-muted-foreground">Room {slot.room}</p> : null}
                                <div className="mt-1 flex gap-1">
                                  <EditSlotDialog
                                    slot={{
                                      id: slot.id,
                                      sectionId: slot.sectionId,
                                      subjectId: slot.subjectId,
                                      teacherId: slot.teacherId,
                                      dayOfWeek: slot.dayOfWeek,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                      room: slot.room,
                                    }}
                                    subjects={subjectOptions}
                                    teachers={teacherOptions}
                                  />
                                  <DeleteSlotButton
                                    id={slot.id}
                                    label={`${slot.subject.name} (${DAY_LABELS[slot.dayOfWeek]})`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
