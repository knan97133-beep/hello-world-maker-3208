/**
 * SubmissionCards.tsx
 * -------------------------------------------------------------
 *  - MySubmissionsCard   : the student sends a solution and sees grade + feedback
 *  - SubmissionReviewCard: the instructor/admin reviews, grades and closes it
 *
 * Grades land in the student's file (`progress`) and are blended into the
 * Skill Profile, so instructor follow-up feeds the adaptive loop.
 */
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Loader2, MessageSquare, Send, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useLearningPath } from "@/lib/learning-path";
import { useSession } from "@/lib/session";
import {
  reviewSubmission,
  sendSubmissionMessage,
  submitWork,
  useMySubmissions,
  useReviewQueue,
  useSubmissionMessages,
  type SubmissionStatus,
} from "@/lib/submissions";

/** Two-way conversation between the student and the instructor on a submission. */
function SubmissionThread({ submissionId, ar }: { submissionId: string; ar: boolean }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const messages = useSubmissionMessages(submissionId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function post() {
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      await sendSubmissionMessage({ submissionId, senderId: user.id, body: text });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["submission-messages", submissionId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-secondary/40 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <MessageSquare className="size-3.5" />
        {ar ? "المحادثة مع الأستاذ" : "Conversation"}
      </p>
      <div className="mt-2 space-y-2">
        {(messages.data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">
            {ar ? "لا توجد رسائل بعد." : "No messages yet."}
          </p>
        )}
        {(messages.data ?? []).map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.sender_id === user?.id ? "bg-primary/10" : "bg-card border border-border/70"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(m.created_at).toLocaleString(ar ? "ar" : "en")}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ar ? "اكتب رسالة…" : "Write a message…"}
          onKeyDown={(e) => {
            if (e.key === "Enter") void post();
          }}
        />
        <Button size="sm" onClick={post} disabled={busy || !text.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

const statusLabel = (status: string, ar: boolean) =>
  status === "pending"
    ? ar
      ? "قيد المراجعة"
      : "Pending"
    : status === "reviewed"
      ? ar
        ? "تمت المراجعة"
        : "Reviewed"
      : ar
        ? "مكتمل"
        : "Completed";

const statusClass = (status: string) =>
  status === "pending"
    ? "bg-secondary text-muted-foreground"
    : status === "reviewed"
      ? "bg-primary/15 text-primary"
      : "bg-primary text-primary-foreground";

/** Student view: submit a solution for a path step and read the feedback. */
export function MySubmissionsCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const path = useLearningPath(user?.id);
  const mine = useMySubmissions(user?.id);

  const targets = (path.data ?? []).filter(
    (i) => i.item_type === "project" || i.item_type === "challenge",
  );

  const [stepId, setStepId] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const step = targets.find((t) => t.id === stepId);
    if (!user || !step) return;
    setBusy(true);
    try {
      await submitWork({
        userId: user.id,
        title: ar ? step.title_ar : step.title_en,
        subjectId: step.subject_id,
        skillKey: step.skill_key,
        itemType: step.item_type === "challenge" ? "challenge" : "project",
        itemId: step.item_id,
        content,
        url,
      });
      setContent("");
      setUrl("");
      setStepId("");
      queryClient.invalidateQueries({ queryKey: ["submissions", user.id] });
      toast.success(ar ? "تم إرسال التسليم للأستاذ" : "Submitted to your instructor");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Send className="size-5 text-primary" />
        {ar ? "تسليم المشاريع والتكاليف" : "Project & assignment submissions"}
      </h2>

      {targets.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "لا يوجد مشروع أو تحدٍّ في مسارك الحالي بعد."
            : "No project or challenge in your current path yet."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">{ar ? "الخطوة" : "Step"}</Label>
            <Select value={stepId} onValueChange={setStepId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={ar ? "اختر مشروعاً أو تحدياً" : "Pick a project or challenge"} />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {ar ? t.title_ar : t.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{ar ? "رابط الحل (اختياري)" : "Solution link (optional)"}</Label>
            <Input
              className="mt-1"
              placeholder="https://github.com/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">{ar ? "وصف الحل" : "Solution notes"}</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button onClick={send} disabled={busy || !stepId}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {ar ? "إرسال" : "Submit"}
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {(mine.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            {ar ? "لا توجد تسليمات بعد." : "No submissions yet."}
          </p>
        )}
        {(mine.data ?? []).map((s) => (
          <div key={s.id} className="rounded-xl border border-border/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{s.title}</p>
              <span className={`rounded-md px-2 py-0.5 text-xs ${statusClass(s.status)}`}>
                {statusLabel(s.status, ar)}
              </span>
            </div>
            {s.grade !== null && (
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
                <Star className="size-4" />
                {ar ? "الدرجة" : "Grade"}: {s.grade}/100
              </p>
            )}
            {s.feedback && <p className="mt-1 text-sm text-muted-foreground">{s.feedback}</p>}
            <SubmissionThread submissionId={s.id} ar={ar} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Instructor / admin view: grade and close student submissions. */
export function SubmissionReviewCard({ subjectIds }: { subjectIds: string[] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const queue = useReviewQueue(subjectIds);

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ClipboardList className="size-5 text-primary" />
        {ar ? "متابعة تسليمات الطلاب" : "Student submissions follow-up"}
      </h2>

      {queue.isLoading ? (
        <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
      ) : (queue.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar ? "لا توجد تسليمات بعد." : "No submissions yet."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {(queue.data ?? []).map((s) => (
            <ReviewRow
              key={s.id}
              submission={s}
              ar={ar}
              reviewerId={user?.id}
              onDone={() => queryClient.invalidateQueries({ queryKey: ["review-queue"] })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewRow({
  submission,
  ar,
  reviewerId,
  onDone,
}: {
  submission: {
    id: string;
    title: string;
    content: string | null;
    url: string | null;
    status: string;
    grade: number | null;
    feedback: string | null;
    profiles?: { full_name: string | null } | null;
    subjects?: { code: string; name_ar: string; name_en: string } | null;
  };
  ar: boolean;
  reviewerId: string | undefined;
  onDone: () => void;
}) {
  const [grade, setGrade] = useState(String(submission.grade ?? ""));
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [status, setStatus] = useState<SubmissionStatus>(
    (submission.status as SubmissionStatus) ?? "pending",
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!reviewerId) return;
    setBusy(true);
    try {
      await reviewSubmission({
        id: submission.id,
        reviewerId,
        grade: Number(grade) || 0,
        feedback,
        status,
      });
      toast.success(ar ? "تم حفظ التقييم" : "Review saved");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{submission.title}</p>
          <p className="text-xs text-muted-foreground">
            {submission.profiles?.full_name ?? (ar ? "طالب" : "Student")}
            {submission.subjects ? ` · ${submission.subjects.code}` : ""}
          </p>
        </div>
        <span className={`rounded-md px-2 py-0.5 text-xs ${statusClass(submission.status)}`}>
          {statusLabel(submission.status, ar)}
        </span>
      </div>

      {submission.content && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.content}</p>
      )}
      {submission.url && (
        <a
          href={submission.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-sm text-primary underline"
        >
          {submission.url}
        </a>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr_160px]">
        <div>
          <Label className="text-xs">{ar ? "الدرجة" : "Grade"}</Label>
          <Input
            className="mt-1"
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">{ar ? "الملاحظات" : "Feedback"}</Label>
          <Input className="mt-1" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">{ar ? "الحالة" : "Status"}</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SubmissionStatus)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{statusLabel("pending", ar)}</SelectItem>
              <SelectItem value="reviewed">{statusLabel("reviewed", ar)}</SelectItem>
              <SelectItem value="completed">{statusLabel("completed", ar)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubmissionThread submissionId={submission.id} ar={ar} />

      <Button className="mt-3" size="sm" onClick={save} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {ar ? "حفظ التقييم" : "Save review"}
      </Button>
    </div>
  );
}
