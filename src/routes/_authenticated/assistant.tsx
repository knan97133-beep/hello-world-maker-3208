/**
 * _authenticated/assistant.tsx
 * -------------------------------------------------------------
 * InfoPath AI assistant — the flagship feature.
 * A single ongoing conversation (kept in this browser via localStorage)
 * that answers questions, explains concepts, analyses code, suggests
 * roadmaps and summarises lectures. Answers stream in live.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "infopath-chat";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — InfoPath" },
      {
        name: "description",
        content:
          "Ask the InfoPath AI assistant to explain concepts, review code, summarise lectures and suggest a learning path.",
      },
      { property: "og:title", content: "AI Assistant — InfoPath" },
      {
        property: "og:description",
        content: "Your smart study companion: explanations, code analysis, summaries and suggestions.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore this browser's conversation after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch {
      /* ignore corrupted storage */
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const persist = (next: ChatMessage[]) => {
    setMessages(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-40)));
    } catch {
      /* storage full or unavailable */
    }
  };

  const suggestions = ar
    ? [
        "اشرح لي مفهوم الوراثة في البرمجة كائنية التوجه",
        "أعطني خطة دراسية لتعلم React خلال شهر",
        "حلّل هذا الكود واقترح تحسينات",
        "لخّص لي محاضرة عن قواعد البيانات العلائقية",
      ]
    : [
        "Explain inheritance in object oriented programming",
        "Give me a one-month plan to learn React",
        "Analyse this code and suggest improvements",
        "Summarise a lecture about relational databases",
      ];

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    persist(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (res.status === 429) throw new Error(ar ? "طلبات كثيرة، حاول بعد قليل." : "Too many requests, try again shortly.");
      if (res.status === 402)
        throw new Error(ar ? "انتهى رصيد الذكاء الاصطناعي." : "AI credits exhausted.");
      if (!res.ok || !res.body) throw new Error(ar ? "تعذّر الاتصال بالمساعد." : "Could not reach the assistant.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: answer }]);
      }

      persist([...next, { role: "assistant", content: answer || (ar ? "لا يوجد رد." : "No answer returned.") }]);
    } catch (error) {
      persist(next);
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Sparkles className="size-6 text-primary" />
            {ar ? "المساعد الذكي" : "AI Assistant"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "اسأل، اطلب شرحاً، حلّل كودك، أو لخّص محاضرتك."
              : "Ask questions, get explanations, analyse code or summarise lectures."}
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => persist([])}>
            <Trash2 className="size-4" />
            {ar ? "محادثة جديدة" : "New chat"}
          </Button>
        )}
      </header>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div ref={boxRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent-gradient text-primary-foreground">
                <Bot className="size-7" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                {ar
                  ? "ابدأ بسؤال، أو جرّب أحد الاقتراحات التالية:"
                  : "Start with a question, or try one of these:"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl",
                  m.role === "user"
                    ? "bg-secondary text-foreground"
                    : "bg-accent-gradient text-primary-foreground",
                )}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/70",
                )}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/80 [&_pre]:p-3">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 className="size-4 animate-spin" />
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2 border-t border-border/70 bg-card p-3"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={ar ? "اكتب سؤالك هنا..." : "Type your question..."}
            className="max-h-40 min-h-11 flex-1 resize-none"
          />
          <Button type="submit" size="icon" disabled={streaming || input.trim().length === 0}>
            {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
