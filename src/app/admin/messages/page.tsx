import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { MessageInbox } from "@/components/messages/message-inbox";
import { ComposeDialog } from "@/components/messages/compose-dialog";

export default async function AdminMessagesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [inbox, sent, recipients] = await Promise.all([
    prisma.message.findMany({
      where: { receiverId: userId },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      include: { receiver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { id: { not: userId }, role: { in: ["TEACHER", "STUDENT"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const recipientOptions = recipients.map((u) => ({
    id: u.id,
    label: `${u.name} (${u.role === "TEACHER" ? "Teacher" : "Student"})`,
  }));

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Send and receive messages with staff and students."
        action={<ComposeDialog recipients={recipientOptions} />}
      />
      <MessageInbox inbox={inbox} sent={sent} currentUserId={userId} />
    </div>
  );
}
