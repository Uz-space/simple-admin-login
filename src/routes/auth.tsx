import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-[360px] flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Admin kirish
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vizitkani tahrirlash uchun login va parolni kiriting.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Login"
          autoCapitalize="none"
          autoComplete="username"
          className="w-full rounded-full border border-hair bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parol"
          autoComplete="current-password"
          className="w-full rounded-full border border-hair bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Kirilmoqda…" : "Kirish"}
        </button>
      </form>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Ro'yxatdan o'tish yopiq
      </p>
    </main>
  );
}
