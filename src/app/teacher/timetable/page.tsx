import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_OF_WEEK_VALUES, DAY_LABELS } from "@/lib/validations/timetable";

export default async function TeacherTimetablePage() {
  const { teacher } = await requireTeacher();

  const slots = await prisma.timetableSlot.findMany({
    where: { teacherId: teacher.id },
    include: { subject: true, section: { include: { class: true } } },
    orderBy: { startTime: "asc" },
  });

  return (
    <div>
      <PageHeader title="My Timetable" description="Your weekly teaching schedule." />

      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No timetable slots assigned yet.
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
                        <p className="font-medium">
                          {slot.subject.name} · {slot.section.class.name} {slot.section.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime} {slot.room ? `· Room ${slot.room}` : ""}
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
