import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getCredentials() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");

  const defaultUrl = "https://pzjkqklnjirovtydoycs.supabase.co";
  const defaultKey = "sb_publishable_64rHjV3LSxtbnUSNVAFAKQ_TbxH1OW_";

  if (!url || !url.includes("supabase.co") || url.startsWith("sb_")) {
    url = defaultUrl;
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  if (!key || key.startsWith("http") || key.includes("supabase.co")) {
    key = defaultKey;
  }

  return { url, key };
}

export async function createClient() {
  const cookieStore = cookies();
  const { url, key } = getCredentials();

  return createServerClient(url, key, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server component set cookie warning suppression
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server component remove cookie warning suppression
        }
      },
    },
  });
}
