import { PrismaClient, Role, Gender, DayOfWeek, AttendanceStatus, HostelType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  const password = await hash("Password123!");

  // ---------------------------------------------------------------------
  // Academic year
  // ---------------------------------------------------------------------
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2025/2026" },
    update: {},
    create: {
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-07-31"),
      isCurrent: true,
    },
  });

  // ---------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@school.test" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "admin@school.test",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  // ---------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------
  const subjectDefs = [
    { name: "Mathematics", code: "MATH" },
    { name: "English Language", code: "ENG" },
    { name: "Science", code: "SCI" },
    { name: "History", code: "HIST" },
    { name: "Physical Education", code: "PE" },
    { name: "Art", code: "ART" },
  ];
  const subjects = [];
  for (const s of subjectDefs) {
    subjects.push(
      await prisma.subject.upsert({ where: { code: s.code }, update: {}, create: s })
    );
  }

  // ---------------------------------------------------------------------
  // Classes & Sections
  // ---------------------------------------------------------------------
  const classDefs = [
    { name: "Grade 7", order: 7 },
    { name: "Grade 8", order: 8 },
    { name: "Grade 9", order: 9 },
  ];
  const classes = [];
  for (const c of classDefs) {
    classes.push(await prisma.schoolClass.upsert({ where: { name: c.name }, update: {}, create: c }));
  }

  const sections: { id: string; name: string; classId: string }[] = [];
  for (const cls of classes) {
    for (const name of ["A", "B"]) {
      const section = await prisma.section.upsert({
        where: { classId_name: { classId: cls.id, name } },
        update: {},
        create: { classId: cls.id, name, roomNumber: `${cls.name.split(" ")[1]}${name}` },
      });
      sections.push(section);
    }
  }

  // ---------------------------------------------------------------------
  // Teachers
  // ---------------------------------------------------------------------
  const teacherDefs = [
    { name: "Priya Sharma", email: "priya.sharma@school.test", employeeId: "T-1001", subjectCodes: ["MATH"] },
    { name: "James Whitfield", email: "james.whitfield@school.test", employeeId: "T-1002", subjectCodes: ["ENG"] },
    { name: "Amara Okafor", email: "amara.okafor@school.test", employeeId: "T-1003", subjectCodes: ["SCI"] },
    { name: "Liam Novak", email: "liam.novak@school.test", employeeId: "T-1004", subjectCodes: ["HIST", "ART"] },
    { name: "Sofia Reyes", email: "sofia.reyes@school.test", employeeId: "T-1005", subjectCodes: ["PE"] },
  ];

  const teachers = [];
  for (const t of teacherDefs) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: { name: t.name, email: t.email, passwordHash: password, role: Role.TEACHER },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: t.employeeId,
        gender: Gender.OTHER,
        qualification: "B.Ed.",
        joiningDate: new Date("2022-08-15"),
        phone: "+44 20 7946 0958",
      },
    });
    teachers.push({ ...teacher, subjectCodes: t.subjectCodes });
  }

  // Assign class teachers (first teacher on section A/B per class, round robin)
  for (let i = 0; i < sections.length; i++) {
    await prisma.section.update({
      where: { id: sections[i].id },
      data: { classTeacherId: teachers[i % teachers.length].id },
    });
  }

  // Assign subjects to classes with teachers
  for (const cls of classes) {
    for (const subject of subjects) {
      const teacher = teachers.find((t) => t.subjectCodes.includes(subject.code)) ?? teachers[0];
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
        update: { teacherId: teacher.id },
        create: { classId: cls.id, subjectId: subject.id, teacherId: teacher.id },
      });
    }
  }

  // Simple timetable: Mon-Fri, subjects rotate through periods for each section
  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
  ];
  const periodTimes = [
    ["09:00", "09:45"],
    ["09:45", "10:30"],
    ["10:45", "11:30"],
    ["11:30", "12:15"],
  ];
  await prisma.timetableSlot.deleteMany({});
  for (const section of sections) {
    for (const day of days) {
      for (let p = 0; p < periodTimes.length; p++) {
        const subject = subjects[(p + days.indexOf(day)) % subjects.length];
        const teacher = teachers.find((t) => t.subjectCodes.includes(subject.code)) ?? teachers[0];
        await prisma.timetableSlot.create({
          data: {
            sectionId: section.id,
            subjectId: subject.id,
            teacherId: teacher.id,
            dayOfWeek: day,
            startTime: periodTimes[p][0],
            endTime: periodTimes[p][1],
            room: section.name,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Students
  // ---------------------------------------------------------------------
  const firstNames = ["Emma", "Noah", "Olivia", "Liam", "Ava", "Mason", "Isabella", "Ethan", "Mia", "Lucas", "Zoe", "Kai"];
  const lastNames = ["Bennett", "Clarke", "Dubois", "Farrow", "Grant", "Holt", "Ibrahim", "Johal", "Kaur", "Lindqvist"];

  const students: { id: string; sectionId: string; name: string }[] = [];
  let admissionCounter = 1;
  for (const section of sections) {
    for (let i = 0; i < 6; i++) {
      const first = firstNames[(admissionCounter + i) % firstNames.length];
      const last = lastNames[(admissionCounter * 3 + i) % lastNames.length];
      const name = `${first} ${last}`;
      const email = `${first.toLowerCase()}.${last.toLowerCase()}${admissionCounter}@school.test`;
      const admissionNo = `S-${String(2000 + admissionCounter).padStart(5, "0")}`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, passwordHash: password, role: Role.STUDENT },
      });

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          admissionNo,
          rollNo: String(i + 1),
          sectionId: section.id,
          gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
          dateOfBirth: new Date(2012 - Math.floor(admissionCounter / 6), i, 10),
          admissionDate: new Date("2025-09-01"),
          guardianName: `${lastNames[(admissionCounter + 2) % lastNames.length]} Family`,
          guardianPhone: "+44 7700 900000",
          guardianEmail: `guardian${admissionCounter}@family.test`,
          bloodGroup: ["O+", "A+", "B+", "AB+"][i % 4],
        },
      });

      students.push({ id: student.id, sectionId: section.id, name });
      admissionCounter++;
    }
  }

  // ---------------------------------------------------------------------
  // Attendance for the last 10 days (weekdays only)
  // ---------------------------------------------------------------------
  const today = new Date();
  const attendanceDates: Date[] = [];
  const cursor = new Date(today);
  while (attendanceDates.length < 10) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      attendanceDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  for (const date of attendanceDates) {
    for (const student of students) {
      const roll = Math.random();
      const status = roll > 0.93 ? AttendanceStatus.ABSENT : roll > 0.88 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: {},
        create: {
          studentId: student.id,
          sectionId: student.sectionId,
          date,
          status,
          markedById: adminUser.id,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Exam + marks
  // ---------------------------------------------------------------------
  const exam = await prisma.exam.create({
    data: {
      name: "Mid-Term Examination",
      academicYearId: academicYear.id,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-10"),
    },
  });

  for (const cls of classes) {
    for (const subject of subjects.slice(0, 4)) {
      const classSubject = await prisma.classSubject.findUnique({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
      });
      const examSubject = await prisma.examSubject.create({
        data: {
          examId: exam.id,
          classId: cls.id,
          subjectId: subject.id,
          invigilatorId: classSubject?.teacherId,
          examDate: new Date("2025-12-03"),
          maxMarks: 100,
          passMarks: 35,
        },
      });

      const classStudents = students.filter((s) =>
        sections.find((sec) => sec.id === s.sectionId)?.classId === cls.id
      );
      for (const student of classStudents) {
        await prisma.mark.create({
          data: {
            examSubjectId: examSubject.id,
            studentId: student.id,
            marksObtained: Math.floor(40 + Math.random() * 60),
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Fees
  // ---------------------------------------------------------------------
  const feeCategoryDefs = ["Tuition", "Transport", "Library", "Sports"];
  const feeCategories = [];
  for (const name of feeCategoryDefs) {
    feeCategories.push(await prisma.feeCategory.upsert({ where: { name }, update: {}, create: { name } }));
  }

  for (const cls of classes) {
    for (const [i, category] of feeCategories.entries()) {
      await prisma.feeStructure.upsert({
        where: {
          classId_feeCategoryId_academicYearId: {
            classId: cls.id,
            feeCategoryId: category.id,
            academicYearId: academicYear.id,
          },
        },
        update: {},
        create: {
          classId: cls.id,
          feeCategoryId: category.id,
          academicYearId: academicYear.id,
          amount: 500 + i * 150,
        },
      });
    }
  }

  let invoiceCounter = 1;
  for (const student of students) {
    const cls = classes.find(
      (c) => c.id === sections.find((s) => s.id === student.sectionId)?.classId
    )!;
    const structures = await prisma.feeStructure.findMany({
      where: { classId: cls.id, academicYearId: academicYear.id },
    });
    const total = structures.reduce((sum, s) => sum + s.amount, 0);

    const invoice = await prisma.invoice.create({
      data: {
        studentId: student.id,
        academicYearId: academicYear.id,
        invoiceNumber: `INV-2025-${String(invoiceCounter).padStart(4, "0")}`,
        dueDate: new Date("2025-10-15"),
        status: "UNPAID",
        items: {
          create: structures.map((s) => ({ feeCategoryId: s.feeCategoryId, amount: s.amount })),
        },
      },
    });

    // Roughly two thirds of students have paid in full or in part
    const paidRoll = Math.random();
    if (paidRoll > 0.35) {
      const paidAmount = paidRoll > 0.7 ? total : Math.round(total * 0.5);
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          method: "BANK_TRANSFER",
          receivedById: adminUser.id,
        },
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: paidAmount >= total ? "PAID" : "PARTIALLY_PAID" },
      });
    }
    invoiceCounter++;
  }

  // ---------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------
  const books = await Promise.all([
    prisma.book.create({ data: { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", totalCopies: 4, availableCopies: 3 } }),
    prisma.book.create({ data: { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", totalCopies: 6, availableCopies: 5 } }),
    prisma.book.create({ data: { title: "The Elements of Style", author: "Strunk & White", category: "Reference", totalCopies: 3, availableCopies: 3 } }),
  ]);

  await prisma.bookIssue.create({
    data: {
      bookId: books[0].id,
      studentId: students[0].id,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: "ISSUED",
    },
  });
  await prisma.bookIssue.create({
    data: {
      bookId: books[1].id,
      studentId: students[1].id,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: "ISSUED",
    },
  });

  // ---------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------
  const vehicle = await prisma.vehicle.create({
    data: { number: "SCH-101", capacity: 40, driverName: "Robert Hale", driverPhone: "+44 7700 900111" },
  });
  const route = await prisma.route.create({
    data: { name: "North Loop", vehicleId: vehicle.id, fare: 45 },
  });
  const stops = await Promise.all([
    prisma.routeStop.create({ data: { routeId: route.id, name: "Maple Street", order: 1, pickupTime: "07:30" } }),
    prisma.routeStop.create({ data: { routeId: route.id, name: "Cedar Avenue", order: 2, pickupTime: "07:45" } }),
    prisma.routeStop.create({ data: { routeId: route.id, name: "School Gate", order: 3, pickupTime: "08:00" } }),
  ]);
  await prisma.studentTransport.create({
    data: { studentId: students[0].id, routeId: route.id, stopId: stops[0].id },
  });

  // ---------------------------------------------------------------------
  // Hostel
  // ---------------------------------------------------------------------
  const hostel = await prisma.hostel.create({
    data: { name: "Elm House", type: HostelType.GIRLS, warden: "Mrs. Fatima Yusuf" },
  });
  const room = await prisma.room.create({ data: { hostelId: hostel.id, roomNumber: "101", capacity: 3 } });
  await prisma.roomAllocation.create({ data: { roomId: room.id, studentId: students[2].id } });

  // ---------------------------------------------------------------------
  // HR / payroll
  // ---------------------------------------------------------------------
  const staff = await prisma.staff.create({
    data: { employeeId: "ST-2001", name: "Grace Muthoni", designation: "Front Office Manager", department: "Administration" },
  });
  await prisma.salaryStructure.create({
    data: { staffId: staff.id, basic: 2200, allowances: 300, deductions: 150 },
  });
  for (const t of teachers) {
    await prisma.salaryStructure.create({
      data: { teacherId: t.id, basic: 2800, allowances: 400, deductions: 200 },
    });
  }

  // ---------------------------------------------------------------------
  // Notices & Events
  // ---------------------------------------------------------------------
  await prisma.notice.create({
    data: {
      title: "Mid-Term Exams Schedule Released",
      content: "The mid-term examination timetable has been published. Please check the exams section for your class schedule.",
      audience: "ALL",
      publishedById: adminUser.id,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Staff Meeting - Friday 3pm",
      content: "All teaching staff are required to attend the curriculum planning meeting in the main hall.",
      audience: "TEACHERS",
      publishedById: adminUser.id,
    },
  });

  await prisma.event.create({
    data: {
      title: "Annual Sports Day",
      description: "Inter-house athletics competition on the main field.",
      location: "Main Field",
      startDate: new Date("2025-11-20T09:00:00"),
      endDate: new Date("2025-11-20T15:00:00"),
      audience: "ALL",
      publishedById: adminUser.id,
    },
  });

  console.log("Seed complete.");
  console.log("Login with:");
  console.log("  Admin:   admin@school.test / Password123!");
  console.log(`  Teacher: ${teacherDefs[0].email} / Password123!`);
  console.log("  Student: (see console/db) / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
