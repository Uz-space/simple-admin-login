import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin panel — Vizitka" },
      { name: "description", content: "Vizitka ma'lumotlari va havolalarni tahrirlash paneli." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin panel — Vizitka" },
      {
        property: "og:description",
        content: "Vizitka ma'lumotlari va havolalarni tahrirlash paneli.",
      },
    ],
  }),
  component: AdminPage,
});

type Profile = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
};

type LinkRow = {
  id: string;
  label: string;
  url: string;
  sort_order: number;
  is_visible: boolean;
};

const field =
  "w-full rounded-2xl border border-hair bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent";
const pill =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60";
const ghost =
  "rounded-full border border-hair px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function waitForSession() {
      // Preview auth storage restores asynchronously, so retry briefly
      // instead of bouncing to /auth on the first empty read.
      for (let i = 0; i < 12; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return data.session;
        if (!active) return null;
        await new Promise((r) => setTimeout(r, 250));
      }
      return null;
    }

    async function load() {
      const session = await waitForSession();
      if (!active) return;
      if (!session) {
        await navigate({ to: "/auth", replace: true });
        return;
      }
      const userId = session.user.id;
      const [roleRes, profileRes, linksRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin"),
        supabase.from("profile").select("id,name,tagline,bio,avatar_url").limit(1).maybeSingle(),
        supabase
          .from("links")
          .select("id,label,url,sort_order,is_visible")
          .order("sort_order", { ascending: true }),
      ]);
      if (!active) return;
      setIsAdmin((roleRes.data?.length ?? 0) > 0);
      setProfile((profileRes.data as Profile | null) ?? null);
      setLinks((linksRes.data as LinkRow[] | null) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [navigate]);


  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profile")
      .update({
        name: profile.name,
        tagline: profile.tagline,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saqlandi");
  }

  async function saveLink(link: LinkRow) {
    const { error } = await supabase
      .from("links")
      .update({
        label: link.label,
        url: link.url,
        sort_order: link.sort_order,
        is_visible: link.is_visible,
      })
      .eq("id", link.id);
    if (error) toast.error(error.message);
    else toast.success("Havola saqlandi");
  }

  async function addLink() {
    const { data, error } = await supabase
      .from("links")
      .insert({ label: "Yangi havola", url: "https://", sort_order: links.length + 1 })
      .select("id,label,url,sort_order,is_visible")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setLinks((prev) => [...prev, data as LinkRow]);
  }

  async function removeLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
        Yuklanmoqda…
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-[380px] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Ruxsat yo'q</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu hisob admin emas.
          </p>
          <button type="button" onClick={signOut} className={`${ghost} mt-6`}>
            Chiqish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Admin panel
        </h1>
        <button type="button" onClick={signOut} className="text-sm text-muted-foreground hover:text-accent">
          Chiqish
        </button>
      </div>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Profil
        </h2>
        <input
          className={field}
          value={profile?.name ?? ""}
          placeholder="Ism"
          onChange={(e) => setProfile((p) => (p ? { ...p, name: e.target.value } : p))}
        />
        <input
          className={field}
          value={profile?.tagline ?? ""}
          placeholder="Sarlavha / joylashuv"
          onChange={(e) => setProfile((p) => (p ? { ...p, tagline: e.target.value } : p))}
        />
        <textarea
          className={`${field} min-h-28`}
          value={profile?.bio ?? ""}
          placeholder="Qisqacha ma'lumot"
          onChange={(e) => setProfile((p) => (p ? { ...p, bio: e.target.value } : p))}
        />
        <input
          className={field}
          value={profile?.avatar_url ?? ""}
          placeholder="Avatar rasm havolasi (ixtiyoriy)"
          onChange={(e) => setProfile((p) => (p ? { ...p, avatar_url: e.target.value } : p))}
        />
        <button type="button" onClick={saveProfile} disabled={saving} className={`${pill} self-start`}>
          Saqlash
        </button>
      </section>

      <section className="mt-14 flex flex-col gap-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Havolalar
        </h2>
        {links.map((l, i) => (
          <div key={l.id} className="flex flex-col gap-2 border-t border-hair pt-5">
            <input
              className={field}
              value={l.label}
              placeholder="Nomi"
              onChange={(e) =>
                setLinks((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                )
              }
            />
            <input
              className={field}
              value={l.url}
              placeholder="https://"
              onChange={(e) =>
                setLinks((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
              }
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={l.is_visible}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, is_visible: e.target.checked } : x)),
                    )
                  }
                />
                Ko'rinsin
              </label>
              <button type="button" onClick={() => saveLink(l)} className={pill}>
                Saqlash
              </button>
              <button type="button" onClick={() => removeLink(l.id)} className={ghost}>
                O'chirish
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLink} className={`${ghost} self-start`}>
          + Havola qo'shish
        </button>
      </section>

      <Link
        to="/"
        className="mt-14 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
      >
        ← Vizitkaga qaytish
      </Link>
    </main>
  );
}
