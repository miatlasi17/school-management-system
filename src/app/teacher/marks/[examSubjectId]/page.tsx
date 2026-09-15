import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { MarksGrid, type MarksGridExistingMark } from "@/app/admin/exams/[id]/[examSubjectId]/marks-grid";

export default async function TeacherMarksEntryPage({
  params,
}: {
  params: Promise<{ examSubjectId: string }>;
}) {
  const { teacher } = await requireTeacher();
  const { examSubjectId } = await params;

  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: { exam: true, class: true, subject: true },
  });
  if (!examSubject) notFound();

  const classSubject = await prisma.classSubject.findUnique({
    where: { classId_subjectId: { classId: examSubject.classId, subjectId: examSubject.subjectId } },
  });

  if (!classSubject || classSubject.teacherId !== teacher.id) {
    return (
      <div>
        <PageHeader title="Access denied" description="You are not assigned to teach this subject for this class." />
      </div>
    );
  }

  const [students, existingMarks] = await Promise.all([
    prisma.student.findMany({
      where: { section: { classId: examSubject.classId }, isActive: true },
      include: { user: true, section: true },
      orderBy: [{ section: { name: "asc" } }, { rollNo: "asc" }],
    }),
    prisma.mark.findMany({ where: { examSubjectId } }),
  ]);

  const marksMap = new Map(existingMarks.map((m) => [m.studentId, m]));

  const studentRows = students.map((s) => ({
    id: s.id,
    name: s.user.name,
    rollNo: s.rollNo,
    section: s.section?.name ?? "—",
  }));

  const existing: Record<string, MarksGridExistingMark> = Object.fromEntries(
    students.map((s) => {
      const m = marksMap.get(s.id);
      return [s.id, m ? { marksObtained: m.marksObtained, isAbsent: m.isAbsent, remarks: m.remarks ?? "" } : null];
    })
  );

  return (
    <div>
      <PageHeader
        title={`${examSubject.subject.name} · ${examSubject.class.name}`}
        description={`${examSubject.exam.name} — Max marks ${examSubject.maxMarks}, Pass marks ${examSubject.passMarks}`}
      />
      <MarksGrid
        examSubjectId={examSubject.id}
        maxMarks={examSubject.maxMarks}
        students={studentRows}
        existingMarks={existing}
      />
    </div>
  );
}
