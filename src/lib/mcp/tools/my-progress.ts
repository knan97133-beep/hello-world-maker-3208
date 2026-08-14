/** my_progress — the signed-in student's progress summary. */
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_progress",
  title: "My progress",
  description:
    "Get the signed-in student's InfoPath profile and completed items (resources, projects, challenges, quizzes).",
  inputSchema: {
    subject_code: z.string().trim().optional().describe("Optional subject code to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ subject_code }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, university, year, semester")
      .eq("id", ctx.getUserId()!)
      .maybeSingle();

    let subjectId: string | null = null;
    if (subject_code) {
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
      subjectId = subject.id;
    }

    let query = supabase
      .from("progress")
      .select("item_type, item_id, completed, score, subject_id, updated_at")
      .eq("user_id", ctx.getUserId()!);
    if (subjectId) query = query.eq("subject_id", subjectId);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const payload = { profile, progress: data ?? [], completed: (data ?? []).filter((r) => r.completed).length };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
