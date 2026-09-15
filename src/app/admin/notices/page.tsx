import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddNoticeDialog, DeleteNoticeButton } from "./notice-dialogs";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
};

export default async function AdminNoticesPage() {
  const notices = await prisma.notice.findMany({ orderBy: { publishDate: "desc" } });

  return (
    <div>
      <PageHeader
        title="Notices"
        description="Publish announcements for staff and students."
        action={<AddNoticeDialog />}
      />

      <Card>
        <CardContent className="p-0">
          {notices.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No notices published yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="max-w-xs">
                      <p className="font-medium">{notice.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{notice.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{AUDIENCE_LABEL[notice.audience] ?? notice.audience}</Badge>
                    </TableCell>
                    <TableCell>{notice.publishDate.toLocaleDateString()}</TableCell>
                    <TableCell>{notice.expiryDate ? notice.expiryDate.toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <DeleteNoticeButton id={notice.id} title={notice.title} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
