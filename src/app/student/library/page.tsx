import { BookOpen, Library, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ISSUED: "secondary",
  RETURNED: "default",
  OVERDUE: "destructive",
  LOST: "destructive",
};

export default async function StudentLibraryPage() {
  const { student } = await requireStudent();

  const issues = await prisma.bookIssue.findMany({
    where: { studentId: student.id },
    include: { book: true },
    orderBy: { issueDate: "desc" },
  });

  const now = new Date();
  const borrowed = issues.filter((issue) => issue.status === "ISSUED");
  const history = issues.filter((issue) => issue.status !== "ISSUED");
  const overdueCount = borrowed.filter((issue) => issue.dueDate < now).length;
  const totalFines = issues.reduce((sum, issue) => sum + issue.fineAmount, 0);

  return (
    <div>
      <PageHeader title="Library" description="Books you currently have borrowed and your borrowing history." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Currently Borrowed" value={borrowed.length} icon={BookOpen} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} />
        <StatCard label="Total Fines" value={`₹${totalFines.toFixed(2)}`} icon={Library} />
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Currently Borrowed</h2>
        <Card>
          <CardContent className="p-0">
            {borrowed.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                You have no books currently borrowed.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowed.map((issue) => {
                    const isOverdue = issue.dueDate < now;
                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.book.title}</TableCell>
                        <TableCell>{issue.book.author}</TableCell>
                        <TableCell>{issue.issueDate.toLocaleDateString()}</TableCell>
                        <TableCell>{issue.dueDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary">On time</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No past book issues yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">{issue.book.title}</TableCell>
                      <TableCell>{issue.book.author}</TableCell>
                      <TableCell>{issue.issueDate.toLocaleDateString()}</TableCell>
                      <TableCell>{issue.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[issue.status] ?? "outline"}>{issue.status}</Badge>
                      </TableCell>
                      <TableCell>{issue.fineAmount > 0 ? `₹${issue.fineAmount.toFixed(2)}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
