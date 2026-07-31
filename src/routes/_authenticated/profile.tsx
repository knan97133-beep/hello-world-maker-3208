/**
 * _authenticated/profile.tsx — /profile
 * -------------------------------------------------------------
 * Student profile: name, university, bio and default year/semester.
 */
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useProfile, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — InfoPath" },
      {
        name: "description",
        content:
          "Update your InfoPath student profile: name, university, bio and your current academic year and semester.",
      },
      { property: "og:title", content: "My InfoPath profile" },
      { property: "og:description", content: "Manage your student details and study plan." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: profile, isLoading } = useProfile(user?.id);
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUniversity(profile.university ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, university, bio });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(ar ? "تم حفظ التغييرات" : "Profile saved");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "الملف الشخصي" : "My profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{ar ? "جارِ التحميل…" : "Loading…"}</p>
      ) : (
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="name">{ar ? "الاسم الكامل" : "Full name"}</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uni">{ar ? "الجامعة" : "University"}</Label>
            <Input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{ar ? "نبذة عنك" : "Bio"}</Label>
            <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {ar
              ? `سنتك الحالية: ${profile?.current_year ?? "—"} · الفصل: ${profile?.current_semester ?? "—"} (تُغيّر من لوحة التحكم)`
              : `Current year: ${profile?.current_year ?? "—"} · Semester: ${profile?.current_semester ?? "—"} (change it from the dashboard)`}
          </p>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {ar ? "حفظ" : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
