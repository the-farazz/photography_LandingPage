import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  const { url, key } = getCredentials();
  return createBrowserClient(url, key);
}

