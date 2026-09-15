import { Mail, MailOpen, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkReadButton } from "@/components/messages/mark-read-button";

export type InboxMessage = {
  id: string;
  subject: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  sender: { id: string; name: string; email: string };
};

export type SentMessage = {
  id: string;
  subject: string;
  body: string;
  createdAt: Date;
  receiver: { id: string; name: string; email: string };
};

export function MessageInbox({
  inbox,
  sent,
  currentUserId,
}: {
  inbox: InboxMessage[];
  sent: SentMessage[];
  currentUserId: string;
}) {
  const unreadCount = inbox.filter((m) => !m.readAt).length;

  return (
    <Tabs defaultValue="inbox">
      <TabsList>
        <TabsTrigger value="inbox" className="gap-1.5">
          Inbox
          {unreadCount > 0 ? <Badge className="h-4 min-w-4 px-1">{unreadCount}</Badge> : null}
        </TabsTrigger>
        <TabsTrigger value="sent">Sent</TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" className="mt-4 space-y-3">
        {inbox.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Your inbox is empty.
            </CardContent>
          </Card>
        ) : (
          inbox.map((message) => {
            const isUnread = !message.readAt;
            return (
              <Card key={message.id} data-user={currentUserId} className={isUnread ? "border-primary/40" : undefined}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isUnread ? (
                        <Mail className="size-4 shrink-0 text-primary" />
                      ) : (
                        <MailOpen className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className={isUnread ? "font-semibold" : "font-medium"}>{message.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          From {message.sender.name} &lt;{message.sender.email}&gt;
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUnread ? <Badge variant="secondary">Unread</Badge> : null}
                      <span className="text-xs text-muted-foreground">{message.createdAt.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message.body}</p>
                  {isUnread ? (
                    <div className="pt-1">
                      <MarkReadButton id={message.id} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>

      <TabsContent value="sent" className="mt-4 space-y-3">
        {sent.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              You haven&apos;t sent any messages yet.
            </CardContent>
          </Card>
        ) : (
          sent.map((message) => (
            <Card key={message.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Send className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{message.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        To {message.receiver.name} &lt;{message.receiver.email}&gt;
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{message.createdAt.toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message.body}</p>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
