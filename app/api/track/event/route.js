import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pzjkqklnjirovtydoycs.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: true, tracking: false });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
