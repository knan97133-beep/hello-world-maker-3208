/** mark_complete — record completion of a learning item. */
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "mark_complete",
  title: "Mark item complete",
  description:
    "Mark a resource, project, challenge or quiz as completed for the signed-in student in a given subject.",
  inputSchema: {
    subject_code: z.string().trim().min(1).describe("Subject code, e.g. CS101."),
    item_type: z
      .enum(["resource", "project", "challenge", "quiz"])
      .describe("Kind of item being completed."),
    item_id: z.string().uuid().optional().describe("UUID of the resource/project/challenge."),
    score: z.number().min(0).max(100).optional().describe("Quiz score percentage."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ subject_code, item_type, item_id, score }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);

    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("code", subject_code.toUpperCase())
      .maybeSingle();
    if (!subject)
      return {
        content: [{ type: "text", text: `No subject with code ${subject_code}` }],
        isError: true,
      };

    const { data, error } = await supabase
      .from("progress")
      .insert({
        user_id: ctx.getUserId()!,
        subject_id: subject.id,
        item_type,
        item_id: item_id ?? null,
        score: score ?? null,
        completed: true,
      })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { row: data?.[0] },
    };
  },
});
