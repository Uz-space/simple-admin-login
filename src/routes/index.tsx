import { createFileRoute, Link } from "@tanstack/react-router";
import { getVizitka } from "@/lib/vizitka.functions";

export const Route = createFileRoute("/")({
  loader: () => getVizitka(),
  head: () => ({
    meta: [
      { title: "Diyorbek Valiyev — Vizitka" },
      { name: "description", content: "Diyorbek Valiyev — shaxsiy raqamli vizitka va havolalar." },
      { property: "og:title", content: "Diyorbek Valiyev — Vizitka" },
      {
        property: "og:description",
        content: "Diyorbek Valiyev — shaxsiy raqamli vizitka va havolalar.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Vizitka,
  errorComponent: () => (
    <main className="grid min-h-dvh place-items-center px-6 text-sm text-muted-foreground">
      Ma'lumotni yuklab bo'lmadi.
    </main>
  ),
});

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function Vizitka() {
  const { profile, links } = Route.useLoaderData();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[380px] flex-col items-center px-6 py-20 text-center">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="size-28 rounded-full border-2 border-hair object-cover"
        />
      ) : (
        <div className="grid size-28 place-items-center rounded-full border-2 border-hair bg-muted font-display text-2xl text-muted-foreground">
          {initials(profile?.name ?? "")}
        </div>
      )}

      <h1 className="mt-7 font-display text-3xl font-semibold tracking-tight text-foreground">
        {profile?.name}
      </h1>

      {profile?.tagline ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {profile.tagline}
        </p>
      ) : null}

      {profile?.bio ? (
        <p className="mt-5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {profile.bio}
        </p>
      ) : null}

      <nav className="mt-10 flex w-full flex-col gap-3">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full border border-hair py-3.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <Link
        to="/auth"
        className="mt-auto pt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-accent"
      >
        Admin
      </Link>
    </main>
  );
}
