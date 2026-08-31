import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  "w-full rounded-2xl border border-hair bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent";
const btnBase =
  "h-10 min-w-[120px] rounded-2xl px-4 text-center text-sm font-medium transition-all disabled:opacity-60";
const pill =
  `${btnBase} border border-accent bg-accent text-accent-foreground hover:brightness-110`;
const ghost =
  `${btnBase} border border-hair bg-transparent text-foreground hover:border-accent hover:text-accent`;
const card =
  "rounded-3xl border border-hair bg-card/40 p-6";
const sectionTitle =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [dirtyLinkIds, setDirtyLinkIds] = useState<Set<string>>(new Set());
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayli yuklanadi");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan kichik bo'lishi kerak");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Rasm havolasini olish bo'lmadi");
      return;
    }
    setProfile((p) => (p ? { ...p, avatar_url: data.signedUrl } : p));
    toast.success("Rasm yuklandi — saqlashni bosing");
  }

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
    setSavingLinkId(link.id);
    const { error } = await supabase
      .from("links")
      .update({
        label: link.label,
        url: link.url,
        sort_order: link.sort_order,
        is_visible: true,
      })
      .eq("id", link.id);
    setSavingLinkId(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Havola saqlandi");
      setDirtyLinkIds((prev) => {
        const next = new Set(prev);
        next.delete(link.id);
        return next;
      });
    }
  }

  async function addLink() {
    const { data, error } = await supabase
      .from("links")
      .insert({ label: "Yangi havola", url: "https://", sort_order: links.length + 1, is_visible: true })
      .select("id,label,url,sort_order,is_visible")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const newLink = data as LinkRow;
    setLinks((prev) => [...prev, newLink]);
    setDirtyLinkIds((prev) => new Set(prev).add(newLink.id));
  }

  async function removeLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setDirtyLinkIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
    <main className="mx-auto w-full max-w-[640px] px-6 py-14">
      <div className="flex items-center justify-between gap-4 border-b border-hair pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Admin panel
        </h1>
        <button type="button" onClick={signOut} className="text-sm text-muted-foreground hover:text-accent">
          Chiqish
        </button>
      </div>

      <section className={`${card} mt-8 flex flex-col gap-3`}>
        <h2 className={sectionTitle}>Profil</h2>
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-hair p-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="h-20 w-20 shrink-0 rounded-full border-2 border-hair object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-hair text-xs text-muted-foreground">
              rasm
            </div>
          )}
          <span className="text-sm text-muted-foreground">Avatar rasmi</span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`${ghost}`}
            >
              {uploading ? "Yuklanmoqda…" : "Rasm tanlash"}
            </button>
            {profile?.avatar_url ? (
              <button
                type="button"
                onClick={() => setProfile((p) => (p ? { ...p, avatar_url: null } : p))}
                className={`${ghost}`}
              >
                O'chirish
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadAvatar(file);
            }}
          />
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className={`${pill} mt-1 w-full sm:min-w-[120px] sm:self-end`}
        >
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </section>

      <section className={`${card} mt-6 flex flex-col gap-5`}>
        <h2 className={sectionTitle}>Havolalar</h2>
        {links.map((l, i) => (
          <div key={l.id} className="flex flex-col gap-2 rounded-2xl border border-hair/70 p-4">
            <input
              className={field}
              value={l.label}
              placeholder="Nomi"
              onChange={(e) => {
                setLinks((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                );
                setDirtyLinkIds((prev) => new Set(prev).add(l.id));
              }}
            />
            <input
              className={field}
              value={l.url}
              placeholder="https://"
              onChange={(e) => {
                setLinks((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                );
                setDirtyLinkIds((prev) => new Set(prev).add(l.id));
              }}
            />
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              {(dirtyLinkIds.has(l.id) || savingLinkId === l.id) && (
                <button
                  type="button"
                  onClick={() => saveLink(l)}
                  disabled={savingLinkId === l.id}
                  className={`${pill}`}
                >
                  {savingLinkId === l.id ? "Saqlanmoqda…" : "Saqlash"}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeLink(l.id)}
                disabled={savingLinkId === l.id}
                className={`${ghost} ${dirtyLinkIds.has(l.id) || savingLinkId === l.id ? "" : "w-full"}`}
              >
                O'chirish
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLink} className={`${ghost} w-full`}>
          + Havola qo'shish
        </button>
      </section>

      <Link
        to="/"
        className="mt-10 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent"
      >
        ← Vizitkaga qaytish
      </Link>
    </main>
  );
}
