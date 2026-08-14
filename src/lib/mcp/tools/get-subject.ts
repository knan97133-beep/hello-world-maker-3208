/** get_subject — full learning content for one subject. */
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_subject",
  title: "Get subject details",
  description:
    "Get one InfoPath subject by its code, including its resources (courses, videos, books), projects and challenges.",
  inputSchema: { code: z.string().trim().min(1).describe("Subject code, e.g. CS101.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ code }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: subject, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!subject)
      return { content: [{ type: "text", text: `No subject with code ${code}` }], isError: true };

    const [resources, projects, challenges] = await Promise.all([
      supabase.from("resources").select("*").eq("subject_id", subject.id),
      supabase.from("projects").select("*").eq("subject_id", subject.id),
      supabase.from("challenges").select("*").eq("subject_id", subject.id),
    ]);

    const payload = {
      subject,
      resources: resources.data ?? [],
      projects: projects.data ?? [],
      challenges: challenges.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
