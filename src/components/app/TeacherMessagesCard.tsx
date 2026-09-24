import { MessageSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathUpdates } from "@/lib/learning-path";
import { useSession } from "@/lib/session";

/** Messages the instructor sent to the student about their learning path. */
export function TeacherMessagesCard({ ar }: { ar: boolean }) {
  const { user } = useSession();
  const updates = usePathUpdates(user?.id);
  const messages = (updates.data ?? []).filter((u) => u.author_id !== user?.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="size-5 text-primary" />
          {ar ? "رسائل الأستاذ" : "Instructor messages"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {ar ? "لا توجد رسائل من الأستاذ بعد." : "No messages from your instructor yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-border/70 bg-muted/40 p-3">
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString(ar ? "ar" : "en")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
