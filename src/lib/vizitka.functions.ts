import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type VizitkaProfile = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
};

export type VizitkaLink = {
  id: string;
  label: string;
  url: string;
  sort_order: number;
};

export const getVizitka = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  const [profileRes, linksRes] = await Promise.all([
    supabase.from("profile").select("id,name,tagline,bio,avatar_url").limit(1).maybeSingle(),
    supabase
      .from("links")
      .select("id,label,url,sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    profile: (profileRes.data ?? null) as VizitkaProfile | null,
    links: (linksRes.data ?? []) as VizitkaLink[],
  };
});
