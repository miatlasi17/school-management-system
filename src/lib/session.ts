import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (role && session.user.role !== role) redirect("/");
  return session.user;
}

export async function requireTeacher() {
  const user = await requireUser("TEACHER");
  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, teacher };
}

export async function requireStudent() {
  const user = await requireUser("STUDENT");
  const student = await prisma.student.findUniqueOrThrow({
    where: { userId: user.id },
    include: { section: { include: { class: true } } },
  });
  return { user, student };
}
