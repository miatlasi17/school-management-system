import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { MessageInbox } from "@/components/messages/message-inbox";
import { ComposeDialog } from "@/components/messages/compose-dialog";

export default async function StudentMessagesPage() {
  const user = await requireUser("STUDENT");

  const [inbox, sent, recipients] = await Promise.all([
    prisma.message.findMany({
      where: { receiverId: user.id },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { senderId: user.id },
      include: { receiver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { id: { not: user.id }, role: { in: ["ADMIN", "TEACHER"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const recipientOptions = recipients.map((u) => ({
    id: u.id,
    label: `${u.name} (${u.role === "ADMIN" ? "Admin" : "Teacher"})`,
  }));

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Send and receive messages with the administration and your teachers."
        action={<ComposeDialog recipients={recipientOptions} />}
      />
      <MessageInbox inbox={inbox} sent={sent} currentUserId={user.id} />
    </div>
  );
}
