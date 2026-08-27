/**
 * RoleManager.tsx
 * -------------------------------------------------------------
 * Admin-only panel implementing the three-tier permission system:
 *  - Student    : learns only.
 *  - Instructor : manages content of the subjects assigned to them.
 *  - Admin      : manages the whole platform.
 * The admin can grant/revoke roles and assign subjects to instructors.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Role = "student" | "instructor" | "admin";
const ROLES: Role[] = ["student", "instructor", "admin"];

export function RoleManager() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const [assign, setAssign] = useState<{ userId: string; subjectId: string }>({ userId: "", subjectId: "" });

  // All users with their roles (admins can read profiles + user_roles).
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, full_name, university").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      return (profiles.data ?? []).map((p) => ({
        ...p,
        roles: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
    },
  });

  const subjects = useQuery({
    queryKey: ["admin-subjects-select", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, code, name_ar, name_en")
        .order("year")
        .order("semester");
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignments = useQuery({
    queryKey: ["subject-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subject_instructors")
        .select("id, user_id, subject_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["subject-instructors"] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  const toggleRole = useMutation({
    mutationFn: async (input: { userId: string; role: Role; has: boolean }) => {
      const { error } = input.has
        ? await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", input.userId)
            .eq("role", input.role)
        : await supabase.from("user_roles").insert({ user_id: input.userId, role: input.role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم تحديث الصلاحية" : "Role updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addAssignment = useMutation({
    mutationFn: async () => {
      if (!assign.userId || !assign.subjectId) throw new Error(ar ? "اختر مدرّساً ومادة" : "Pick an instructor and a subject");
      const { error } = await supabase
        .from("subject_instructors")
        .insert({ user_id: assign.userId, subject_id: assign.subjectId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم إسناد المادة" : "Subject assigned");
      setAssign({ userId: "", subjectId: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subject_instructors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الإلغاء" : "Removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const instructors = (users.data ?? []).filter((u) => u.roles.includes("instructor"));
  const nameOf = (id: string) => users.data?.find((u) => u.id === id)?.full_name ?? id.slice(0, 8);
  const subjectOf = (id: string) => {
    const s = subjects.data?.find((x) => x.id === id);
    return s ? `${s.code} — ${ar ? s.name_ar : s.name_en}` : id.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="size-4 text-primary" />
            {ar ? "المستخدمون والصلاحيات" : "Users & roles"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {users.data?.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.full_name || (ar ? "بدون اسم" : "Unnamed")}</p>
                <p className="text-xs text-muted-foreground">{u.university || "—"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((role) => {
                  const has = u.roles.includes(role);
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={has ? "default" : "outline"}
                      disabled={toggleRole.isPending}
                      onClick={() => toggleRole.mutate({ userId: u.id, role, has })}
                    >
                      {has && <ShieldCheck className="size-3.5" />}
                      {role === "student"
                        ? ar
                          ? "طالب"
                          : "Student"
                        : role === "instructor"
                          ? ar
                            ? "مدرّس"
                            : "Instructor"
                          : ar
                            ? "مدير"
                            : "Admin"}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "إسناد المواد للمدرّسين" : "Assign subjects to instructors"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              value={assign.userId}
              onChange={(e) => setAssign({ ...assign, userId: e.target.value })}
            >
              <option value="">{ar ? "اختر مدرّساً…" : "Select instructor…"}</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name || i.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              value={assign.subjectId}
              onChange={(e) => setAssign({ ...assign, subjectId: e.target.value })}
            >
              <option value="">{ar ? "اختر مادة…" : "Select subject…"}</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {ar ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
            <Button onClick={() => addAssignment.mutate()} disabled={addAssignment.isPending}>
              {addAssignment.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {ar ? "إسناد" : "Assign"}
            </Button>
          </div>

          {instructors.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {ar
                ? "لا يوجد مدرّسون بعد — امنح أحد المستخدمين صلاحية «مدرّس» أولاً."
                : "No instructors yet — grant a user the Instructor role first."}
            </p>
          )}

          <div className="space-y-2">
            {assignments.data?.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {nameOf(a.user_id)} · {subjectOf(a.subject_id)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove"
                  onClick={() => removeAssignment.mutate(a.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
