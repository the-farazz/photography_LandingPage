import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const rateLimit = applyRateLimit(req, "track_event", 120, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded for event tracking." },
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
    const { visitorId, eventName, eventData, path } = body;

    if (!visitorId || !eventName) {
      return NextResponse.json({ success: false, error: "Missing event parameters." }, { status: 400 });
    }

    // Insert into analytics_events
    try {
      await supabase.from("analytics_events").insert([
        {
          visitor_id: visitorId,
          event_name: eventName,
          event_data: eventData || {},
          path: path || "/",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      // Graceful fallback if table is newly initializing
    }

    // Also update visitor last_seen for live status & human verification
    const isHumanSignal =
      eventName === "human_verified" ||
      eventName === "cta_click" ||
      eventName === "section_view";

    await supabase
      .from("analytics_visitors")
      .update({
        last_seen: new Date().toISOString(),
        ...(isHumanSignal ? { is_bot: false, bot_type: null } : {}),
      })
      .eq("visitor_id", visitorId);

    return NextResponse.json({ success: true }, { headers: rateLimit.headers });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
