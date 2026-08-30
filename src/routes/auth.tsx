import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Ro'yxatdan o'tildi. Emailni tasdiqlang (kerak bo'lsa).");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google bilan kirish amalga oshmadi");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/admin" });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[360px] flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {mode === "signin" ? "Admin kirish" : "Ro'yxatdan o'tish"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Vizitkani tahrirlash uchun.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full rounded-full border border-hair bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parol"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="w-full rounded-full border border-hair bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {mode === "signin" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>
      </form>

      <button
        type="button"
        onClick={google}
        className="mt-3 w-full rounded-full border border-hair py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
      >
        Google bilan kirish
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
      >
        {mode === "signin" ? "Hisob yaratish" : "Kirishga qaytish"}
      </button>
    </main>
  );
}
