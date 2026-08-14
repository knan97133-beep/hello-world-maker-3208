/**
 * index.ts — InfoPath MCP server definition.
 * -------------------------------------------------------------
 * Exposes curriculum + student-progress tools to MCP clients.
 * Auth: Supabase OAuth 2.1 — tools act as the signed-in student.
 * Import-safe: no env reads or I/O at module scope.
 */
import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSubjects from "./tools/list-subjects";
import getSubject from "./tools/get-subject";
import myProgress from "./tools/my-progress";
import markComplete from "./tools/mark-complete";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "infopath",
  title: "InfoPath",
  version: "0.1.0",
  instructions:
    "Tools for InfoPath, a smart academic assistant for IT students. Use `list_subjects` and `get_subject` to explore the curriculum (courses, videos, books, projects, challenges), `my_progress` to read the signed-in student's progress, and `mark_complete` to record finished items.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSubjects, getSubject, myProgress, markComplete],
});
