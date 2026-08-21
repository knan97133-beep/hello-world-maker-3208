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

    const prompt = JSON.stringify({ skills: data.skills, subjects: data.subjects });

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
        max_completion_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("RATE_LIMIT");
      if (res.status === 402) throw new Error("NO_CREDITS");
      throw new Error(text || `AI request failed (${res.status})`);
    }

    const json = (await res.json()) as {
      output_text?: string;
      output?: { content?: { type: string; text?: string }[] }[];
    };
    const text =
      json.output_text ??
      json.output
        ?.flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("") ??
      "";

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned an unreadable answer");
    const parsed = JSON.parse(match[0]) as { recommendations?: Recommendation[] };
    return (parsed.recommendations ?? []).slice(0, 6);
  });
