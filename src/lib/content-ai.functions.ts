/**
 * content-ai.functions.ts
 * -------------------------------------------------------------
 * Instructor tooling: ask the AI to DRAFT platform content
 * (course outline, quiz, challenge, project) or to suggest external
 * learning resources on the web.
 *
 * The AI never publishes anything: everything comes back as JSON,
 * the instructor reviews it, and only then it is stored as a draft and
 * published. Access is enforced in the database (RLS) as well.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  kind: z.enum(["course", "quiz", "challenge", "project", "external"]),
  topic: z.string().min(2).max(200),
  skill_name: z.string().default("general"),
  level: z.enum(["easy", "medium", "hard"]).default("easy"),
});

export type DraftItem = {
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  url?: string | null;
  provider?: string | null;
  options_ar?: string[];
  options_en?: string[];
  correct_index?: number;
};

const SYSTEM = `You draft teaching material for InfoPath, a platform for Information Technology students.
You NEVER publish: you only propose drafts that a human instructor will review.
Rules:
- Everything must be bilingual: Arabic (ar) and English (en), short and concrete.
- Respect the requested difficulty level.
- kind=course   -> 3 to 5 lesson items; each item may include a real, well-known public url (YouTube/docs) and provider.
- kind=quiz     -> 4 to 6 multiple choice questions; each item has options_ar, options_en (4 options, same order) and correct_index (0-3).
- kind=challenge-> 3 to 5 small hands-on coding challenges; body = the task statement.
- kind=project  -> 2 to 3 practical projects; body = scope + deliverables.
- kind=external -> 4 to 6 REAL external learning resources with a url and provider; these are references, not platform courses.
Reply with ONLY JSON: {"items":[{"title_ar","title_en","body_ar","body_en","url","provider","options_ar","options_en","correct_index"}]}`;

export const generateContentDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<DraftItem[]> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = JSON.stringify({
      kind: data.kind,
      topic: data.topic,
      skill: data.skill_name,
      level: data.level,
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: SYSTEM,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
        store: false,
        stream: true,
        max_output_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("RATE_LIMIT");
      if (res.status === 402) throw new Error("NO_CREDITS");
      throw new Error(text || `AI request failed (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("AI returned an empty response");
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as { type?: string; delta?: string };
          if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
        } catch {
          // ignore keep-alive frames
        }
      }
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned an unreadable answer");
    const parsed = JSON.parse(match[0]) as { items?: DraftItem[] };
    return (parsed.items ?? []).slice(0, 8);
  });
