import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEventDialog, DeleteEventButton } from "./event-dialogs";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
};

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  const now = new Date();
  const upcoming = events.filter((e) => e.endDate >= now);
  const past = events.filter((e) => e.endDate < now).reverse();
  const ordered = [...upcoming, ...past];

  return (
    <div>
      <PageHeader
        title="Events"
        description="Schedule and manage upcoming school events."
        action={<AddEventDialog />}
      />

      {ordered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No events yet. Create your first event to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordered.map((event) => {
            const isPast = event.endDate < now;
            return (
              <Card key={event.id} className={isPast ? "opacity-60" : undefined}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {event.title}
                      <Badge variant="secondary">{AUDIENCE_LABEL[event.audience] ?? event.audience}</Badge>
                      {isPast ? <Badge variant="outline">Past</Badge> : null}
                    </CardTitle>
                    <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {event.startDate.toLocaleDateString()}
                        {event.endDate.getTime() !== event.startDate.getTime()
                          ? ` – ${event.endDate.toLocaleDateString()}`
                          : ""}
                      </span>
                      {event.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {event.location}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <DeleteEventButton id={event.id} title={event.title} />
                </CardHeader>
                {event.description ? (
                  <CardContent className="pt-0 text-sm text-muted-foreground">{event.description}</CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
