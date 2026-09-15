import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
};

export default async function StudentNoticesPage() {
  await requireUser("STUDENT");

  const notices = await prisma.notice.findMany({
    where: {
      audience: { in: ["ALL", "STUDENTS"] },
      OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    },
    orderBy: { publishDate: "desc" },
  });

  return (
    <div>
      <PageHeader title="Notices" description="Announcements from the school administration." />

      {notices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No notices right now.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Card key={notice.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Megaphone className="size-4 text-primary" />
                    {notice.title}
                  </h3>
                  <Badge variant="secondary">{AUDIENCE_LABEL[notice.audience] ?? notice.audience}</Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
                <p className="text-xs text-muted-foreground">
                  Published {notice.publishDate.toLocaleDateString()}
                  {notice.expiryDate ? ` · Expires ${notice.expiryDate.toLocaleDateString()}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
