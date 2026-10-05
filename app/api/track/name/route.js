import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const rateLimit = applyRateLimit(req, "track_name", 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded for name update." },
        { status: 429, headers: rateLimit.headers }
      );
    }

    let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    let supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""
    ).trim().replace(/^["']|["']$/g, "");

    const defaultUrl = "https://pzjkqklnjirovtydoycs.supabase.co";
    const defaultKey = "sb_publishable_64rHjV3LSxtbnUSNVAFAKQ_TbxH1OW_";

    if (!supabaseUrl || !supabaseUrl.includes("supabase.co") || supabaseUrl.startsWith("sb_")) {
      supabaseUrl = defaultUrl;
    } else if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    if (!supabaseKey || supabaseKey.startsWith("http")) {
      supabaseKey = defaultKey;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const { visitorId, name } = body;

    if (!visitorId || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing visitor ID or name." },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const cleanName = name.trim();

    // 1. Update visitor_name in analytics_visitors and mark as genuine human
    const { error: updateError } = await supabase
      .from("analytics_visitors")
      .update({
        visitor_name: cleanName,
        is_bot: false,
        bot_type: null,
        last_seen: new Date().toISOString(),
      })
      .eq("visitor_id", visitorId);

    if (updateError) {
      console.error("Failed to update visitor name:", updateError);
    }

    // 2. Insert event in analytics_events
    try {
      await supabase.from("analytics_events").insert([
        {
          visitor_id: visitorId,
          event_name: "name_captured",
          event_data: { name: cleanName },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json(
      { success: true, visitorId, name: cleanName },
      { headers: rateLimit.headers }
    );
  } catch (err) {
    console.error("Visitor name update error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
