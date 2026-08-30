import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usernameToEmail } from "@/lib/admin-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin kirish — Diyorbek Valiyev" },
      { name: "description", content: "Vizitkani tahrirlash uchun admin panelga kirish." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin kirish — Diyorbek Valiyev" },
      { property: "og:description", content: "Vizitkani tahrirlash uchun admin panelga kirish." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session) await navigate({ to: "/admin", replace: true });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) throw new Error("Login yoki parol xato");
      await navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-[340px]">
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground">
          Admin kirish
        </h1>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2.5">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Login"
            autoCapitalize="none"
            autoComplete="username"
            className="w-full rounded-full border border-hair bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            autoComplete="current-password"
            className="w-full rounded-full border border-hair bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Kirilmoqda…" : "Kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}

