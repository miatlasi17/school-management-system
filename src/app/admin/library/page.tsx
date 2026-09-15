import { Library, Layers, BookOpen, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddBookDialog, EditBookDialog, DeleteBookButton } from "./book-dialogs";
import { IssueBookDialog, ReturnBookButton } from "./issue-dialogs";

export default async function LibraryPage() {
  const [books, issuedBooks, students] = await Promise.all([
    prisma.book.findMany({ orderBy: { title: "asc" } }),
    prisma.bookIssue.findMany({
      where: { status: "ISSUED" },
      include: { book: true, student: { include: { user: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const now = new Date();
  const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
  const overdueCount = issuedBooks.filter((issue) => issue.dueDate < now).length;

  const bookOptions = books.map((book) => ({
    id: book.id,
    label: book.title,
    availableCopies: book.availableCopies,
  }));
  const studentOptions = students.map((student) => ({
    id: student.id,
    label: `${student.user.name} (${student.admissionNo})`,
  }));

  return (
    <div>
      <PageHeader
        title="Library"
        description="Manage the book catalog and track issued books."
        action={
          <div className="flex gap-2">
            <IssueBookDialog books={bookOptions} students={studentOptions} />
            <AddBookDialog />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Books" value={books.length} icon={Library} />
        <StatCard label="Total Copies" value={totalCopies} icon={Layers} />
        <StatCard label="Currently Issued" value={issuedBooks.length} icon={BookOpen} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} />
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="issued">Issued Books</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <Card>
            <CardContent className="p-0">
              {books.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No books in the catalog yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Copies (available / total)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.category ?? "—"}</TableCell>
                        <TableCell>
                          {book.availableCopies} / {book.totalCopies}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <IssueBookDialog
                              books={bookOptions}
                              students={studentOptions}
                              book={{ id: book.id, label: book.title, availableCopies: book.availableCopies }}
                            />
                            <EditBookDialog
                              book={{
                                id: book.id,
                                title: book.title,
                                author: book.author,
                                isbn: book.isbn,
                                category: book.category,
                                publisher: book.publisher,
                                totalCopies: book.totalCopies,
                              }}
                            />
                            <DeleteBookButton id={book.id} title={book.title} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issued">
          <Card>
            <CardContent className="p-0">
              {issuedBooks.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No books are currently issued.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedBooks.map((issue) => {
                      const isOverdue = issue.dueDate < now;
                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium">{issue.book.title}</TableCell>
                          <TableCell>{issue.student.user.name}</TableCell>
                          <TableCell>{issue.issueDate.toLocaleDateString()}</TableCell>
                          <TableCell>{issue.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">Overdue</Badge>
                            ) : (
                              <Badge variant="secondary">On time</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <ReturnBookButton
                              bookIssueId={issue.id}
                              bookTitle={issue.book.title}
                              studentName={issue.student.user.name}
                              dueDate={issue.dueDate}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
