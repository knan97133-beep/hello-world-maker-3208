/**
 * _authenticated/playground.tsx — /playground
 * -------------------------------------------------------------
 * In-app coding lab. The student writes HTML / CSS / JavaScript in
 * three tabs and presses "Run": the code executes inside a sandboxed
 * iframe and the result appears on the right, together with a console
 * panel that captures console.log and runtime errors.
 *
 * Nothing leaves the browser — no external editor or website needed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Code2, Eraser, Play, Terminal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/playground")({
  head: () => ({
    meta: [
      { title: "Code Lab — write and run code inside InfoPath" },
      {
        name: "description",
        content:
          "Practice HTML, CSS and JavaScript directly inside InfoPath: write code, run it and see the live output and console without leaving the platform.",
      },
      { property: "og:title", content: "InfoPath Code Lab" },
      {
        property: "og:description",
        content: "Write and run HTML, CSS and JavaScript inside the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaygroundPage,
});

const STORAGE_KEY = "infopath-playground";

const starter = {
  html: `<div class="card">
  <h1>InfoPath</h1>
  <p id="out">اضغط الزر…</p>
  <button onclick="greet()">Click me</button>
</div>`,
  css: `body { font-family: system-ui; padding: 24px; background: #0f172a; color: #e2e8f0; }
.card { background:#1e293b; padding:24px; border-radius:16px; max-width:320px; }
button { background:#14b8a6; border:0; color:#04211d; padding:8px 16px; border-radius:8px; cursor:pointer; }`,
  js: `function greet() {
  document.getElementById("out").textContent = "Hello from JavaScript!";
  console.log("تم تنفيذ الكود بنجاح");
}`,
};

type Tab = "html" | "css" | "js";

/** Builds the sandboxed document, injecting a console bridge to the parent. */
function buildDoc(html: string, css: string, js: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>
<script>
  (function () {
    var send = function (level, args) {
      try {
        parent.postMessage({ __infopath: true, level: level, text: Array.from(args).map(function (a) {
          try { return typeof a === "object" ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
        }).join(" ") }, "*");
      } catch (e) {}
    };
    ["log", "info", "warn", "error"].forEach(function (k) {
      var orig = console[k];
      console[k] = function () { send(k, arguments); orig && orig.apply(console, arguments); };
    });
    window.addEventListener("error", function (e) { send("error", [e.message]); });
    window.addEventListener("unhandledrejection", function (e) { send("error", [String(e.reason)]); });
  })();
<\/script>
</head><body>${html}
<script>
try { ${js} } catch (err) { console.error(err && err.message ? err.message : err); }
<\/script></body></html>`;
}

function PlaygroundPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [tab, setTab] = useState<Tab>("html");
  const [code, setCode] = useState(starter);
  const [logs, setLogs] = useState<{ level: string; text: string }[]>([]);
  const [doc, setDoc] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);

  // Restore the last session from the browser.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setCode({ ...starter, ...JSON.parse(raw) });
      } catch {
        /* ignore malformed cache */
      }
    }
  }, []);

  // Receive console messages coming from the sandboxed iframe.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data && e.data.__infopath) {
        setLogs((l) => [...l, { level: e.data.level, text: e.data.text }].slice(-100));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const run = useCallback(() => {
    setLogs([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(code));
    setDoc(buildDoc(code.html, code.css, code.js));
  }, [code]);

  // Run once on first render so the student sees output immediately.
  useEffect(() => {
    setDoc(buildDoc(code.html, code.css, code.js));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "html", label: "HTML" },
    { key: "css", label: "CSS" },
    { key: "js", label: "JavaScript" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <Code2 className="size-7 text-primary" />
          {ar ? "مختبر الأكواد" : "Code Lab"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "اكتب الكود ونفّذه هنا مباشرة — بدون مغادرة الموقع. النتيجة تظهر على اليسار مع سجل الأخطاء."
            : "Write your code and run it right here — no external editor. Output and console appear beside it."}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="flex items-center gap-1 border-b border-border/70 p-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {t.label}
              </button>
            ))}
            <div className="ms-auto flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setCode({ ...code, [tab]: "" })}>
                <Eraser className="size-4" />
                {ar ? "مسح" : "Clear"}
              </Button>
              <Button size="sm" onClick={run}>
                <Play className="size-4" />
                {ar ? "تشغيل" : "Run"}
              </Button>
            </div>
          </div>
          <textarea
            dir="ltr"
            spellCheck={false}
            value={code[tab]}
            onChange={(e) => setCode({ ...code, [tab]: e.target.value })}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter runs, Tab inserts two spaces.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                run();
              }
              if (e.key === "Tab") {
                e.preventDefault();
                const el = e.currentTarget;
                const start = el.selectionStart;
                const next = code[tab].slice(0, start) + "  " + code[tab].slice(el.selectionEnd);
                setCode({ ...code, [tab]: next });
                requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
              }
            }}
            className="h-[360px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <p className="border-b border-border/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
              {ar ? "النتيجة" : "Output"}
            </p>
            <iframe
              ref={frame}
              title="output"
              sandbox="allow-scripts allow-modals"
              srcDoc={doc}
              className="h-[260px] w-full bg-white"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <p className="flex items-center gap-2 border-b border-border/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
              <Terminal className="size-3.5" />
              {ar ? "الطرفية (Console)" : "Console"}
            </p>
            <div dir="ltr" className="h-[120px] overflow-auto p-3 font-mono text-xs">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">
                  {ar ? "لا توجد رسائل بعد." : "No messages yet."}
                </span>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap",
                      l.level === "error"
                        ? "text-destructive"
                        : l.level === "warn"
                          ? "text-amber-500"
                          : "text-foreground",
                    )}
                  >
                    {l.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
