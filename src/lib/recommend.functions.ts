/**
 * recommend.functions.ts
 * -------------------------------------------------------------
 * AI Recommendation step of the InfoPath learning loop:
 *   Placement test -> Skill Profile -> **AI Recommendation** -> Learning Path
 *
 * Takes the student's skill levels (0-100) plus the available subjects and
 * asks the Lovable AI Gateway to produce a short, prioritised, bilingual
 * study plan. Returns plain JSON; the caller stores it in `recommendations`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  skills: z
    .array(z.object({ key: z.string(), name_en: z.string(), level: z.number() }))
    .min(1),
  subjects: z
    .array(z.object({ code: z.string(), name_en: z.string(), skill_key: z.string().nullable() }))
    .default([]),
  // The learning paths the instructor published — the ONLY things AI may suggest.
  paths: z
    .array(z.object({ skill_key: z.string(), level: z.string(), title_en: z.string() }))
    .default([]),
});

export type Recommendation = {
  skill_key: string;
  subject_code: string | null;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  action_type: "course" | "project" | "challenge" | "review";
  priority: number;
};

const SYSTEM = `You are the InfoPath academic advisor for Information Technology students.
Given a student's skill profile (0-100 per skill) and the available subjects, produce 4 to 6
personalised, actionable recommendations that form a learning path.
Rules:
- You may ONLY recommend skills that appear in the provided "paths" list (learning paths the
  instructor published). Never invent a skill, a path or content outside that list.
- Start with the WEAKEST skills (lowest level) and give them priority 1.
- Mention a subject code from the provided list when relevant, otherwise null.
- action_type is one of: course, project, challenge, review.
- Every title/body must be provided in BOTH Arabic and English, short and concrete.
Reply with ONLY a JSON object: {"recommendations":[{"skill_key","subject_code","title_ar","title_en","body_ar","body_en","action_type","priority"}]}`;

export const generateRecommendations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<Recommendation[]> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = JSON.stringify({
      skills: data.skills,
      subjects: data.subjects,
      paths: data.paths,
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
        max_output_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("RATE_LIMIT");
      if (res.status === 402) throw new Error("NO_CREDITS");
      throw new Error(text || `AI request failed (${res.status})`);
    }

    // Reasoning runs take minutes, so the request streams; collect the text deltas.
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
          // Ignore keep-alive / partial frames.
        }
      }
    }


    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned an unreadable answer");
    const parsed = JSON.parse(match[0]) as { recommendations?: Recommendation[] };
    // Hard guard: drop anything outside the instructor-published paths.
    const allowed = new Set(data.paths.map((p) => p.skill_key));
    const list = (parsed.recommendations ?? []).filter(
      (r) => allowed.size === 0 || allowed.has(r.skill_key),
    );
    return list.slice(0, 6);
  });
