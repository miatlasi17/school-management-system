import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_OF_WEEK_VALUES, DAY_LABELS } from "@/lib/validations/timetable";

export default async function StudentTimetablePage() {
  const { student } = await requireStudent();

  const slots = student.sectionId
    ? await prisma.timetableSlot.findMany({
        where: { sectionId: student.sectionId },
        include: { subject: true, teacher: { include: { user: true } } },
        orderBy: { startTime: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Timetable"
        description={
          student.section
            ? `${student.section.class.name} ${student.section.name} weekly schedule.`
            : "Your weekly schedule."
        }
      />

      {!student.sectionId ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You are not assigned to a section yet. Please contact your school administrator.
          </CardContent>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No timetable slots have been scheduled for your section yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {DAY_OF_WEEK_VALUES.map((day) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === day);
            if (daySlots.length === 0) return null;
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-base">{DAY_LABELS[day]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{slot.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime} · {slot.teacher.user.name}
                          {slot.room ? ` · Room ${slot.room}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
