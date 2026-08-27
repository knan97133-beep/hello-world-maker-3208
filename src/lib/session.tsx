/**
 * session.tsx
 * -------------------------------------------------------------
 * Client-side authentication helpers for InfoPath.
 * - `useSession()` exposes the current Supabase user (or null while loading).
 * - `useProfile()` loads the signed-in student's row from `profiles`.
 * - `signOut()` clears the query cache and returns the user to /auth.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** Reactive Supabase user. `loading` is true until the first check resolves. */
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Listen first, then read the current session (avoids missing early events).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

/** The signed-in student's profile row (name, university, year, semester). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** All roles held by the signed-in user (student / instructor / admin). */
export function useRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as "student" | "instructor" | "admin");
    },
  });
}

/** True when the signed-in user has the `admin` role. */
export function useIsAdmin(userId: string | undefined) {
  const roles = useRoles(userId);
  return { ...roles, data: roles.data ? roles.data.includes("admin") : undefined };
}

/** True when the signed-in user has the `instructor` role. */
export function useIsInstructor(userId: string | undefined) {
  const roles = useRoles(userId);
  return { ...roles, data: roles.data ? roles.data.includes("instructor") : undefined };
}

/** Subjects assigned to the signed-in instructor. */
export function useMySubjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-subjects", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subject_instructors")
        .select("subject_id, subjects(id, code, name_ar, name_en, year, semester)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}


/** Sign-out hook: cancels queries, clears cache, then redirects to /auth. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
