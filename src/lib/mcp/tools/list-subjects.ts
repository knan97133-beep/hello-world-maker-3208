/** list_subjects — browse the InfoPath curriculum. */
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_subjects",
  title: "List subjects",
  description: "List InfoPath academic subjects, optionally filtered by study year and semester.",
  inputSchema: {
    year: z.number().int().min(1).max(5).optional().describe("Study year (1-5)."),
    semester: z.number().int().min(1).max(2).optional().describe("Semester (1 or 2)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ year, semester }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("subjects")
      .select("code, name_en, name_ar, year, semester, skills, description_en")
      .order("year")
      .order("semester")
      .order("sort_order");
    if (year !== undefined) query = query.eq("year", year);
    if (semester !== undefined) query = query.eq("semester", semester);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { subjects: data ?? [] },
    };
  },
});
